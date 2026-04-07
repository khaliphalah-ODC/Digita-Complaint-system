import {
  analyticsSchema,
  complaintSchema,
  departmentSchema,
  escalationSchema,
  feedbackSchema,
  notificationSchema,
  organizationSchema,
  organizationSettingsSchema,
  publicFeedbackAnalyticsSchema,
  publicFeedbackFormSchema,
  publicFeedbackSubmissionSchema,
  publicFeedbackSubmissionListSchema,
  userSettingsSchema,
  statusLogSchema
} from './schemas.js';

const asNumber = (value, fallback = null) => {
  if (value === '' || value === undefined || value === null) return fallback;
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : fallback;
};

const asString = (value, fallback = '') => {
  if (value === undefined || value === null) return fallback;
  return String(value);
};

const asNullableString = (value) => {
  const nextValue = asString(value, '').trim();
  return nextValue ? nextValue : null;
};

const asBoolean = (value) => value === true || value === 1 || value === '1';

const validate = (schema, payload, fallbackMessage) => {
  const result = schema.safeParse(payload);
  if (!result.success) {
    throw new Error(fallbackMessage || result.error.issues[0]?.message || 'Invalid API response');
  }
  return result.data;
};

export const transformComplaint = (row = {}) => validate(complaintSchema, {
  ...row,
  id: asNumber(row.id, undefined),
  title: asString(row.title, 'Untitled Complaint'),
  complaint: asString(row.complaint, ''),
  category: asNullableString(row.category),
  priority: asString(row.priority, 'medium').toLowerCase(),
  status: asString(row.status, 'submitted').toLowerCase(),
  tracking_code: asNullableString(row.tracking_code),
  created_at: asNullableString(row.created_at),
  updated_at: asNullableString(row.updated_at),
  reviewed_at: asNullableString(row.reviewed_at),
  assigned_to: asNumber(row.assigned_to),
  assigned_name: asNullableString(row.assigned_name),
  assigned_email: asNullableString(row.assigned_email),
  organization_id: asNumber(row.organization_id),
  organization_name: asNullableString(row.organization_name || row.organization?.name),
  department_id: asNumber(row.department_id),
  department_name: asNullableString(row.department_name || row.department?.name),
  user_id: asNumber(row.user_id),
  user_full_name: asNullableString(row.user_full_name || row.user?.full_name),
  user_email: asNullableString(row.user_email || row.user?.email),
  is_anonymous: asBoolean(row.is_anonymous),
  anonymous_label: asNullableString(row.anonymous_label),
  admin_response: asNullableString(row.admin_response)
}, 'Complaint response shape is invalid.');

export const transformComplaintCollection = (rows) => (
  Array.isArray(rows) ? rows.map((row) => transformComplaint(row)) : []
);

export const transformOrganization = (row = {}) => validate(organizationSchema, {
  ...row,
  organization_id: asNumber(row.organization_id, undefined),
  name: asString(row.name, 'Unnamed organization'),
  organization_type: asNullableString(row.organization_type),
  email: asNullableString(row.email),
  phone: asNullableString(row.phone),
  address: asNullableString(row.address),
  logo: asNullableString(row.logo),
  status: asString(row.status, 'inactive').toLowerCase(),
  complaints_count: asNumber(row.complaints_count ?? row.complaints, 0),
  organization_admin: row.organization_admin
    ? {
        ...row.organization_admin,
        id: asNumber(row.organization_admin.id, undefined),
        full_name: asNullableString(row.organization_admin.full_name),
        email: asNullableString(row.organization_admin.email)
      }
    : null
}, 'Organization response shape is invalid.');

export const transformOrganizationCollection = (rows) => (
  Array.isArray(rows) ? rows.map((row) => transformOrganization(row)) : []
);

const normalizeSeriesItem = (row = {}, { labelKey = 'label', valueKey = 'value', fallbackLabel = '', tone } = {}) => ({
  label: asString(row[labelKey] ?? row.month ?? row.name, fallbackLabel),
  value: asNumber(row[valueKey] ?? row.complaints ?? row.total, 0) || 0,
  tone: tone || asNullableString(row.tone)
});

export const transformAnalytics = (stats = {}) => validate(analyticsSchema, {
  totalOrganizations: asNumber(stats.totalOrganizations, 0) || 0,
  activeOrganizations: asNumber(stats.activeOrganizations, 0) || 0,
  suspendedOrganizations: asNumber(stats.suspendedOrganizations, 0) || 0,
  unassignedAnonymousComplaints: asNumber(stats.unassignedAnonymousComplaints, 0) || 0,
  totalComplaints: asNumber(stats.totalComplaints, 0) || 0,
  submittedComplaints: asNumber(stats.submittedComplaints, 0) || 0,
  inReviewComplaints: asNumber(stats.inReviewComplaints, 0) || 0,
  resolvedComplaints: asNumber(stats.resolvedComplaints, 0) || 0,
  closedComplaints: asNumber(stats.closedComplaints, 0) || 0,
  complaintsByOrganization: Array.isArray(stats.complaintsByOrganization)
    ? stats.complaintsByOrganization.map((row) => ({
        label: asString(row.name || row.label, 'Unnamed'),
        value: asNumber(row.complaints ?? row.value, 0) || 0,
        tone: asNullableString(row.tone),
        organization_id: asNumber(row.organization_id)
      }))
    : [],
  escalationStatusCounts: {
    pending: asNumber(stats.escalationStatusCounts?.pending, 0) || 0,
    in_progress: asNumber(stats.escalationStatusCounts?.in_progress, 0) || 0,
    resolved: asNumber(stats.escalationStatusCounts?.resolved, 0) || 0,
    rejected: asNumber(stats.escalationStatusCounts?.rejected, 0) || 0
  },
  feedbackSummary: {
    total: asNumber(stats.feedbackSummary?.total, 0) || 0,
    average: asNumber(stats.feedbackSummary?.average, 0) || 0,
    byRating: Object.fromEntries(
      Object.entries(stats.feedbackSummary?.byRating || {}).map(([key, value]) => [key, asNumber(value, 0) || 0])
    )
  },
  complaintMonthlyTrend: Array.isArray(stats.complaintMonthlyTrend)
    ? stats.complaintMonthlyTrend.map((row) => normalizeSeriesItem(row, { fallbackLabel: '' }))
    : [],
  assessmentMonthlyTrend: Array.isArray(stats.assessmentMonthlyTrend)
    ? stats.assessmentMonthlyTrend.map((row) => normalizeSeriesItem(row, { fallbackLabel: '' }))
    : []
}, 'Analytics response shape is invalid.');

export const transformDepartment = (row = {}) => validate(departmentSchema, {
  ...row,
  id: asNumber(row.id, undefined),
  organization_id: asNumber(row.organization_id),
  name: asString(row.name, 'Unnamed department'),
  description: asNullableString(row.description),
  assessment_id: asNumber(row.assessment_id ?? row.accessment_id),
  created_at: asNullableString(row.created_at),
  updated_at: asNullableString(row.updated_at)
}, 'Department response shape is invalid.');

export const transformDepartmentCollection = (rows) => (
  Array.isArray(rows) ? rows.map((row) => transformDepartment(row)) : []
);

export const transformEscalation = (row = {}) => validate(escalationSchema, {
  ...row,
  id: asNumber(row.id, undefined),
  assessment_id: asNumber(row.assessment_id ?? row.accessment_id),
  escalated_by: asNumber(row.escalated_by),
  assigned_to: asNumber(row.assigned_to),
  escalation_level: asString(row.escalation_level, 'level_1'),
  reason: asNullableString(row.reason),
  notes: asNullableString(row.notes),
  status: asString(row.status, 'pending').toLowerCase(),
  resolved_at: asNullableString(row.resolved_at),
  created_at: asNullableString(row.created_at),
  updated_at: asNullableString(row.updated_at)
}, 'Escalation response shape is invalid.');

export const transformEscalationCollection = (rows) => (
  Array.isArray(rows) ? rows.map((row) => transformEscalation(row)) : []
);

export const transformStatusLog = (row = {}) => validate(statusLogSchema, {
  ...row,
  id: asNumber(row.id, undefined),
  assessment_id: asNumber(row.assessment_id ?? row.accessment_id),
  changed_by: asNullableString(row.changed_by),
  old_status: asNullableString(row.old_status),
  new_status: asNullableString(row.new_status),
  notes: asNullableString(row.notes),
  created_at: asNullableString(row.created_at)
}, 'Status log response shape is invalid.');

export const transformStatusLogCollection = (rows) => (
  Array.isArray(rows) ? rows.map((row) => transformStatusLog(row)) : []
);

export const transformNotification = (row = {}) => validate(notificationSchema, {
  ...row,
  id: asNumber(row.id, undefined),
  user_id: asNumber(row.user_id),
  complaint_id: asNumber(row.complaint_id),
  type: asString(row.type, 'notification'),
  message: asString(row.message, ''),
  is_read: asBoolean(row.is_read),
  created_at: asNullableString(row.created_at),
  updated_at: asNullableString(row.updated_at)
}, 'Notification response shape is invalid.');

export const transformNotificationCollection = (rows) => (
  Array.isArray(rows) ? rows.map((row) => transformNotification(row)) : []
);

export const transformFeedback = (row = {}) => validate(feedbackSchema, {
  ...row,
  id: asNumber(row.id, undefined),
  complaint_id: asNumber(row.complaint_id),
  rating: asNumber(row.rating),
  comment: asNullableString(row.comment),
  created_at: asNullableString(row.created_at),
  updated_at: asNullableString(row.updated_at)
}, 'Feedback response shape is invalid.');

export const transformFeedbackCollection = (rows) => (
  Array.isArray(rows) ? rows.map((row) => transformFeedback(row)) : []
);

export const transformPublicFeedbackForm = (row = {}) => validate(publicFeedbackFormSchema, {
  ...row,
  id: asNumber(row.id, undefined),
  organization_id: asNumber(row.organization_id),
  organization_name: asNullableString(row.organization_name),
  organization_slug: asNullableString(row.organization_slug),
  title: asString(row.title, 'Organization Feedback'),
  description: asNullableString(row.description),
  is_public: asBoolean(row.is_public ?? true),
  is_active: asBoolean(row.is_active ?? true),
  allow_anonymous: asBoolean(row.allow_anonymous),
  version: asNumber(row.version, 1) || 1,
  publish_state: asNullableString(row.publish_state),
  publish_label: asNullableString(row.publish_label),
  publish_description: asNullableString(row.publish_description),
  publish_checklist: Array.isArray(row.publish_checklist)
    ? row.publish_checklist.map((item) => ({
        key: asString(item?.key, ''),
        label: asString(item?.label, ''),
        complete: asBoolean(item?.complete)
      }))
    : [],
  legacy_migration: row.legacy_migration
    ? {
        state: asNullableString(row.legacy_migration.state),
        label: asNullableString(row.legacy_migration.label),
        description: asNullableString(row.legacy_migration.description),
        organization_had_legacy_records: asBoolean(row.legacy_migration.organization_had_legacy_records),
        active_legacy_tables: asBoolean(row.legacy_migration.active_legacy_tables),
        archived_legacy_tables: asBoolean(row.legacy_migration.archived_legacy_tables),
        retained_records: {
          active_forms: asNumber(row.legacy_migration.retained_records?.active_forms, 0) || 0,
          active_submissions: asNumber(row.legacy_migration.retained_records?.active_submissions, 0) || 0,
          archived_forms: asNumber(row.legacy_migration.retained_records?.archived_forms, 0) || 0,
          archived_submissions: asNumber(row.legacy_migration.retained_records?.archived_submissions, 0) || 0
        }
      }
    : null,
  public_url: asNullableString(row.public_url),
  public_qr_url: asNullableString(row.public_qr_url),
  fields: Array.isArray(row.fields)
    ? row.fields.map((field) => ({
        ...field,
        id: asNumber(field?.id, undefined),
        form_id: asNumber(field?.form_id),
        key: asString(field?.field_key ?? field?.key, ''),
        field_key: asString(field?.field_key ?? field?.key, ''),
        label: asString(field?.label, 'Field'),
        type: asString(field?.field_type ?? field?.type, 'short_text'),
        field_type: asString(field?.field_type ?? field?.type, 'short_text'),
        required: asBoolean(field?.is_required ?? field?.required),
        is_required: asBoolean(field?.is_required ?? field?.required),
        enabled: asBoolean(field?.is_active ?? field?.enabled ?? true),
        is_active: asBoolean(field?.is_active ?? field?.enabled ?? true),
        placeholder: asNullableString(field?.placeholder),
        help_text: asNullableString(field?.help_text),
        options: Array.isArray(field?.options) ? field.options.map((option) => asString(option, '')).filter(Boolean) : [],
        sort_order: asNumber(field?.sort_order, 0) || 0
      }))
    : []
}, 'Public feedback form response shape is invalid.');

export const transformPublicFeedbackSubmission = (row = {}) => validate(publicFeedbackSubmissionSchema, {
  ...row,
  id: asNumber(row.id, undefined),
  organization_id: asNumber(row.organization_id),
  form_id: asNumber(row.form_id),
  organization_name: asNullableString(row.organization_name),
  form_title: asNullableString(row.form_title),
  is_anonymous: asBoolean(row.is_anonymous),
  respondent_name: asNullableString(row.respondent_name),
  respondent_email: asNullableString(row.respondent_email),
  respondent_phone: asNullableString(row.respondent_phone),
  rating: asNumber(row.rating),
  message_summary: asNullableString(row.message_summary),
  responses: row.responses && typeof row.responses === 'object' && !Array.isArray(row.responses) ? row.responses : {},
  created_at: asNullableString(row.created_at)
}, 'Public feedback submission response shape is invalid.');

export const transformPublicFeedbackSubmissionCollection = (rows) => (
  Array.isArray(rows) ? rows.map((row) => transformPublicFeedbackSubmission(row)) : []
);

export const transformPublicFeedbackSubmissionList = (row = {}) => validate(publicFeedbackSubmissionListSchema, {
  items: transformPublicFeedbackSubmissionCollection(row.items),
  pagination: {
    page: asNumber(row.pagination?.page, 1) || 1,
    page_size: asNumber(row.pagination?.page_size, 10) || 10,
    total_items: asNumber(row.pagination?.total_items, 0) || 0,
    total_pages: asNumber(row.pagination?.total_pages, 1) || 1
  },
  filters: {
    search: asNullableString(row.filters?.search) || '',
    anonymous: asNullableString(row.filters?.anonymous) || 'all',
    rating: asNumber(row.filters?.rating, 0) || 0
  }
}, 'Public feedback submissions response shape is invalid.');

export const transformPublicFeedbackAnalytics = (row = {}) => validate(publicFeedbackAnalyticsSchema, {
  ...row,
  total_submissions: asNumber(row.total_submissions, 0) || 0,
  average_rating: asNumber(row.average_rating, 0) || 0,
  anonymous_submissions: asNumber(row.anonymous_submissions, 0) || 0,
  by_organization: Array.isArray(row.by_organization)
    ? row.by_organization.map((item) => ({
        ...item,
        organization_id: asNumber(item.organization_id),
        name: asString(item.name, 'Organization'),
        submissions_count: asNumber(item.submissions_count, 0) || 0,
        average_rating: asNumber(item.average_rating, 0) || 0
      }))
    : [],
  monthly_trend: Array.isArray(row.monthly_trend)
    ? row.monthly_trend.map((item) => ({
        ...item,
        month_key: asString(item.month_key, ''),
        count: asNumber(item.count, 0) || 0
      }))
    : []
}, 'Public feedback analytics response shape is invalid.');

export const transformOrganizationSettings = (row = {}) => validate(organizationSettingsSchema, {
  organization: {
    organization_id: asNumber(row.organization?.organization_id),
    name: asString(row.organization?.name, ''),
    organization_type: asNullableString(row.organization?.organization_type),
    email: asNullableString(row.organization?.email),
    phone: asNullableString(row.organization?.phone),
    address: asNullableString(row.organization?.address),
    logo: asNullableString(row.organization?.logo),
    description: asNullableString(row.organization?.description),
    status: asNullableString(row.organization?.status),
    self_signup_enabled: asBoolean(row.organization?.self_signup_enabled),
    public_feedback_slug: asNullableString(row.organization?.public_feedback_slug)
  },
  workflow: {
    anonymous_complaints_enabled: asBoolean(row.workflow?.anonymous_complaints_enabled),
    default_department_id: asNumber(row.workflow?.default_department_id),
    auto_route_to_department: asBoolean(row.workflow?.auto_route_to_department),
    escalation_threshold_hours: asNumber(row.workflow?.escalation_threshold_hours, 72) || 72,
    response_sla_hours: asNumber(row.workflow?.response_sla_hours, 48) || 48
  },
  public_feedback: {
    public_url: asNullableString(row.public_feedback?.public_url),
    form_title: asNullableString(row.public_feedback?.form_title),
    form_description: asNullableString(row.public_feedback?.form_description),
    form_active: asBoolean(row.public_feedback?.form_active),
    form_public: asBoolean(row.public_feedback?.form_public)
  },
  notifications: {
    notify_on_new_complaints: asBoolean(row.notifications?.notify_on_new_complaints),
    notify_on_public_feedback: asBoolean(row.notifications?.notify_on_public_feedback),
    notify_on_escalations: asBoolean(row.notifications?.notify_on_escalations)
  },
  access_controls: {
    allow_org_admin_user_management: asBoolean(row.access_controls?.allow_org_admin_user_management)
  },
  departments: Array.isArray(row.departments)
    ? row.departments.map((item) => ({
        id: asNumber(item.id, 0) || 0,
        name: asString(item.name, '')
      }))
    : []
}, 'Organization settings response shape is invalid.');

export const transformUserSettings = (row = {}) => validate(userSettingsSchema, {
  profile: {
    id: asNumber(row.profile?.id),
    full_name: asString(row.profile?.full_name, ''),
    email: asNullableString(row.profile?.email),
    role: asNullableString(row.profile?.role),
    organization_id: asNumber(row.profile?.organization_id),
    phone: asNullableString(row.profile?.phone),
    profile_image: asNullableString(row.profile?.profile_image)
  },
  notifications: {
    notify_email_updates: asBoolean(row.notifications?.notify_email_updates),
    notify_status_updates: asBoolean(row.notifications?.notify_status_updates),
    notify_public_feedback: asBoolean(row.notifications?.notify_public_feedback)
  },
  preferences: {
    anonymity_preference: asBoolean(row.preferences?.anonymity_preference)
  }
}, 'User settings response shape is invalid.');
