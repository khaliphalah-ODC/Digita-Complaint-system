// platformSettings.controller: handles platform settings for super-admin.
import complaintDB from '../model/connect.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { logAuditEntry, buildAuditMetadata } from '../utils/audit.js';
import { DEFAULT_PLATFORM_SETTINGS, normalizePlatformSettings } from '../utils/platformSettings.js';
import {
  PlatformSettings,
  selectPlatformSettings,
  insertDefaultPlatformSettings,
  updatePlatformSettings
} from '../model/platformSettings.model.js';

const toBoolInt = (value) => (value === true || value === 1 || value === '1' ? 1 : 0);

export const CreatePlatformSettingsTable = () => {
  complaintDB.run(PlatformSettings, (err) => {
    if (err) {
      console.error('Error creating platform settings table:', err.message);
      return;
    }

    complaintDB.all('PRAGMA table_info(platform_settings)', [], (schemaErr, columns) => {
      if (schemaErr) {
        console.error('Error inspecting platform settings table:', schemaErr.message);
        return;
      }

      const existing = new Set((columns || []).map((column) => column.name));
      const migrations = [];

      if (!existing.has('password_min_length')) {
        migrations.push('ALTER TABLE platform_settings ADD COLUMN password_min_length INTEGER NOT NULL DEFAULT 8');
      }
      if (!existing.has('session_ttl_minutes')) {
        migrations.push('ALTER TABLE platform_settings ADD COLUMN session_ttl_minutes INTEGER NOT NULL DEFAULT 1440');
      }
      if (!existing.has('require_email_verification')) {
        migrations.push(
          'ALTER TABLE platform_settings ADD COLUMN require_email_verification INTEGER NOT NULL DEFAULT 1'
        );
      }
      if (!existing.has('enforce_status_sequence')) {
        migrations.push(
          'ALTER TABLE platform_settings ADD COLUMN enforce_status_sequence INTEGER NOT NULL DEFAULT 0'
        );
      }
      if (!existing.has('require_admin_response_on_resolve')) {
        migrations.push(
          'ALTER TABLE platform_settings ADD COLUMN require_admin_response_on_resolve INTEGER NOT NULL DEFAULT 0'
        );
      }
      if (!existing.has('escalation_threshold_hours')) {
        migrations.push(
          'ALTER TABLE platform_settings ADD COLUMN escalation_threshold_hours INTEGER NOT NULL DEFAULT 72'
        );
      }
      if (!existing.has('enforce_escalation_threshold')) {
        migrations.push(
          'ALTER TABLE platform_settings ADD COLUMN enforce_escalation_threshold INTEGER NOT NULL DEFAULT 0'
        );
      }
      if (!existing.has('response_sla_hours')) {
        migrations.push(
          'ALTER TABLE platform_settings ADD COLUMN response_sla_hours INTEGER NOT NULL DEFAULT 48'
        );
      }
      if (!existing.has('notifications_enabled')) {
        migrations.push(
          'ALTER TABLE platform_settings ADD COLUMN notifications_enabled INTEGER NOT NULL DEFAULT 1'
        );
      }
      if (!existing.has('notify_on_complaint_created')) {
        migrations.push(
          'ALTER TABLE platform_settings ADD COLUMN notify_on_complaint_created INTEGER NOT NULL DEFAULT 1'
        );
      }
      if (!existing.has('notify_on_status_change')) {
        migrations.push(
          'ALTER TABLE platform_settings ADD COLUMN notify_on_status_change INTEGER NOT NULL DEFAULT 1'
        );
      }
      if (!existing.has('notify_on_response')) {
        migrations.push(
          'ALTER TABLE platform_settings ADD COLUMN notify_on_response INTEGER NOT NULL DEFAULT 1'
        );
      }
      if (!existing.has('notify_on_escalation')) {
        migrations.push(
          'ALTER TABLE platform_settings ADD COLUMN notify_on_escalation INTEGER NOT NULL DEFAULT 1'
        );
      }
      if (!existing.has('notify_on_chat_message')) {
        migrations.push(
          'ALTER TABLE platform_settings ADD COLUMN notify_on_chat_message INTEGER NOT NULL DEFAULT 1'
        );
      }
      if (!existing.has('notify_on_assignment')) {
        migrations.push(
          'ALTER TABLE platform_settings ADD COLUMN notify_on_assignment INTEGER NOT NULL DEFAULT 1'
        );
      }

      const runMigrations = migrations.reduce(
        (chain, sql) =>
          chain.then(
            () =>
              new Promise((resolve, reject) => {
                complaintDB.run(sql, (migrationErr) => {
                  if (migrationErr) return reject(migrationErr);
                  return resolve();
                });
              })
          ),
        Promise.resolve()
      );

      runMigrations
        .then(() => {
          complaintDB.get(selectPlatformSettings, [], (selectErr, row) => {
            if (selectErr) {
              console.error('Error fetching platform settings:', selectErr.message);
              return;
            }
            if (row) {
              return;
            }

            complaintDB.run(
              insertDefaultPlatformSettings,
              [
                DEFAULT_PLATFORM_SETTINGS.system_name,
                DEFAULT_PLATFORM_SETTINGS.maintenance_mode,
                DEFAULT_PLATFORM_SETTINGS.default_org_status,
                DEFAULT_PLATFORM_SETTINGS.password_min_length,
                DEFAULT_PLATFORM_SETTINGS.session_ttl_minutes,
                DEFAULT_PLATFORM_SETTINGS.require_email_verification,
                DEFAULT_PLATFORM_SETTINGS.enforce_status_sequence,
                DEFAULT_PLATFORM_SETTINGS.require_admin_response_on_resolve,
                DEFAULT_PLATFORM_SETTINGS.escalation_threshold_hours,
                DEFAULT_PLATFORM_SETTINGS.enforce_escalation_threshold,
                DEFAULT_PLATFORM_SETTINGS.response_sla_hours,
                DEFAULT_PLATFORM_SETTINGS.notifications_enabled,
                DEFAULT_PLATFORM_SETTINGS.notify_on_complaint_created,
                DEFAULT_PLATFORM_SETTINGS.notify_on_status_change,
                DEFAULT_PLATFORM_SETTINGS.notify_on_response,
                DEFAULT_PLATFORM_SETTINGS.notify_on_escalation,
                DEFAULT_PLATFORM_SETTINGS.notify_on_chat_message,
                DEFAULT_PLATFORM_SETTINGS.notify_on_assignment
              ],
              (insertErr) => {
                if (insertErr) {
                  console.error('Error seeding platform settings:', insertErr.message);
                }
              }
            );
          });
        })
        .catch((migrationErr) => {
          console.error('Error migrating platform settings table:', migrationErr.message);
        });
    });
  });
};

export const getPlatformSettings = (req, res) => {
  if (req.user?.role !== 'super_admin') {
    return sendError(res, 403, 'Only super_admin can access platform settings');
  }

  complaintDB.get(selectPlatformSettings, [], (err, row) => {
    if (err) {
      return sendError(res, 500, 'Failed to fetch platform settings', err.message);
    }
    if (!row) {
      return sendSuccess(res, 200, 'Platform settings retrieved successfully', {
        id: 1,
        ...DEFAULT_PLATFORM_SETTINGS
      });
    }
    return sendSuccess(res, 200, 'Platform settings retrieved successfully', normalizePlatformSettings(row));
  });
};

export const updatePlatformSettingsHandler = (req, res) => {
  if (req.user?.role !== 'super_admin') {
    return sendError(res, 403, 'Only super_admin can update platform settings');
  }

  const systemName = String(req.body?.system_name || '').trim();
  const maintenanceMode = toBoolInt(req.body?.maintenance_mode);
  const defaultOrgStatus = String(req.body?.default_org_status || '').trim().toLowerCase();
  const passwordMinLength = Number(req.body?.password_min_length || DEFAULT_PLATFORM_SETTINGS.password_min_length);
  const sessionTtlMinutes = Number(req.body?.session_ttl_minutes || DEFAULT_PLATFORM_SETTINGS.session_ttl_minutes);
  const requireEmailVerification = toBoolInt(req.body?.require_email_verification);
  const enforceStatusSequence = toBoolInt(req.body?.enforce_status_sequence);
  const requireAdminResponseOnResolve = toBoolInt(req.body?.require_admin_response_on_resolve);
  const escalationThresholdHours = Number(
    req.body?.escalation_threshold_hours || DEFAULT_PLATFORM_SETTINGS.escalation_threshold_hours
  );
  const enforceEscalationThreshold = toBoolInt(req.body?.enforce_escalation_threshold);
  const responseSlaHours = Number(req.body?.response_sla_hours || DEFAULT_PLATFORM_SETTINGS.response_sla_hours);
  const notificationsEnabled = toBoolInt(req.body?.notifications_enabled);
  const notifyOnComplaintCreated = toBoolInt(req.body?.notify_on_complaint_created);
  const notifyOnStatusChange = toBoolInt(req.body?.notify_on_status_change);
  const notifyOnResponse = toBoolInt(req.body?.notify_on_response);
  const notifyOnEscalation = toBoolInt(req.body?.notify_on_escalation);
  const notifyOnChatMessage = toBoolInt(req.body?.notify_on_chat_message);
  const notifyOnAssignment = toBoolInt(req.body?.notify_on_assignment);

  if (!systemName) {
    return sendError(res, 400, 'system_name is required');
  }
  if (!['active', 'inactive'].includes(defaultOrgStatus)) {
    return sendError(res, 400, 'default_org_status must be active or inactive');
  }
  if (!Number.isInteger(passwordMinLength) || passwordMinLength < 6 || passwordMinLength > 64) {
    return sendError(res, 400, 'password_min_length must be between 6 and 64');
  }
  if (!Number.isInteger(sessionTtlMinutes) || sessionTtlMinutes < 15 || sessionTtlMinutes > 10080) {
    return sendError(res, 400, 'session_ttl_minutes must be between 15 and 10080');
  }
  if (!Number.isInteger(escalationThresholdHours) || escalationThresholdHours < 1 || escalationThresholdHours > 720) {
    return sendError(res, 400, 'escalation_threshold_hours must be between 1 and 720');
  }
  if (!Number.isInteger(responseSlaHours) || responseSlaHours < 1 || responseSlaHours > 720) {
    return sendError(res, 400, 'response_sla_hours must be between 1 and 720');
  }

  complaintDB.run(
    updatePlatformSettings,
    [
      systemName,
      maintenanceMode,
      defaultOrgStatus,
      passwordMinLength,
      sessionTtlMinutes,
      requireEmailVerification,
      enforceStatusSequence,
      requireAdminResponseOnResolve,
      escalationThresholdHours,
      enforceEscalationThreshold,
      responseSlaHours,
      notificationsEnabled,
      notifyOnComplaintCreated,
      notifyOnStatusChange,
      notifyOnResponse,
      notifyOnEscalation,
      notifyOnChatMessage,
      notifyOnAssignment
    ],
    (err) => {
      if (err) {
        return sendError(res, 500, 'Failed to update platform settings', err.message);
      }
      complaintDB.get(selectPlatformSettings, [], (getErr, row) => {
        if (getErr) {
          return sendError(res, 500, 'Failed to fetch platform settings', getErr.message);
        }
        const auditMeta = buildAuditMetadata(req);
        auditMeta.updated_fields = {
          system_name: systemName,
          maintenance_mode: maintenanceMode,
          default_org_status: defaultOrgStatus,
          password_min_length: passwordMinLength,
          session_ttl_minutes: sessionTtlMinutes,
          require_email_verification: requireEmailVerification,
          enforce_status_sequence: enforceStatusSequence,
          require_admin_response_on_resolve: requireAdminResponseOnResolve,
          escalation_threshold_hours: escalationThresholdHours,
          enforce_escalation_threshold: enforceEscalationThreshold,
          response_sla_hours: responseSlaHours,
          notifications_enabled: notificationsEnabled,
          notify_on_complaint_created: notifyOnComplaintCreated,
          notify_on_status_change: notifyOnStatusChange,
          notify_on_response: notifyOnResponse,
          notify_on_escalation: notifyOnEscalation,
          notify_on_chat_message: notifyOnChatMessage,
          notify_on_assignment: notifyOnAssignment
        };
        void logAuditEntry(req, {
          action: 'update_platform_settings',
          targetTable: 'platform_settings',
          targetId: 1,
          metadata: auditMeta
        }).catch(() => {
          console.error('Failed to record audit log for platform settings update');
        });
        return sendSuccess(res, 200, 'Platform settings updated successfully', normalizePlatformSettings(row));
      });
    }
  );
};
