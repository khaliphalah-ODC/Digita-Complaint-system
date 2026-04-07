import complaintDB from '../model/connect.js';
import QRCode from 'qrcode';
import { fetchUserByIdQuery } from '../model/user.model.js';
import {
  deleteFeedbackFieldById,
  FeedbackFormFieldsTable,
  FeedbackFormsTable,
  FeedbackSubmissionsTable,
  insertFeedbackFieldQuery,
  insertFeedbackFormQuery,
  insertFeedbackSubmissionQuery,
  selectFeedbackFieldById,
  selectFeedbackFieldsByFormId,
  selectFeedbackFormByOrganizationId,
  selectFeedbackFormBySlug,
  selectFeedbackSubmissionById,
  selectFeedbackSubmissionsByOrganizationId,
  updateFeedbackFieldById,
  updateFeedbackFieldSortOrderById,
  updateFeedbackFormByOrganizationId
} from '../model/publicFeedback.model.js';
import { selectOrganizationById, selectOrganizationByPublicFeedbackSlug } from '../model/organization.model.js';
import { sendError, sendSuccess } from '../utils/response.js';
import {
  createSystemNotificationSafely,
  NOTIFICATION_TYPES
} from '../services/notification.service.js';

const ALLOWED_FIELD_TYPES = new Set([
  'short_text',
  'long_text',
  'email',
  'phone',
  'rating',
  'select',
  'checkbox',
  'radio',
  'yes_no'
]);

const DEFAULT_FIELD_TEMPLATES = [
  {
    label: 'Overall Rating',
    field_key: 'overall_rating',
    field_type: 'rating',
    placeholder: '',
    help_text: 'Tell us how you would rate your experience.',
    is_required: 1,
    is_active: 1,
    options_json: null,
    sort_order: 1
  },
  {
    label: 'Your Feedback',
    field_key: 'message_summary',
    field_type: 'long_text',
    placeholder: 'Tell us about your experience.',
    help_text: 'Share what went well or what could be improved.',
    is_required: 1,
    is_active: 1,
    options_json: null,
    sort_order: 2
  },
  {
    label: 'Your Name',
    field_key: 'respondent_name',
    field_type: 'short_text',
    placeholder: 'Optional',
    help_text: 'Leave blank if you prefer to stay anonymous.',
    is_required: 0,
    is_active: 1,
    options_json: null,
    sort_order: 3
  },
  {
    label: 'Email Address',
    field_key: 'respondent_email',
    field_type: 'email',
    placeholder: 'Optional',
    help_text: 'Optional contact email for follow-up.',
    is_required: 0,
    is_active: 1,
    options_json: null,
    sort_order: 4
  }
];

const LEGACY_ACTIVE_TABLES = {
  forms: 'public_feedback_forms',
  submissions: 'public_feedback_submissions'
};

const LEGACY_ARCHIVE_TABLES = {
  forms: 'legacy_public_feedback_forms_backup',
  submissions: 'legacy_public_feedback_submissions_backup'
};

const getQuery = (sql, params = []) =>
  new Promise((resolve, reject) => {
    complaintDB.get(sql, params, (err, row) => {
      if (err) return reject(err);
      return resolve(row || null);
    });
  });

const allQuery = (sql, params = []) =>
  new Promise((resolve, reject) => {
    complaintDB.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      return resolve(rows || []);
    });
  });

const runQuery = (sql, params = []) =>
  new Promise((resolve, reject) => {
    complaintDB.run(sql, params, function onRun(err) {
      if (err) return reject(err);
      return resolve(this);
    });
  });

const tableExists = async (tableName) => {
  const row = await getQuery(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1",
    [tableName]
  );
  return Boolean(row?.name);
};

const getTableColumns = async (tableName) => {
  if (!await tableExists(tableName)) return [];
  return allQuery(`PRAGMA table_info(${tableName})`);
};

const toBooleanNumber = (value, fallback = 0) => {
  if ([true, 1, '1', 'true'].includes(value)) return 1;
  if ([false, 0, '0', 'false'].includes(value)) return 0;
  return fallback;
};

const asText = (value, fallback = '') => String(value ?? fallback).trim();

const normalizeFieldKey = (value) => asText(value)
  .toLowerCase()
  .replace(/[^a-z0-9_]+/g, '_')
  .replace(/^_+|_+$/g, '')
  .slice(0, 64);

const safeParseJson = (value, fallback) => {
  try {
    return JSON.parse(value);
  } catch (_error) {
    return fallback;
  }
};

const buildPublicFeedbackUrl = (slug) => {
  const base = process.env.PUBLIC_FEEDBACK_URL_BASE || 'http://localhost:5173/public-feedback/';
  return `${String(base).replace(/\/?$/, '/')}${encodeURIComponent(slug)}`;
};

const buildPublicFeedbackQrDataUrl = async (publicUrl) => QRCode.toDataURL(publicUrl, {
  errorCorrectionLevel: 'M',
  margin: 1,
  width: 220,
  color: {
    dark: '#16345b',
    light: '#ffffffff'
  }
});

const getScopedOrganizationForRequest = async (req, { allowSuperAdmin = false } = {}) => {
  if (!req.user?.id) {
    return { unauthorized: 'Unauthorized' };
  }

  if (req.user.role === 'super_admin' && !allowSuperAdmin) {
    return { forbidden: 'Super admin cannot manage organization-specific feedback forms directly.' };
  }

  const userRow = await getQuery(fetchUserByIdQuery, [req.user.id]);
  if (!userRow) {
    return { unauthorized: 'Authenticated user does not exist' };
  }
  if (!userRow.organization_id) {
    return { forbidden: 'This account is not linked to an organization' };
  }

  const organization = await getQuery(selectOrganizationById, [userRow.organization_id]);
  if (!organization) {
    return { notFound: 'Organization not found' };
  }

  return { organization, user: userRow };
};

const normalizeFieldOptions = (fieldType, rawOptions) => {
  if (!['select', 'radio', 'checkbox', 'yes_no'].includes(fieldType)) {
    return null;
  }

  if (fieldType === 'yes_no') {
    return ['Yes', 'No'];
  }

  const values = Array.isArray(rawOptions)
    ? rawOptions
    : String(rawOptions || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

  const uniqueValues = [...new Set(values.map((item) => String(item).trim()).filter(Boolean))].slice(0, 20);
  return uniqueValues;
};

const normalizeFieldPayload = (payload = {}, { fallbackSortOrder = 1, existingField = null } = {}) => {
  const fieldType = asText(payload.field_type || existingField?.field_type).toLowerCase();
  if (!ALLOWED_FIELD_TYPES.has(fieldType)) {
    throw new Error(`field_type must be one of: ${[...ALLOWED_FIELD_TYPES].join(', ')}`);
  }

  const fieldKey = normalizeFieldKey(payload.field_key || existingField?.field_key);
  if (!fieldKey) {
    throw new Error('field_key is required');
  }

  const label = asText(payload.label || existingField?.label);
  if (!label) {
    throw new Error('label is required');
  }

  const sortOrder = Number(payload.sort_order ?? existingField?.sort_order ?? fallbackSortOrder);
  const normalizedOptions = normalizeFieldOptions(fieldType, payload.options ?? existingField?.options_json ?? existingField?.options);

  if (['select', 'radio', 'checkbox'].includes(fieldType) && (!Array.isArray(normalizedOptions) || !normalizedOptions.length)) {
    throw new Error(`${fieldType} fields require at least one option`);
  }

  return {
    label,
    field_key: fieldKey,
    field_type: fieldType,
    placeholder: asText(payload.placeholder ?? existingField?.placeholder),
    help_text: asText(payload.help_text ?? existingField?.help_text),
    is_required: toBooleanNumber(payload.is_required ?? existingField?.is_required, 0),
    is_active: toBooleanNumber(payload.is_active ?? existingField?.is_active, 1),
    options_json: normalizedOptions ? JSON.stringify(normalizedOptions) : null,
    sort_order: Number.isFinite(sortOrder) ? sortOrder : fallbackSortOrder
  };
};

const normalizeFieldRow = (row) => ({
  id: row.id,
  form_id: row.form_id,
  label: row.label,
  field_key: row.field_key,
  field_type: row.field_type,
  placeholder: row.placeholder || '',
  help_text: row.help_text || '',
  is_required: Number(row.is_required || 0),
  is_active: Number(row.is_active || 0),
  options: safeParseJson(row.options_json, []),
  sort_order: Number(row.sort_order || 0),
  created_at: row.created_at || null,
  updated_at: row.updated_at || null
});

const normalizeSubmissionRow = (row) => ({
  ...row,
  is_anonymous: Number(row.is_anonymous || 0),
  rating: row.rating == null ? null : Number(row.rating),
  respondent_name: row.respondent_name || null,
  respondent_email: row.respondent_email || null,
  respondent_phone: row.respondent_phone || null,
  message_summary: row.message_summary || null,
  responses: safeParseJson(row.response_json, {})
});

const buildPublishState = ({ form, fields }) => {
  const activeFields = (fields || []).filter((field) => Number(field.is_active || 0) === 1);
  const requiredIdentityFieldKeys = ['respondent_name', 'respondent_email', 'respondent_phone'];
  const hasVisibleFields = activeFields.length > 0;
  const hasMeaningfulPrompt = activeFields.some((field) => ['message_summary', 'overall_rating'].includes(field.field_key));
  const hasIdentityTrap = activeFields.some((field) => (
    requiredIdentityFieldKeys.includes(field.field_key) && Number(field.is_required || 0) === 1
  ));

  let state = 'draft';
  let label = 'Draft';
  let description = 'Continue configuring fields before publishing this form publicly.';

  if (!Number(form.is_public || 0)) {
    state = 'private';
    label = 'Private';
    description = 'The form is configured but hidden from the public.';
  } else if (!Number(form.is_active || 0)) {
    state = 'paused';
    label = 'Paused';
    description = 'The public page exists, but new submissions are currently disabled.';
  } else if (hasVisibleFields && hasMeaningfulPrompt) {
    state = 'published';
    label = 'Published';
    description = 'The form is live and accepting public responses.';
  } else if (hasVisibleFields) {
    state = 'ready';
    label = 'Ready to Publish';
    description = 'The form is close to publishable but would benefit from a stronger feedback prompt.';
  }

  return {
    state,
    label,
    description,
    checklist: [
      { key: 'public', label: 'Public link enabled', complete: Number(form.is_public || 0) === 1 },
      { key: 'active', label: 'Accepting submissions', complete: Number(form.is_active || 0) === 1 },
      { key: 'fields', label: 'At least one active field', complete: hasVisibleFields },
      { key: 'prompt', label: 'Includes a rating or feedback prompt', complete: hasMeaningfulPrompt },
      { key: 'anonymous', label: 'Anonymous flow is safe', complete: !hasIdentityTrap || !Number(form.allow_anonymous || 0) }
    ]
  };
};

const countRowsForOrganization = async (tableName, organizationId) => {
  if (!await tableExists(tableName)) return 0;
  const row = await getQuery(`SELECT COUNT(*) AS count FROM ${tableName} WHERE organization_id = ?`, [organizationId]);
  return Number(row?.count || 0);
};

const getLegacyMigrationStatus = async (organizationId) => {
  const activeFormsTableExists = await tableExists(LEGACY_ACTIVE_TABLES.forms);
  const activeSubmissionsTableExists = await tableExists(LEGACY_ACTIVE_TABLES.submissions);
  const archivedFormsTableExists = await tableExists(LEGACY_ARCHIVE_TABLES.forms);
  const archivedSubmissionsTableExists = await tableExists(LEGACY_ARCHIVE_TABLES.submissions);

  const activeLegacyForms = await countRowsForOrganization(LEGACY_ACTIVE_TABLES.forms, organizationId);
  const activeLegacySubmissions = await countRowsForOrganization(LEGACY_ACTIVE_TABLES.submissions, organizationId);
  const archivedLegacyForms = await countRowsForOrganization(LEGACY_ARCHIVE_TABLES.forms, organizationId);
  const archivedLegacySubmissions = await countRowsForOrganization(LEGACY_ARCHIVE_TABLES.submissions, organizationId);

  const organizationHadLegacyRecords = activeLegacyForms > 0 || activeLegacySubmissions > 0 || archivedLegacyForms > 0 || archivedLegacySubmissions > 0;

  let state = 'not_detected';
  let label = 'No Legacy Data';
  let description = 'This organization has no legacy public-feedback data to migrate.';

  if (organizationHadLegacyRecords && (activeFormsTableExists || activeSubmissionsTableExists)) {
    state = 'active';
    label = 'Migration Active';
    description = 'Legacy public-feedback tables are still present while the upgraded system runs.';
  } else if (organizationHadLegacyRecords && (archivedFormsTableExists || archivedSubmissionsTableExists)) {
    state = 'retired';
    label = 'Legacy Tables Retired';
    description = 'Legacy public-feedback data was migrated and the old tables were archived safely.';
  } else if (organizationHadLegacyRecords) {
    state = 'migrated';
    label = 'Migrated';
    description = 'Legacy public-feedback data was migrated into the normalized builder.';
  }

  return {
    state,
    label,
    description,
    organization_had_legacy_records: organizationHadLegacyRecords,
    active_legacy_tables: activeFormsTableExists || activeSubmissionsTableExists,
    archived_legacy_tables: archivedFormsTableExists || archivedSubmissionsTableExists,
    retained_records: {
      active_forms: activeLegacyForms,
      active_submissions: activeLegacySubmissions,
      archived_forms: archivedLegacyForms,
      archived_submissions: archivedLegacySubmissions
    }
  };
};

const buildFormResponse = async ({ organization, form, fields }) => {
  const publicUrl = buildPublicFeedbackUrl(form.slug);
  const publish = buildPublishState({ form, fields });
  const legacyMigration = await getLegacyMigrationStatus(organization.organization_id);

  return {
    id: form.id,
    organization_id: organization.organization_id,
    organization_name: organization.name,
    organization_slug: form.slug,
    title: form.title,
    description: form.description || '',
    is_public: Number(form.is_public || 0),
    is_active: Number(form.is_active || 0),
    allow_anonymous: Number(form.allow_anonymous || 0),
    version: Number(form.version || 1),
    publish_state: publish.state,
    publish_label: publish.label,
    publish_description: publish.description,
    publish_checklist: publish.checklist,
    legacy_migration: legacyMigration,
    public_url: publicUrl,
    public_qr_url: await buildPublicFeedbackQrDataUrl(publicUrl),
    fields: fields.map(normalizeFieldRow),
    created_at: form.created_at || null,
    updated_at: form.updated_at || null
  };
};

const seedDefaultFields = async (formId) => {
  for (const field of DEFAULT_FIELD_TEMPLATES) {
    await runQuery(insertFeedbackFieldQuery, [
      formId,
      field.label,
      field.field_key,
      field.field_type,
      field.placeholder,
      field.help_text,
      field.is_required,
      field.is_active,
      field.options_json,
      field.sort_order
    ]);
  }
};

const normalizeLegacyField = (field = {}, index = 0) => {
  const fieldType = asText(field.field_type || field.type || 'short_text').toLowerCase();
  const normalizedType = ALLOWED_FIELD_TYPES.has(fieldType) ? fieldType : 'short_text';
  const label = asText(field.label || field.title || `Field ${index + 1}`);
  const fieldKey = normalizeFieldKey(field.field_key || field.key || label);
  const options = normalizeFieldOptions(normalizedType, field.options || field.values || field.choices);

  return {
    label,
    field_key: fieldKey || `field_${index + 1}`,
    field_type: normalizedType,
    placeholder: asText(field.placeholder),
    help_text: asText(field.help_text || field.help),
    is_required: toBooleanNumber(field.is_required ?? field.required, 0),
    is_active: toBooleanNumber(field.is_active ?? field.enabled, 1),
    options_json: options ? JSON.stringify(options) : null,
    sort_order: Number(field.sort_order ?? field.order ?? index + 1) || index + 1
  };
};

const migrateLegacyPublicFeedbackData = async () => {
  const hasLegacyForms = await tableExists('public_feedback_forms');
  if (!hasLegacyForms) return;

  const formColumns = (await getTableColumns('public_feedback_forms')).map((column) => column.name);
  const submissionColumns = (await getTableColumns('public_feedback_submissions')).map((column) => column.name);
  const legacyForms = await allQuery('SELECT * FROM public_feedback_forms ORDER BY id ASC');

  for (const legacyForm of legacyForms) {
    const organizationId = Number(
      legacyForm.organization_id ?? legacyForm.org_id ?? legacyForm.organizationId
    );
    if (!organizationId) continue;

    const organization = await getQuery(selectOrganizationById, [organizationId]);
    if (!organization) continue;

    const existingForm = await getQuery(selectFeedbackFormByOrganizationId, [organizationId]);
    let formId = existingForm?.id;

    if (!existingForm) {
      const slug = asText(organization.public_feedback_slug || `org-${organizationId}`);
      const created = await runQuery(insertFeedbackFormQuery, [
        organizationId,
        slug,
        asText(legacyForm.title || `${organization.name} Feedback`),
        asText(legacyForm.description || ''),
        toBooleanNumber(legacyForm.is_public ?? legacyForm.is_enabled, 1),
        toBooleanNumber(legacyForm.is_active ?? legacyForm.is_enabled, 1),
        toBooleanNumber(legacyForm.allow_anonymous, 1),
        Number(legacyForm.version || 1) || 1
      ]);
      formId = created.lastID;
    }

    const currentFields = await allQuery(selectFeedbackFieldsByFormId, [formId]);
    if (!currentFields.length) {
      const parsedFields = safeParseJson(legacyForm.fields_json, []);
      const normalizedFields = Array.isArray(parsedFields) && parsedFields.length
        ? parsedFields.map((field, index) => normalizeLegacyField(field, index))
        : DEFAULT_FIELD_TEMPLATES;
      validateFieldKeysUnique(normalizedFields);

      for (const field of normalizedFields) {
        await runQuery(insertFeedbackFieldQuery, [
          formId,
          field.label,
          field.field_key,
          field.field_type,
          field.placeholder,
          field.help_text,
          field.is_required,
          field.is_active,
          field.options_json,
          field.sort_order
        ]);
      }
    }

    const hasLegacySubmissions = await tableExists('public_feedback_submissions');
    if (!hasLegacySubmissions) continue;

    const legacySubmissionRows = await allQuery(
      'SELECT * FROM public_feedback_submissions WHERE organization_id = ? ORDER BY id ASC',
      [organizationId]
    );

    for (const legacySubmission of legacySubmissionRows) {
      const answersJsonColumn = submissionColumns.includes('answers_json')
        ? 'answers_json'
        : submissionColumns.includes('response_json')
          ? 'response_json'
          : null;

      const responsePayload = answersJsonColumn
        ? safeParseJson(legacySubmission[answersJsonColumn], {})
        : {};

      const duplicate = await getQuery(
        `
        SELECT id
        FROM feedback_submissions
        WHERE organization_id = ?
          AND form_id = ?
          AND created_at = ?
          AND COALESCE(message_summary, '') = COALESCE(?, '')
        LIMIT 1
        `,
        [
          organizationId,
          formId,
          legacySubmission.created_at || null,
          legacySubmission.message_summary ?? legacySubmission.message ?? ''
        ]
      );

      if (duplicate) continue;

      const insertResult = await runQuery(insertFeedbackSubmissionQuery, [
        organizationId,
        formId,
        toBooleanNumber(legacySubmission.is_anonymous, 1),
        legacySubmission.submitted_by_user_id ?? null,
        legacySubmission.respondent_name ?? null,
        legacySubmission.respondent_email ?? null,
        legacySubmission.respondent_phone ?? null,
        JSON.stringify(responsePayload),
        Number(legacySubmission.rating ?? legacySubmission.overall_rating) || null,
        legacySubmission.message_summary ?? legacySubmission.message ?? null
      ]);

      if (legacySubmission.created_at) {
        await runQuery(
          'UPDATE feedback_submissions SET created_at = ? WHERE id = ?',
          [legacySubmission.created_at, insertResult.lastID]
        );
      }
    }
  }
};

const retireLegacyPublicFeedbackTables = async () => {
  for (const [key, tableName] of Object.entries(LEGACY_ACTIVE_TABLES)) {
    const archiveTableName = LEGACY_ARCHIVE_TABLES[key];
    const hasActive = await tableExists(tableName);
    const hasArchive = await tableExists(archiveTableName);

    if (!hasActive || hasArchive) {
      continue;
    }

    await runQuery(`ALTER TABLE ${tableName} RENAME TO ${archiveTableName}`);
  }
};

const ensureFeedbackForm = async (organization) => {
  let form = await getQuery(selectFeedbackFormByOrganizationId, [organization.organization_id]);
  if (!form) {
    const slug = asText(organization.public_feedback_slug || `org-${organization.organization_id}`);
    const created = await runQuery(insertFeedbackFormQuery, [
      organization.organization_id,
      slug,
      `${organization.name} Feedback`,
      `We value your experience with ${organization.name}.`,
      1,
      1,
      1,
      1
    ]);
    await seedDefaultFields(created.lastID);
    form = await getQuery(selectFeedbackFormByOrganizationId, [organization.organization_id]);
  }

  const fields = await allQuery(selectFeedbackFieldsByFormId, [form.id]);
  if (!fields.length) {
    await seedDefaultFields(form.id);
  }

  const refreshedForm = await getQuery(selectFeedbackFormByOrganizationId, [organization.organization_id]);
  const refreshedFields = await allQuery(selectFeedbackFieldsByFormId, [refreshedForm.id]);
  return { form: refreshedForm, fields: refreshedFields };
};

const validateFieldKeysUnique = (fields) => {
  const seen = new Set();
  for (const field of fields) {
    const key = normalizeFieldKey(field.field_key);
    if (seen.has(key)) {
      throw new Error('field keys must be unique per form');
    }
    seen.add(key);
  }
};

const incrementFormVersion = async (organization, currentForm, nextValues = {}) => {
  const nextVersion = Number(currentForm.version || 1) + 1;
  await runQuery(updateFeedbackFormByOrganizationId, [
    nextValues.slug ?? currentForm.slug,
    nextValues.title ?? currentForm.title,
    nextValues.description ?? currentForm.description,
    nextValues.is_public ?? currentForm.is_public,
    nextValues.is_active ?? currentForm.is_active,
    nextValues.allow_anonymous ?? currentForm.allow_anonymous,
    nextVersion,
    organization.organization_id
  ]);
};

const getCurrentManagedFormPayload = async (organization) => {
  const { form, fields } = await ensureFeedbackForm(organization);
  return buildFormResponse({ organization, form, fields });
};

export const CreatePublicFeedbackTables = () => {
  complaintDB.serialize(() => {
    complaintDB.run(FeedbackFormsTable, (formErr) => {
      if (formErr) {
        console.error('Error creating feedback_forms table:', formErr.message);
      }
    });

    complaintDB.run(FeedbackFormFieldsTable, (fieldErr) => {
      if (fieldErr) {
        console.error('Error creating feedback_form_fields table:', fieldErr.message);
      }
    });

    complaintDB.run(FeedbackSubmissionsTable, (submissionErr) => {
      if (submissionErr) {
        console.error('Error creating feedback_submissions table:', submissionErr.message);
      }
    });

    complaintDB.run('CREATE INDEX IF NOT EXISTS idx_feedback_forms_org_id ON feedback_forms(organization_id)');
    complaintDB.run('CREATE INDEX IF NOT EXISTS idx_feedback_fields_form_id ON feedback_form_fields(form_id)');
    complaintDB.run('CREATE INDEX IF NOT EXISTS idx_feedback_submissions_org_id ON feedback_submissions(organization_id)');
    complaintDB.run('CREATE INDEX IF NOT EXISTS idx_feedback_submissions_form_id ON feedback_submissions(form_id)');

    (async () => {
      try {
        await migrateLegacyPublicFeedbackData();
        await retireLegacyPublicFeedbackTables();
      } catch (migrationError) {
        console.error('Error migrating legacy public feedback data:', migrationError.message);
      }
    })();
  });
};

export const getCurrentFeedbackForm = async (req, res) => {
  try {
    if (req.user?.role !== 'org_admin') {
      return sendError(res, 403, 'Only org_admin can manage feedback forms');
    }

    const scoped = await getScopedOrganizationForRequest(req);
    if (scoped.unauthorized) return sendError(res, 401, scoped.unauthorized);
    if (scoped.forbidden) return sendError(res, 403, scoped.forbidden);
    if (scoped.notFound) return sendError(res, 404, scoped.notFound);

    return sendSuccess(res, 200, 'Feedback form retrieved successfully', await getCurrentManagedFormPayload(scoped.organization));
  } catch (error) {
    return sendError(res, 500, 'Failed to load feedback form', error.message);
  }
};

export const createCurrentFeedbackForm = async (req, res) => {
  try {
    if (req.user?.role !== 'org_admin') {
      return sendError(res, 403, 'Only org_admin can manage feedback forms');
    }

    const scoped = await getScopedOrganizationForRequest(req);
    if (scoped.unauthorized) return sendError(res, 401, scoped.unauthorized);
    if (scoped.forbidden) return sendError(res, 403, scoped.forbidden);
    if (scoped.notFound) return sendError(res, 404, scoped.notFound);

    const existing = await getQuery(selectFeedbackFormByOrganizationId, [scoped.organization.organization_id]);
    if (existing) {
      return sendSuccess(res, 200, 'Feedback form already exists', await getCurrentManagedFormPayload(scoped.organization));
    }

    const payload = await getCurrentManagedFormPayload(scoped.organization);
    return sendSuccess(res, 201, 'Feedback form created successfully', payload);
  } catch (error) {
    return sendError(res, 500, 'Failed to create feedback form', error.message);
  }
};

export const updateCurrentFeedbackForm = async (req, res) => {
  try {
    if (req.user?.role !== 'org_admin') {
      return sendError(res, 403, 'Only org_admin can manage feedback forms');
    }

    const scoped = await getScopedOrganizationForRequest(req);
    if (scoped.unauthorized) return sendError(res, 401, scoped.unauthorized);
    if (scoped.forbidden) return sendError(res, 403, scoped.forbidden);
    if (scoped.notFound) return sendError(res, 404, scoped.notFound);

    const { form } = await ensureFeedbackForm(scoped.organization);
    const title = asText(req.body?.title || form.title);
    if (!title) {
      return sendError(res, 400, 'title is required');
    }

    const description = asText(req.body?.description || form.description);
    const isPublic = toBooleanNumber(req.body?.is_public, Number(form.is_public || 1));
    const isActive = toBooleanNumber(req.body?.is_active, Number(form.is_active || 1));
    const allowAnonymous = toBooleanNumber(req.body?.allow_anonymous, Number(form.allow_anonymous || 1));
    const slug = asText(scoped.organization.public_feedback_slug || form.slug);

    await incrementFormVersion(scoped.organization, form, {
      slug,
      title,
      description,
      is_public: isPublic,
      is_active: isActive,
      allow_anonymous: allowAnonymous
    });

    return sendSuccess(res, 200, 'Feedback form updated successfully', await getCurrentManagedFormPayload(scoped.organization));
  } catch (error) {
    return sendError(res, 500, 'Failed to update feedback form', error.message);
  }
};

export const createCurrentFeedbackField = async (req, res) => {
  try {
    if (req.user?.role !== 'org_admin') {
      return sendError(res, 403, 'Only org_admin can manage feedback form fields');
    }

    const scoped = await getScopedOrganizationForRequest(req);
    if (scoped.unauthorized) return sendError(res, 401, scoped.unauthorized);
    if (scoped.forbidden) return sendError(res, 403, scoped.forbidden);
    if (scoped.notFound) return sendError(res, 404, scoped.notFound);

    const { form, fields } = await ensureFeedbackForm(scoped.organization);
    const normalizedField = normalizeFieldPayload(req.body, { fallbackSortOrder: fields.length + 1 });
    validateFieldKeysUnique([...fields, normalizedField]);

    await runQuery(insertFeedbackFieldQuery, [
      form.id,
      normalizedField.label,
      normalizedField.field_key,
      normalizedField.field_type,
      normalizedField.placeholder,
      normalizedField.help_text,
      normalizedField.is_required,
      normalizedField.is_active,
      normalizedField.options_json,
      normalizedField.sort_order
    ]);

    await incrementFormVersion(scoped.organization, form);
    return sendSuccess(res, 201, 'Feedback field created successfully', await getCurrentManagedFormPayload(scoped.organization));
  } catch (error) {
    return sendError(res, 400, 'Failed to create feedback field', error.message);
  }
};

export const updateCurrentFeedbackField = async (req, res) => {
  try {
    if (req.user?.role !== 'org_admin') {
      return sendError(res, 403, 'Only org_admin can manage feedback form fields');
    }

    const scoped = await getScopedOrganizationForRequest(req);
    if (scoped.unauthorized) return sendError(res, 401, scoped.unauthorized);
    if (scoped.forbidden) return sendError(res, 403, scoped.forbidden);
    if (scoped.notFound) return sendError(res, 404, scoped.notFound);

    const { form, fields } = await ensureFeedbackForm(scoped.organization);
    const existingField = await getQuery(selectFeedbackFieldById, [req.params.fieldId]);
    if (!existingField || Number(existingField.form_id) !== Number(form.id)) {
      return sendError(res, 404, 'Feedback field not found');
    }

    const normalizedField = normalizeFieldPayload(req.body, {
      fallbackSortOrder: existingField.sort_order,
      existingField
    });
    const siblingFields = fields.filter((field) => Number(field.id) !== Number(existingField.id));
    validateFieldKeysUnique([...siblingFields, normalizedField]);

    await runQuery(updateFeedbackFieldById, [
      normalizedField.label,
      normalizedField.field_key,
      normalizedField.field_type,
      normalizedField.placeholder,
      normalizedField.help_text,
      normalizedField.is_required,
      normalizedField.is_active,
      normalizedField.options_json,
      normalizedField.sort_order,
      existingField.id
    ]);

    await incrementFormVersion(scoped.organization, form);
    return sendSuccess(res, 200, 'Feedback field updated successfully', await getCurrentManagedFormPayload(scoped.organization));
  } catch (error) {
    return sendError(res, 400, 'Failed to update feedback field', error.message);
  }
};

export const deleteCurrentFeedbackField = async (req, res) => {
  try {
    if (req.user?.role !== 'org_admin') {
      return sendError(res, 403, 'Only org_admin can manage feedback form fields');
    }

    const scoped = await getScopedOrganizationForRequest(req);
    if (scoped.unauthorized) return sendError(res, 401, scoped.unauthorized);
    if (scoped.forbidden) return sendError(res, 403, scoped.forbidden);
    if (scoped.notFound) return sendError(res, 404, scoped.notFound);

    const { form } = await ensureFeedbackForm(scoped.organization);
    const existingField = await getQuery(selectFeedbackFieldById, [req.params.fieldId]);
    if (!existingField || Number(existingField.form_id) !== Number(form.id)) {
      return sendError(res, 404, 'Feedback field not found');
    }

    await runQuery(deleteFeedbackFieldById, [existingField.id]);
    await incrementFormVersion(scoped.organization, form);
    return sendSuccess(res, 200, 'Feedback field deleted successfully', await getCurrentManagedFormPayload(scoped.organization));
  } catch (error) {
    return sendError(res, 500, 'Failed to delete feedback field', error.message);
  }
};

export const reorderCurrentFeedbackFields = async (req, res) => {
  try {
    if (req.user?.role !== 'org_admin') {
      return sendError(res, 403, 'Only org_admin can reorder feedback form fields');
    }

    const scoped = await getScopedOrganizationForRequest(req);
    if (scoped.unauthorized) return sendError(res, 401, scoped.unauthorized);
    if (scoped.forbidden) return sendError(res, 403, scoped.forbidden);
    if (scoped.notFound) return sendError(res, 404, scoped.notFound);

    const { form, fields } = await ensureFeedbackForm(scoped.organization);
    const orderedIds = Array.isArray(req.body?.field_ids) ? req.body.field_ids.map((value) => Number(value)) : [];
    if (!orderedIds.length) {
      return sendError(res, 400, 'field_ids are required');
    }

    const existingIds = fields.map((field) => Number(field.id)).sort((a, b) => a - b);
    const submittedIds = [...orderedIds].sort((a, b) => a - b);
    if (existingIds.length !== submittedIds.length || existingIds.some((value, index) => value !== submittedIds[index])) {
      return sendError(res, 400, 'field_ids must include every current field exactly once');
    }

    for (const [index, fieldId] of orderedIds.entries()) {
      await runQuery(updateFeedbackFieldSortOrderById, [index + 1, fieldId, form.id]);
    }

    await incrementFormVersion(scoped.organization, form);
    return sendSuccess(res, 200, 'Feedback field order updated successfully', await getCurrentManagedFormPayload(scoped.organization));
  } catch (error) {
    return sendError(res, 500, 'Failed to reorder feedback fields', error.message);
  }
};

export const getCurrentFeedbackFormQr = async (req, res) => {
  try {
    if (req.user?.role !== 'org_admin') {
      return sendError(res, 403, 'Only org_admin can access feedback QR details');
    }

    const scoped = await getScopedOrganizationForRequest(req);
    if (scoped.unauthorized) return sendError(res, 401, scoped.unauthorized);
    if (scoped.forbidden) return sendError(res, 403, scoped.forbidden);
    if (scoped.notFound) return sendError(res, 404, scoped.notFound);

    const { form } = await ensureFeedbackForm(scoped.organization);
    const publicUrl = buildPublicFeedbackUrl(form.slug);
    const qrDataUrl = await buildPublicFeedbackQrDataUrl(publicUrl);
    return sendSuccess(res, 200, 'Feedback QR details retrieved successfully', {
      organization_id: scoped.organization.organization_id,
      organization_name: scoped.organization.name,
      slug: form.slug,
      public_url: publicUrl,
      qr_url: qrDataUrl
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to load feedback QR details', error.message);
  }
};

export const getCurrentFeedbackSubmissions = async (req, res) => {
  try {
    if (req.user?.role !== 'org_admin') {
      return sendError(res, 403, 'Only org_admin can access feedback submissions');
    }

    const scoped = await getScopedOrganizationForRequest(req);
    if (scoped.unauthorized) return sendError(res, 401, scoped.unauthorized);
    if (scoped.forbidden) return sendError(res, 403, scoped.forbidden);
    if (scoped.notFound) return sendError(res, 404, scoped.notFound);

    await ensureFeedbackForm(scoped.organization);
    const page = Math.max(1, Number(req.query?.page || 1) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(req.query?.page_size || 10) || 10));
    const search = asText(req.query?.search).toLowerCase();
    const anonymousFilter = asText(req.query?.anonymous).toLowerCase();
    const ratingFilter = Number(req.query?.rating || 0);

    const rows = (await allQuery(selectFeedbackSubmissionsByOrganizationId, [scoped.organization.organization_id]))
      .map(normalizeSubmissionRow);

    const filteredRows = rows.filter((row) => {
      if (anonymousFilter === 'yes' && !row.is_anonymous) return false;
      if (anonymousFilter === 'no' && row.is_anonymous) return false;
      if (ratingFilter > 0 && Number(row.rating || 0) !== ratingFilter) return false;
      if (!search) return true;

      const haystack = [
        row.respondent_name,
        row.respondent_email,
        row.respondent_phone,
        row.message_summary,
        JSON.stringify(row.responses || {})
      ].join(' ').toLowerCase();
      return haystack.includes(search);
    });

    const totalItems = filteredRows.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    const items = filteredRows.slice(start, start + pageSize);

    return sendSuccess(res, 200, 'Feedback submissions retrieved successfully', {
      items,
      pagination: {
        page: safePage,
        page_size: pageSize,
        total_items: totalItems,
        total_pages: totalPages
      },
      filters: {
        search,
        anonymous: anonymousFilter || 'all',
        rating: ratingFilter || 0
      }
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to load feedback submissions', error.message);
  }
};

export const getCurrentFeedbackSubmissionById = async (req, res) => {
  try {
    if (req.user?.role !== 'org_admin') {
      return sendError(res, 403, 'Only org_admin can access feedback submissions');
    }

    const scoped = await getScopedOrganizationForRequest(req);
    if (scoped.unauthorized) return sendError(res, 401, scoped.unauthorized);
    if (scoped.forbidden) return sendError(res, 403, scoped.forbidden);
    if (scoped.notFound) return sendError(res, 404, scoped.notFound);

    const submission = await getQuery(selectFeedbackSubmissionById, [req.params.id]);
    if (!submission || Number(submission.organization_id) !== Number(scoped.organization.organization_id)) {
      return sendError(res, 404, 'Feedback submission not found');
    }

    return sendSuccess(res, 200, 'Feedback submission retrieved successfully', normalizeSubmissionRow(submission));
  } catch (error) {
    return sendError(res, 500, 'Failed to load feedback submission', error.message);
  }
};

export const getPublicFeedbackFormBySlug = async (req, res) => {
  try {
    const slug = asText(req.params.slug).toLowerCase();
    if (!slug) {
      return sendError(res, 400, 'organization slug is required');
    }

    const organization = await getQuery(selectOrganizationByPublicFeedbackSlug, [slug]);
    if (!organization) {
      return sendError(res, 404, 'Public feedback page not found');
    }

    const { form, fields } = await ensureFeedbackForm(organization);
    if (!Number(form.is_public || 0) || !Number(form.is_active || 0)) {
      return sendError(res, 403, 'This feedback form is not currently accepting public submissions');
    }

    const publicFields = fields
      .filter((field) => Number(field.is_active || 0) === 1)
      .map(normalizeFieldRow);

    return sendSuccess(res, 200, 'Public feedback form retrieved successfully', await buildFormResponse({
      organization,
      form,
      fields: publicFields
    }));
  } catch (error) {
    return sendError(res, 500, 'Failed to load public feedback form', error.message);
  }
};

const validateResponseValue = (field, value) => {
  const normalizedField = normalizeFieldRow(field);
  const type = normalizedField.field_type;
  const required = Number(normalizedField.is_required || 0) === 1;
  const options = Array.isArray(normalizedField.options) ? normalizedField.options : [];

  if (type === 'checkbox') {
    if (options.length) {
      const values = Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean) : [];
      if (required && !values.length) {
        throw new Error(`${normalizedField.label} is required`);
      }
      const invalidOption = values.find((item) => !options.includes(item));
      if (invalidOption) {
        throw new Error(`${normalizedField.label} contains an invalid option`);
      }
      return values;
    }

    const checked = value === true || value === 1 || value === '1' || value === 'true';
    if (required && !checked) {
      throw new Error(`${normalizedField.label} is required`);
    }
    return checked;
  }

  if (type === 'yes_no') {
    const normalized = String(value || '').trim().toLowerCase();
    if (required && !normalized) {
      throw new Error(`${normalizedField.label} is required`);
    }
    if (!normalized) return null;
    if (!['yes', 'no'].includes(normalized)) {
      throw new Error(`${normalizedField.label} must be Yes or No`);
    }
    return normalized;
  }

  if (type === 'rating') {
    const rating = Number(value);
    if (required && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
      throw new Error(`${normalizedField.label} must be a rating between 1 and 5`);
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return null;
    return rating;
  }

  const textValue = asText(value);
  if (required && !textValue) {
    throw new Error(`${normalizedField.label} is required`);
  }
  if (!textValue) {
    return null;
  }

  if (type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(textValue)) {
    throw new Error(`${normalizedField.label} must be a valid email address`);
  }
  if (type === 'phone' && !/^[0-9+()\-\s]{6,20}$/.test(textValue)) {
    throw new Error(`${normalizedField.label} must be a valid phone number`);
  }
  if (['select', 'radio'].includes(type) && options.length && !options.includes(textValue)) {
    throw new Error(`${normalizedField.label} contains an invalid option`);
  }

  return textValue;
};

export const submitPublicFeedback = async (req, res) => {
  try {
    const slug = asText(req.params.slug).toLowerCase();
    if (!slug) {
      return sendError(res, 400, 'organization slug is required');
    }

    const organization = await getQuery(selectOrganizationByPublicFeedbackSlug, [slug]);
    if (!organization) {
      return sendError(res, 404, 'Public feedback page not found');
    }

    const { form, fields } = await ensureFeedbackForm(organization);
    if (!Number(form.is_public || 0) || !Number(form.is_active || 0)) {
      return sendError(res, 403, 'This feedback form is not currently accepting public submissions');
    }

    const isAnonymous = toBooleanNumber(req.body?.is_anonymous, Number(form.allow_anonymous || 1));
    if (isAnonymous && !Number(form.allow_anonymous || 0)) {
      return sendError(res, 400, 'Anonymous submissions are disabled for this form');
    }

    const responses = req.body?.responses;
    if (!responses || typeof responses !== 'object' || Array.isArray(responses)) {
      return sendError(res, 400, 'responses are required');
    }

    const activeFields = fields.filter((field) => Number(field.is_active || 0) === 1);
    validateFieldKeysUnique(activeFields);

    const normalizedResponses = {};
    let respondentName = null;
    let respondentEmail = null;
    let respondentPhone = null;
    let rating = null;
    let messageSummary = null;

    for (const field of activeFields) {
      const key = field.field_key;
      const value = validateResponseValue(field, responses[key]);
      if (isAnonymous && ['respondent_name', 'respondent_email', 'respondent_phone'].includes(key)) {
        normalizedResponses[key] = null;
        continue;
      }

      normalizedResponses[key] = value;

      if (key === 'respondent_name') respondentName = value;
      if (key === 'respondent_email') respondentEmail = value;
      if (key === 'respondent_phone') respondentPhone = value;
      if (key === 'overall_rating' && typeof value === 'number') rating = value;
      if (key === 'message_summary' && typeof value === 'string') messageSummary = value;
    }

    const createResult = await runQuery(insertFeedbackSubmissionQuery, [
      organization.organization_id,
      form.id,
      isAnonymous,
      null,
      isAnonymous ? null : respondentName,
      isAnonymous ? null : respondentEmail,
      isAnonymous ? null : respondentPhone,
      JSON.stringify(normalizedResponses),
      rating,
      messageSummary
    ]);

    const submission = await getQuery(selectFeedbackSubmissionById, [createResult.lastID]);

    void createSystemNotificationSafely(
      {
        organizationId: organization.organization_id,
        type: NOTIFICATION_TYPES.PUBLIC_FEEDBACK_SUBMITTED,
        message: `New public feedback was submitted for ${organization.name}.`
      },
      'public feedback notification'
    );

    return sendSuccess(res, 201, 'Feedback submitted successfully', normalizeSubmissionRow(submission));
  } catch (error) {
    return sendError(res, 400, 'Failed to submit feedback', error.message);
  }
};

export const getSystemPublicFeedbackAnalytics = async (req, res) => {
  try {
    if (req.user?.role !== 'super_admin') {
      return sendError(res, 403, 'Only super_admin can access public feedback analytics');
    }

    const [summary, byOrganization, monthly] = await Promise.all([
      getQuery(`
        SELECT
          COUNT(*) AS total_submissions,
          AVG(rating) AS average_rating,
          SUM(CASE WHEN is_anonymous = 1 THEN 1 ELSE 0 END) AS anonymous_submissions
        FROM feedback_submissions
      `),
      allQuery(`
        SELECT
          organization_id,
          organization_name AS name,
          COUNT(*) AS submissions_count,
          AVG(rating) AS average_rating
        FROM (
          SELECT s.organization_id, o.name AS organization_name, s.rating
          FROM feedback_submissions s
          INNER JOIN organization o ON o.organization_id = s.organization_id
        )
        GROUP BY organization_id, name
        ORDER BY submissions_count DESC, name ASC
        LIMIT 10
      `),
      allQuery(`
        SELECT
          strftime('%Y-%m', created_at) AS month_key,
          COUNT(*) AS count
        FROM feedback_submissions
        WHERE created_at >= date('now', 'start of month', '-11 months')
        GROUP BY strftime('%Y-%m', created_at)
        ORDER BY month_key ASC
      `)
    ]);

    return sendSuccess(res, 200, 'Public feedback analytics retrieved successfully', {
      total_submissions: Number(summary?.total_submissions || 0),
      average_rating: summary?.average_rating == null ? 0 : Number(Number(summary.average_rating).toFixed(2)),
      anonymous_submissions: Number(summary?.anonymous_submissions || 0),
      by_organization: (byOrganization || []).map((item) => ({
        organization_id: item.organization_id,
        name: item.name,
        submissions_count: Number(item.submissions_count || 0),
        average_rating: item.average_rating == null ? 0 : Number(Number(item.average_rating).toFixed(2))
      })),
      monthly_trend: (monthly || []).map((item) => ({
        month_key: item.month_key,
        count: Number(item.count || 0)
      }))
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to load public feedback analytics', error.message);
  }
};
