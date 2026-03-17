import complaintDB from '../model/connect.js';
import { AuditLogTable } from '../model/audit.model.js';

export const CreateAuditLogsTable = () => {
  complaintDB.run(AuditLogTable, (err) => {
    if (err) {
      console.error('Error creating audit_logs table:', err.message);
    } else {
      console.log('Audit logs table created or already exists');
    }
  });
};
