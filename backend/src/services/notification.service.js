import complaintDB from '../model/connect.js';
import {
  createNotificationQuery,
  fetchNotificationByIdQuery
} from '../model/notification.model.js';
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
  ESCALATION_ASSIGNED: 'escalation_assigned'
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
