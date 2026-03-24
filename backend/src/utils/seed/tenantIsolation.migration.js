import 'dotenv/config';
import complaintDB from '../../model/connect.js';

const allQuery = (sql, params = []) =>
  new Promise((resolve, reject) => {
    complaintDB.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      return resolve(rows || []);
    });
  });

const getQuery = (sql, params = []) =>
  new Promise((resolve, reject) => {
    complaintDB.get(sql, params, (err, row) => {
      if (err) return reject(err);
      return resolve(row || null);
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
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
    [tableName]
  );
  return Boolean(row?.name);
};

const ensureColumn = async (tableName, columnName, sqlDefinition) => {
  if (!(await tableExists(tableName))) {
    return false;
  }

  const columns = await allQuery(`PRAGMA table_info(${tableName})`);
  const hasColumn = columns.some((column) => column.name === columnName);
  if (!hasColumn) {
    await runQuery(`ALTER TABLE ${tableName} ADD COLUMN ${sqlDefinition}`);
  }
  return true;
};

const countRows = async (sql, params = []) => {
  const row = await getQuery(sql, params);
  return Number(row?.count || 0);
};

const printSummary = (label, value) => {
  console.log(`${label}: ${value}`);
};

const migrateUsers = async () => {
  const usersTableExists = await ensureColumn('users', 'organization_id', 'organization_id INTEGER');
  if (!usersTableExists) {
    return;
  }

  const orphanOrgAdmins = await countRows(
    "SELECT COUNT(*) AS count FROM users WHERE role = 'org_admin' AND organization_id IS NULL"
  );
  const tenantUsers = await countRows(
    "SELECT COUNT(*) AS count FROM users WHERE role IN ('org_admin', 'user') AND organization_id IS NOT NULL"
  );

  printSummary('users with organization_id', tenantUsers);
  printSummary('org_admin records still missing organization_id', orphanOrgAdmins);
};

const migrateComplaints = async () => {
  const complaintTableExists = await ensureColumn('complaint', 'organization_id', 'organization_id INTEGER');
  if (!complaintTableExists) {
    return;
  }

  await runQuery(`
    UPDATE complaint
    SET organization_id = (
      SELECT u.organization_id
      FROM users u
      WHERE u.id = complaint.user_id
    )
    WHERE organization_id IS NULL AND user_id IS NOT NULL
  `);

  const assignedComplaints = await countRows(
    'SELECT COUNT(*) AS count FROM complaint WHERE organization_id IS NOT NULL'
  );
  const unresolvedComplaints = await countRows(
    'SELECT COUNT(*) AS count FROM complaint WHERE organization_id IS NULL AND user_id IS NOT NULL'
  );
  const anonymousComplaints = await countRows(
    'SELECT COUNT(*) AS count FROM complaint WHERE organization_id IS NULL AND user_id IS NULL'
  );

  printSummary('complaints with organization_id', assignedComplaints);
  printSummary('legacy complaints still missing organization_id', unresolvedComplaints);
  printSummary('anonymous complaints left organizationless', anonymousComplaints);
};

const migrateDepartments = async () => {
  const departmentTableExists = await ensureColumn('department', 'organization_id', 'organization_id INTEGER');
  if (!departmentTableExists) {
    return;
  }

  const unresolvedDepartments = await countRows(
    'SELECT COUNT(*) AS count FROM department WHERE organization_id IS NULL'
  );
  printSummary('departments still missing organization_id', unresolvedDepartments);
};

const migrateAccessments = async () => {
  const accessmentsTableExists = await ensureColumn('accessments', 'organization_id', 'organization_id INTEGER');
  if (!accessmentsTableExists) {
    return;
  }

  await runQuery(`
    UPDATE accessments
    SET organization_id = (
      SELECT c.organization_id
      FROM complaint c
      WHERE c.id = accessments.complaint_id
    )
    WHERE organization_id IS NULL AND complaint_id IS NOT NULL
  `);

  const assignedAccessments = await countRows(
    'SELECT COUNT(*) AS count FROM accessments WHERE organization_id IS NOT NULL'
  );
  const unresolvedAccessments = await countRows(
    'SELECT COUNT(*) AS count FROM accessments WHERE organization_id IS NULL'
  );

  printSummary('accessments with organization_id', assignedAccessments);
  printSummary('accessments still missing organization_id', unresolvedAccessments);
};

const migrateEscalations = async () => {
  const escalationsTableExists = await ensureColumn('escalations', 'organization_id', 'organization_id INTEGER');
  if (!escalationsTableExists) {
    return;
  }

  await runQuery(`
    UPDATE escalations
    SET organization_id = (
      SELECT a.organization_id
      FROM accessments a
      WHERE a.id = escalations.accessment_id
    )
    WHERE organization_id IS NULL AND accessment_id IS NOT NULL
  `);

  const assignedEscalations = await countRows(
    'SELECT COUNT(*) AS count FROM escalations WHERE organization_id IS NOT NULL'
  );
  const unresolvedEscalations = await countRows(
    'SELECT COUNT(*) AS count FROM escalations WHERE organization_id IS NULL'
  );

  printSummary('escalations with organization_id', assignedEscalations);
  printSummary('escalations still missing organization_id', unresolvedEscalations);
};

const migrateNotifications = async () => {
  const notificationsTableExists = await ensureColumn('notifications', 'organization_id', 'organization_id INTEGER');
  if (!notificationsTableExists) {
    return;
  }

  await runQuery(`
    UPDATE notifications
    SET organization_id = COALESCE(
      (
        SELECT c.organization_id
        FROM complaint c
        WHERE c.id = notifications.complaint_id
      ),
      (
        SELECT u.organization_id
        FROM users u
        WHERE u.id = notifications.user_id
      )
    )
    WHERE organization_id IS NULL
  `);

  const assignedNotifications = await countRows(
    'SELECT COUNT(*) AS count FROM notifications WHERE organization_id IS NOT NULL'
  );
  const unresolvedNotifications = await countRows(
    'SELECT COUNT(*) AS count FROM notifications WHERE organization_id IS NULL'
  );

  printSummary('notifications with organization_id', assignedNotifications);
  printSummary('notifications still missing organization_id', unresolvedNotifications);
};

const migrateStatusLogs = async () => {
  const statusLogsTableExists = await ensureColumn('status_logs', 'organization_id', 'organization_id INTEGER');
  if (!statusLogsTableExists) {
    return;
  }

  await runQuery(`
    UPDATE status_logs
    SET organization_id = (
      SELECT a.organization_id
      FROM accessments a
      WHERE a.id = status_logs.accessment_id
    )
    WHERE organization_id IS NULL AND accessment_id IS NOT NULL
  `);

  const assignedStatusLogs = await countRows(
    'SELECT COUNT(*) AS count FROM status_logs WHERE organization_id IS NOT NULL'
  );
  const unresolvedStatusLogs = await countRows(
    'SELECT COUNT(*) AS count FROM status_logs WHERE organization_id IS NULL'
  );

  printSummary('status_logs with organization_id', assignedStatusLogs);
  printSummary('status_logs still missing organization_id', unresolvedStatusLogs);
};

const main = async () => {
  try {
    console.log('Running tenant isolation migration...');
    await migrateUsers();
    await migrateComplaints();
    await migrateDepartments();
    await migrateAccessments();
    await migrateEscalations();
    await migrateNotifications();
    await migrateStatusLogs();
    console.log('Tenant isolation migration completed.');
  } catch (error) {
    console.error('Tenant isolation migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    complaintDB.close();
  }
};

main();
