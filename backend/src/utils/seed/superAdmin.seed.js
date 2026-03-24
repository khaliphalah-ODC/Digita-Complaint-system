import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import complaintDB from '../../model/connect.js';

dotenv.config();

const SUPER_ADMIN_FULL_NAME = process.env.SUPER_ADMIN_FULL_NAME || 'Platform Super Admin';
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL;
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD;
const SUPER_ADMIN_ORGANIZATION_ID = Number(process.env.SUPER_ADMIN_ORGANIZATION_ID || 1);

const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    complaintDB.run(sql, params, function onRun(err) {
      if (err) return reject(err);
      return resolve(this);
    });
  });

const get = (sql, params = []) =>
  new Promise((resolve, reject) => {
    complaintDB.get(sql, params, (err, row) => {
      if (err) return reject(err);
      return resolve(row || null);
    });
  });

const closeDb = () =>
  new Promise((resolve) => {
    complaintDB.close(() => resolve());
  });

const ensureUsersSchema = async () => {
  const existingUsersSchema = await get(
    "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'users'",
    []
  );

  const schemaSql = existingUsersSchema?.sql || '';
  const needsRoleMigration = schemaSql.includes("CHECK(role IN ('admin', 'user'))");

  if (needsRoleMigration) {
    await run('PRAGMA foreign_keys = OFF');
    await run('BEGIN TRANSACTION');

    try {
      await run('ALTER TABLE users RENAME TO users_old');
      await run(`
        CREATE TABLE users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          organization_id INTEGER,
          department_id INTEGER,
          full_name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          must_change_password INTEGER NOT NULL DEFAULT 0 CHECK(must_change_password IN (0, 1)),
          status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
          role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('super_admin', 'org_admin', 'user')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await run(`
        INSERT INTO users (
          id,
          organization_id,
          department_id,
          full_name,
          email,
          password,
          must_change_password,
          status,
          role,
          created_at,
          updated_at
        )
        SELECT
          id,
          organization_id,
          department_id,
          full_name,
          email,
          password,
          COALESCE(must_change_password, 0),
          status,
          CASE WHEN role = 'admin' THEN 'super_admin' ELSE role END,
          created_at,
          updated_at
        FROM users_old
      `);
      await run('DROP TABLE users_old');
      await run('COMMIT');
    } catch (error) {
      await run('ROLLBACK');
      await run('PRAGMA foreign_keys = ON');
      throw error;
    }

    await run('PRAGMA foreign_keys = ON');
    return;
  }

  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organization_id INTEGER,
      department_id INTEGER,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      must_change_password INTEGER NOT NULL DEFAULT 0 CHECK(must_change_password IN (0, 1)),
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
      role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('super_admin', 'org_admin', 'user')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const columns = await new Promise((resolve, reject) => {
    complaintDB.all('PRAGMA table_info(users)', [], (err, rows) => {
      if (err) return reject(err);
      return resolve(rows || []);
    });
  });
  const hasMustChangePassword = columns.some((col) => col.name === 'must_change_password');
  if (!hasMustChangePassword) {
    await run('ALTER TABLE users ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0');
  }
};

export const seedSuperAdmin = async () => {
  if (!SUPER_ADMIN_EMAIL || !SUPER_ADMIN_PASSWORD) {
    return false;
  }

  await ensureUsersSchema();
  const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10);

  const existing = await get('SELECT id FROM users WHERE email = ?', [SUPER_ADMIN_EMAIL.trim().toLowerCase()]);
  if (existing) {
    await run(
      `
      UPDATE users
      SET
        organization_id = ?,
        full_name = ?,
        password = ?,
        email_verified = 1,
        email_verified_at = CURRENT_TIMESTAMP,
        must_change_password = 0,
        role = 'super_admin',
        status = 'active',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      [SUPER_ADMIN_ORGANIZATION_ID, SUPER_ADMIN_FULL_NAME, hashedPassword, existing.id]
    );
    console.log(`Super admin updated: ${SUPER_ADMIN_EMAIL}`);
    return;
  }

  await run(
    `
      INSERT INTO users (
        organization_id,
        department_id,
        full_name,
        email,
        password,
        email_verified,
        email_verified_at,
        must_change_password,
        status,
        role
      )
      VALUES (?, NULL, ?, ?, ?, 1, CURRENT_TIMESTAMP, 0, 'active', 'super_admin')
    `,
    [SUPER_ADMIN_ORGANIZATION_ID, SUPER_ADMIN_FULL_NAME, SUPER_ADMIN_EMAIL.trim().toLowerCase(), hashedPassword]
  );
  console.log(`Super admin created: ${SUPER_ADMIN_EMAIL}`);
  return true;
};

export const closeSeedDb = closeDb;
