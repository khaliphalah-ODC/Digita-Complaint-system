import complaintDB from '../model/connect.js';
import { insertAuditLogQuery } from '../model/audit.model.js';

export const buildAuditMetadata = (req) => {
  const headers = req?.headers || {};
  const forwardedFor = headers['x-forwarded-for'];
  return {
    path: req?.originalUrl || req?.path || '',
    method: req?.method || '',
    ip: forwardedFor?.split(',')[0]?.trim() || req?.ip || null,
    user_agent: headers['user-agent'] || null,
    timestamp: new Date().toISOString()
  };
};

export const logAuditEntry = (req, { action, targetTable, targetId, metadata = {} }) =>
  new Promise((resolve, reject) => {
    if (!req) {
      return resolve();
    }
    const actorId = req.user?.id || null;
    const actorRole = req.user?.role || null;
    const payload = JSON.stringify({ ...metadata });

    complaintDB.run(
      insertAuditLogQuery,
      [actorId, actorRole, action, targetTable, targetId || null, payload],
      (err) => {
        if (err) {
          return reject(err);
        }
        return resolve();
      }
    );
  });
