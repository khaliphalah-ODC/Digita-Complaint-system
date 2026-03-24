import complaintDB from '../model/connect.js';
import { AuditLogTable } from '../model/audit.model.js';
import { sendSuccess, sendError } from '../utils/response.js';

const buildAuditFilters = (query) => {
  const filters = [];
  const params = [];
  const search = String(query?.search || '').trim();
  const actorRole = String(query?.actor_role || '').trim();
  const action = String(query?.action || '').trim();
  const targetTable = String(query?.target_table || '').trim();

  if (actorRole) {
    filters.push('actor_role = ?');
    params.push(actorRole);
  }

  if (action) {
    filters.push('action LIKE ?');
    params.push(`%${action}%`);
  }

  if (targetTable) {
    filters.push('target_table LIKE ?');
    params.push(`%${targetTable}%`);
  }

  if (search) {
    filters.push('(action LIKE ? OR target_table LIKE ? OR metadata LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  return { filters, params };
};

export const CreateAuditLogsTable = () => {
  complaintDB.run(AuditLogTable, (err) => {
    if (err) {
      console.error('Error creating audit_logs table:', err.message);
    } else {
      console.log('Audit logs table created or already exists');
    }
  });
};

export const getAuditLogs = (req, res) => {
  if (req.user?.role !== 'super_admin') {
    return sendError(res, 403, 'Only super_admin can access audit logs');
  }

  const limit = Math.min(Math.max(Number(req.query?.limit || 50), 10), 200);
  const offset = Math.max(Number(req.query?.offset || 0), 0);
  const { filters, params } = buildAuditFilters(req.query);
  const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

  const listQuery = `
    SELECT
      id,
      actor_id,
      actor_role,
      action,
      target_table,
      target_id,
      metadata,
      created_at
    FROM audit_logs
    ${whereClause}
    ORDER BY id DESC
    LIMIT ? OFFSET ?
  `;

  const countQuery = `SELECT COUNT(*) AS count FROM audit_logs ${whereClause}`;

  complaintDB.get(countQuery, params, (countErr, countRow) => {
    if (countErr) {
      return sendError(res, 500, 'Failed to fetch audit log count', countErr.message);
    }

    complaintDB.all(listQuery, [...params, limit, offset], (listErr, rows) => {
      if (listErr) {
        return sendError(res, 500, 'Failed to fetch audit logs', listErr.message);
      }
      return sendSuccess(res, 200, 'Audit logs retrieved successfully', {
        items: rows || [],
        total: Number(countRow?.count || 0),
        limit,
        offset
      });
    });
  });
};
