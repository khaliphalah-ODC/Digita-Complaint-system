import complaintDB from '../model/connect.js';
import {
  createNotificationQuery,
  fetchNotificationByIdQuery
} from '../model/notification.model.js';
import {
  selectOrganizationSettingsByOrganizationId,
  selectUserSettingsByUserId
} from '../model/settings.model.js';
import { getPlatformSettingsSafe } from '../utils/platformSettings.js';

export const NOTIFICATION_TYPES = {
  COMPLAINT_CREATED: 'complaint_created',
  COMPLAINT_ASSIGNED: 'complaint_assigned',
  COMPLAINT_UPDATED: 'complaint_updated',
  COMPLAINT_RESOLVED: 'complaint_resolved',
  COMPLAINT_CLOSED: 'complaint_closed',
  COMPLAINT_RESPONSE: 'complaint_response',
  CHAT_MESSAGE: 'chat_message',
  ESCALATION_CREATED: 'escalation_created',
  ESCALATION_UPDATED: 'escalation_updated',
  ESCALATION_ASSIGNED: 'escalation_assigned',
  PUBLIC_FEEDBACK_SUBMITTED: 'public_feedback_submitted'
};

const isNotificationEnabledForType = (settings, type) => {
  if (Number(settings.notifications_enabled || 0) !== 1) {
    return false;
  }

  switch (type) {
    case NOTIFICATION_TYPES.COMPLAINT_CREATED:
      return Number(settings.notify_on_complaint_created || 0) === 1;
    case NOTIFICATION_TYPES.COMPLAINT_ASSIGNED:
      return Number(settings.notify_on_assignment || 0) === 1;
    case NOTIFICATION_TYPES.COMPLAINT_UPDATED:
    case NOTIFICATION_TYPES.COMPLAINT_RESOLVED:
    case NOTIFICATION_TYPES.COMPLAINT_CLOSED:
      return Number(settings.notify_on_status_change || 0) === 1;
    case NOTIFICATION_TYPES.COMPLAINT_RESPONSE:
      return Number(settings.notify_on_response || 0) === 1;
    case NOTIFICATION_TYPES.ESCALATION_CREATED:
    case NOTIFICATION_TYPES.ESCALATION_UPDATED:
    case NOTIFICATION_TYPES.ESCALATION_ASSIGNED:
      return Number(settings.notify_on_escalation || 0) === 1;
    case NOTIFICATION_TYPES.CHAT_MESSAGE:
      return Number(settings.notify_on_chat_message || 0) === 1;
    default:
      return true;
  }
};

const getQuery = (sql, params = []) =>
  new Promise((resolve, reject) => {
    complaintDB.get(sql, params, (err, row) => {
      if (err) return reject(err);
      return resolve(row || null);
    });
  });

const isOrganizationNotificationEnabledForType = (settings, type) => {
  if (!settings) {
    return true;
  }

  switch (type) {
    case NOTIFICATION_TYPES.COMPLAINT_CREATED:
    case NOTIFICATION_TYPES.COMPLAINT_ASSIGNED:
      return Number(settings.notify_on_new_complaints || 0) === 1;
    case NOTIFICATION_TYPES.ESCALATION_CREATED:
    case NOTIFICATION_TYPES.ESCALATION_UPDATED:
    case NOTIFICATION_TYPES.ESCALATION_ASSIGNED:
      return Number(settings.notify_on_escalations || 0) === 1;
    case NOTIFICATION_TYPES.PUBLIC_FEEDBACK_SUBMITTED:
      return Number(settings.notify_on_public_feedback || 0) === 1;
    default:
      return true;
  }
};

const isUserNotificationEnabledForType = (settings, type) => {
  if (!settings) {
    return true;
  }

  switch (type) {
    case NOTIFICATION_TYPES.COMPLAINT_CREATED:
    case NOTIFICATION_TYPES.COMPLAINT_ASSIGNED:
    case NOTIFICATION_TYPES.COMPLAINT_UPDATED:
    case NOTIFICATION_TYPES.COMPLAINT_RESOLVED:
    case NOTIFICATION_TYPES.COMPLAINT_CLOSED:
    case NOTIFICATION_TYPES.COMPLAINT_RESPONSE:
    case NOTIFICATION_TYPES.CHAT_MESSAGE:
    case NOTIFICATION_TYPES.ESCALATION_CREATED:
    case NOTIFICATION_TYPES.ESCALATION_UPDATED:
    case NOTIFICATION_TYPES.ESCALATION_ASSIGNED:
      return Number(settings.notify_status_updates || 0) === 1;
    case NOTIFICATION_TYPES.PUBLIC_FEEDBACK_SUBMITTED:
      return Number(settings.notify_public_feedback || 0) === 1;
    default:
      return true;
  }
};

export const createSystemNotification = async ({
  organizationId = null,
  userId = null,
  complaintId = null,
  type,
  message
}) => {
  const settings = await getPlatformSettingsSafe();
  if (!isNotificationEnabledForType(settings, type)) {
    return null;
  }

  const [organizationSettings, userSettings] = await Promise.all([
    organizationId ? getQuery(selectOrganizationSettingsByOrganizationId, [organizationId]).catch(() => null) : Promise.resolve(null),
    userId ? getQuery(selectUserSettingsByUserId, [userId]).catch(() => null) : Promise.resolve(null)
  ]);

  if (!isOrganizationNotificationEnabledForType(organizationSettings, type)) {
    return null;
  }

  if (!isUserNotificationEnabledForType(userSettings, type)) {
    return null;
  }

  return new Promise((resolve, reject) => {
    if (!type || !message) {
      reject(new Error('type and message are required'));
      return;
    }

    complaintDB.run(
      createNotificationQuery,
      [organizationId, userId, complaintId, type, message, 0],
      function onCreate(err) {
        if (err) {
          reject(err);
          return;
        }

        complaintDB.get(fetchNotificationByIdQuery, [this.lastID], (getErr, row) => {
          if (getErr) {
            reject(getErr);
            return;
          }
          resolve(row);
        });
      }
    );
  });
};

export const createSystemNotificationSafely = (payload, context = 'notification') => {
  return createSystemNotification(payload).catch((error) => {
    console.error(`Failed to create ${context}:`, error.message);
    return null;
  });
};
