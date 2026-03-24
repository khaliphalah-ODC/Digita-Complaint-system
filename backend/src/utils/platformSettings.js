import complaintDB from '../model/connect.js';
import { selectPlatformSettings } from '../model/platformSettings.model.js';

export const DEFAULT_PLATFORM_SETTINGS = {
  system_name: 'Complaint Management System',
  maintenance_mode: 0,
  default_org_status: 'active',
  password_min_length: 8,
  session_ttl_minutes: 1440,
  require_email_verification: 1,
  enforce_status_sequence: 0,
  require_admin_response_on_resolve: 0,
  escalation_threshold_hours: 72,
  enforce_escalation_threshold: 0,
  response_sla_hours: 48,
  notifications_enabled: 1,
  notify_on_complaint_created: 1,
  notify_on_status_change: 1,
  notify_on_response: 1,
  notify_on_escalation: 1,
  notify_on_chat_message: 1,
  notify_on_assignment: 1
};

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const normalizePlatformSettings = (row = {}) => ({
  ...DEFAULT_PLATFORM_SETTINGS,
  ...row,
  maintenance_mode: toNumber(row?.maintenance_mode, DEFAULT_PLATFORM_SETTINGS.maintenance_mode),
  password_min_length: toNumber(row?.password_min_length, DEFAULT_PLATFORM_SETTINGS.password_min_length),
  session_ttl_minutes: toNumber(row?.session_ttl_minutes, DEFAULT_PLATFORM_SETTINGS.session_ttl_minutes),
  require_email_verification: toNumber(row?.require_email_verification, DEFAULT_PLATFORM_SETTINGS.require_email_verification),
  enforce_status_sequence: toNumber(row?.enforce_status_sequence, DEFAULT_PLATFORM_SETTINGS.enforce_status_sequence),
  require_admin_response_on_resolve: toNumber(
    row?.require_admin_response_on_resolve,
    DEFAULT_PLATFORM_SETTINGS.require_admin_response_on_resolve
  ),
  escalation_threshold_hours: toNumber(row?.escalation_threshold_hours, DEFAULT_PLATFORM_SETTINGS.escalation_threshold_hours),
  enforce_escalation_threshold: toNumber(
    row?.enforce_escalation_threshold,
    DEFAULT_PLATFORM_SETTINGS.enforce_escalation_threshold
  ),
  response_sla_hours: toNumber(row?.response_sla_hours, DEFAULT_PLATFORM_SETTINGS.response_sla_hours),
  notifications_enabled: toNumber(row?.notifications_enabled, DEFAULT_PLATFORM_SETTINGS.notifications_enabled),
  notify_on_complaint_created: toNumber(
    row?.notify_on_complaint_created,
    DEFAULT_PLATFORM_SETTINGS.notify_on_complaint_created
  ),
  notify_on_status_change: toNumber(
    row?.notify_on_status_change,
    DEFAULT_PLATFORM_SETTINGS.notify_on_status_change
  ),
  notify_on_response: toNumber(row?.notify_on_response, DEFAULT_PLATFORM_SETTINGS.notify_on_response),
  notify_on_escalation: toNumber(row?.notify_on_escalation, DEFAULT_PLATFORM_SETTINGS.notify_on_escalation),
  notify_on_chat_message: toNumber(row?.notify_on_chat_message, DEFAULT_PLATFORM_SETTINGS.notify_on_chat_message),
  notify_on_assignment: toNumber(row?.notify_on_assignment, DEFAULT_PLATFORM_SETTINGS.notify_on_assignment)
});

export const fetchPlatformSettingsRow = () =>
  new Promise((resolve) => {
    complaintDB.get(selectPlatformSettings, [], (err, row) => {
      if (err) return resolve(null);
      return resolve(row || null);
    });
  });

export const getPlatformSettingsSafe = async () => {
  const row = await fetchPlatformSettingsRow();
  return normalizePlatformSettings(row || {});
};
