import complaintDB from '../model/connect.js';
import { fetchUserByIdQuery } from '../model/user.model.js';
import { selectOrganizationById, updateOrganizationById } from '../model/organization.model.js';
import { selectFeedbackFormByOrganizationId } from '../model/publicFeedback.model.js';
import { selectPublicDepartmentsByOrganizationId } from '../model/department.model.js';
import {
  OrganizationSettingsTable,
  UserSettingsTable,
  insertOrganizationSettingsQuery,
  insertUserSettingsQuery,
  selectOrganizationSettingsByOrganizationId,
  selectUserSettingsByUserId,
  updateOrganizationSettingsQuery,
  updateOwnProfileQuery,
  updateUserSettingsQuery
} from '../model/settings.model.js';
import { sendError, sendSuccess } from '../utils/response.js';

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

const toBooleanNumber = (value, fallback = 0) => {
  if ([true, 1, '1', 'true'].includes(value)) return 1;
  if ([false, 0, '0', 'false'].includes(value)) return 0;
  return fallback;
};

const asText = (value, fallback = '') => String(value ?? fallback).trim();

const buildPublicFeedbackUrl = (slug) => {
  const base = process.env.PUBLIC_FEEDBACK_URL_BASE || 'http://localhost:5173/public-feedback/';
  return `${String(base).replace(/\/?$/, '/')}${encodeURIComponent(slug)}`;
};

const ensureOrganizationSettings = async (organizationId) => {
  let settings = await getQuery(selectOrganizationSettingsByOrganizationId, [organizationId]);
  if (!settings) {
    await runQuery(insertOrganizationSettingsQuery, [
      organizationId,
      '',
      1,
      null,
      0,
      72,
      48,
      1,
      1,
      1,
      1
    ]);
    settings = await getQuery(selectOrganizationSettingsByOrganizationId, [organizationId]);
  }
  return settings;
};

const ensureUserSettings = async (userId) => {
  let settings = await getQuery(selectUserSettingsByUserId, [userId]);
  if (!settings) {
    await runQuery(insertUserSettingsQuery, [userId, '', '', 1, 1, 0, 0]);
    settings = await getQuery(selectUserSettingsByUserId, [userId]);
  }
  return settings;
};

const getCurrentOrgAdminContext = async (req) => {
  if (req.user?.role !== 'org_admin') {
    return { forbidden: 'Only org_admin can manage organization settings' };
  }
  const user = await getQuery(fetchUserByIdQuery, [req.user.id]);
  if (!user) return { unauthorized: 'Authenticated user does not exist' };
  if (!user.organization_id) return { forbidden: 'This account is not linked to an organization' };
  const organization = await getQuery(selectOrganizationById, [user.organization_id]);
  if (!organization) return { notFound: 'Organization not found' };
  const settings = await ensureOrganizationSettings(user.organization_id);
  return { user, organization, settings };
};

const getCurrentUserContext = async (req) => {
  const user = await getQuery(fetchUserByIdQuery, [req.user?.id]);
  if (!user) return { unauthorized: 'Authenticated user does not exist' };
  const settings = await ensureUserSettings(user.id);
  return { user, settings };
};

const buildOrgSettingsPayload = async ({ organization, settings }) => {
  const departments = await allQuery(selectPublicDepartmentsByOrganizationId, [organization.organization_id]);
  const feedbackForm = await getQuery(selectFeedbackFormByOrganizationId, [organization.organization_id]);

  return {
    organization: {
      organization_id: organization.organization_id,
      name: organization.name,
      organization_type: organization.organization_type,
      email: organization.email,
      phone: organization.phone || '',
      address: organization.address || '',
      logo: organization.logo || '',
      description: settings.description || '',
      status: organization.status,
      self_signup_enabled: Number(organization.self_signup_enabled || 0) === 1,
      public_feedback_slug: organization.public_feedback_slug || ''
    },
    workflow: {
      anonymous_complaints_enabled: Number(settings.anonymous_complaints_enabled || 0) === 1,
      default_department_id: settings.default_department_id == null ? null : Number(settings.default_department_id),
      auto_route_to_department: Number(settings.auto_route_to_department || 0) === 1,
      escalation_threshold_hours: Number(settings.escalation_threshold_hours || 72),
      response_sla_hours: Number(settings.response_sla_hours || 48)
    },
    public_feedback: {
      public_url: organization.public_feedback_slug ? buildPublicFeedbackUrl(organization.public_feedback_slug) : '',
      form_title: feedbackForm?.title || `${organization.name} Feedback`,
      form_description: feedbackForm?.description || '',
      form_active: Number(feedbackForm?.is_active || 0) === 1,
      form_public: Number(feedbackForm?.is_public || 0) === 1
    },
    notifications: {
      notify_on_new_complaints: Number(settings.notify_on_new_complaints || 0) === 1,
      notify_on_public_feedback: Number(settings.notify_on_public_feedback || 0) === 1,
      notify_on_escalations: Number(settings.notify_on_escalations || 0) === 1
    },
    access_controls: {
      allow_org_admin_user_management: Number(settings.allow_org_admin_user_management || 0) === 1
    },
    departments: (departments || []).map((row) => ({
      id: Number(row.id),
      name: row.name
    }))
  };
};

const buildUserSettingsPayload = ({ user, settings }) => ({
  profile: {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    role: user.role,
    organization_id: user.organization_id,
    phone: settings.phone || '',
    profile_image: settings.profile_image || ''
  },
  notifications: {
    notify_email_updates: Number(settings.notify_email_updates || 0) === 1,
    notify_status_updates: Number(settings.notify_status_updates || 0) === 1,
    notify_public_feedback: Number(settings.notify_public_feedback || 0) === 1
  },
  preferences: {
    anonymity_preference: Number(settings.anonymity_preference || 0) === 1
  }
});

export const CreateSettingsTables = () => {
  complaintDB.serialize(() => {
    complaintDB.run(OrganizationSettingsTable);
    complaintDB.run(UserSettingsTable);
  });
};

export const getCurrentOrganizationSettings = async (req, res) => {
  try {
    const context = await getCurrentOrgAdminContext(req);
    if (context.unauthorized) return sendError(res, 401, context.unauthorized);
    if (context.forbidden) return sendError(res, 403, context.forbidden);
    if (context.notFound) return sendError(res, 404, context.notFound);
    return sendSuccess(res, 200, 'Organization settings retrieved successfully', await buildOrgSettingsPayload(context));
  } catch (error) {
    return sendError(res, 500, 'Failed to load organization settings', error.message);
  }
};

export const updateCurrentOrganizationSettings = async (req, res) => {
  try {
    const context = await getCurrentOrgAdminContext(req);
    if (context.unauthorized) return sendError(res, 401, context.unauthorized);
    if (context.forbidden) return sendError(res, 403, context.forbidden);
    if (context.notFound) return sendError(res, 404, context.notFound);

    const organization = context.organization;
    const settings = context.settings;
    const payload = req.body || {};

    const organizationName = asText(payload.organization?.name || organization.name);
    const organizationType = asText(payload.organization?.organization_type || organization.organization_type);
    const email = asText(payload.organization?.email || organization.email).toLowerCase();
    const phone = asText(payload.organization?.phone || organization.phone);
    const address = asText(payload.organization?.address || organization.address);
    const logo = asText(payload.organization?.logo || organization.logo);

    if (!organizationName || !organizationType || !email || !address) {
      return sendError(res, 400, 'Organization name, type, email, and address are required');
    }

    await runQuery(updateOrganizationById, [
      organizationName,
      organizationType,
      email,
      phone,
      address,
      logo,
      organization.status,
      organization.organization_id
    ]);

    await runQuery(updateOrganizationSettingsQuery, [
      asText(payload.organization?.description ?? settings.description),
      toBooleanNumber(payload.workflow?.anonymous_complaints_enabled, Number(settings.anonymous_complaints_enabled || 1)),
      payload.workflow?.default_department_id == null || payload.workflow?.default_department_id === ''
        ? null
        : Number(payload.workflow.default_department_id),
      toBooleanNumber(payload.workflow?.auto_route_to_department, Number(settings.auto_route_to_department || 0)),
      Number(payload.workflow?.escalation_threshold_hours ?? settings.escalation_threshold_hours ?? 72) || 72,
      Number(payload.workflow?.response_sla_hours ?? settings.response_sla_hours ?? 48) || 48,
      toBooleanNumber(payload.notifications?.notify_on_new_complaints, Number(settings.notify_on_new_complaints || 1)),
      toBooleanNumber(payload.notifications?.notify_on_public_feedback, Number(settings.notify_on_public_feedback || 1)),
      toBooleanNumber(payload.notifications?.notify_on_escalations, Number(settings.notify_on_escalations || 1)),
      toBooleanNumber(payload.access_controls?.allow_org_admin_user_management, Number(settings.allow_org_admin_user_management || 1)),
      organization.organization_id
    ]);

    const refreshedOrganization = await getQuery(selectOrganizationById, [organization.organization_id]);
    const refreshedSettings = await ensureOrganizationSettings(organization.organization_id);
    return sendSuccess(
      res,
      200,
      'Organization settings updated successfully',
      await buildOrgSettingsPayload({ organization: refreshedOrganization, settings: refreshedSettings })
    );
  } catch (error) {
    return sendError(res, 500, 'Failed to update organization settings', error.message);
  }
};

export const getCurrentUserSettings = async (req, res) => {
  try {
    const context = await getCurrentUserContext(req);
    if (context.unauthorized) return sendError(res, 401, context.unauthorized);
    return sendSuccess(res, 200, 'User settings retrieved successfully', buildUserSettingsPayload(context));
  } catch (error) {
    return sendError(res, 500, 'Failed to load user settings', error.message);
  }
};

export const updateCurrentUserSettings = async (req, res) => {
  try {
    const context = await getCurrentUserContext(req);
    if (context.unauthorized) return sendError(res, 401, context.unauthorized);

    const payload = req.body || {};
    const fullName = asText(payload.profile?.full_name || context.user.full_name);
    if (!fullName) {
      return sendError(res, 400, 'Full name is required');
    }

    await runQuery(updateOwnProfileQuery, [fullName, context.user.id]);
    await runQuery(updateUserSettingsQuery, [
      asText(payload.profile?.phone ?? context.settings.phone),
      asText(payload.profile?.profile_image ?? context.settings.profile_image),
      toBooleanNumber(payload.notifications?.notify_email_updates, Number(context.settings.notify_email_updates || 1)),
      toBooleanNumber(payload.notifications?.notify_status_updates, Number(context.settings.notify_status_updates || 1)),
      toBooleanNumber(payload.notifications?.notify_public_feedback, Number(context.settings.notify_public_feedback || 0)),
      toBooleanNumber(payload.preferences?.anonymity_preference, Number(context.settings.anonymity_preference || 0)),
      context.user.id
    ]);

    const refreshedUser = await getQuery(fetchUserByIdQuery, [context.user.id]);
    const refreshedSettings = await ensureUserSettings(context.user.id);
    return sendSuccess(
      res,
      200,
      'User settings updated successfully',
      buildUserSettingsPayload({ user: refreshedUser, settings: refreshedSettings })
    );
  } catch (error) {
    return sendError(res, 500, 'Failed to update user settings', error.message);
  }
};
