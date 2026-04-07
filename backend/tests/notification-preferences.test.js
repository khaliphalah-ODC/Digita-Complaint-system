import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtempSync } from 'node:fs';

const tempDir = mkdtempSync(path.join(os.tmpdir(), 'voicelink-notifications-'));
const dbPath = path.join(tempDir, 'notifications.sqlite');

process.env.COMPLAINT_DB_PATH = dbPath;
process.env.JWT_SECRET = 'notification-test-secret';
process.env.NODE_ENV = 'test';

const { default: complaintDB } = await import('../src/model/connect.js');
const { CreateUsersTable } = await import('../src/controllers/user.controller.js');
const { CreateOrganizationTable } = await import('../src/controllers/organization.controller.js');
const { CreateComplaintTable } = await import('../src/controllers/complaint.controller.js');
const { CreateNotificationsTable } = await import('../src/controllers/notification.controller.js');
const { CreateSettingsTables } = await import('../src/controllers/settings.controller.js');
const { createSystemNotification, NOTIFICATION_TYPES } = await import('../src/services/notification.service.js');

const runQuery = (sql, params = []) =>
  new Promise((resolve, reject) => {
    complaintDB.run(sql, params, function onRun(err) {
      if (err) return reject(err);
      return resolve(this);
    });
  });

const getQuery = (sql, params = []) =>
  new Promise((resolve, reject) => {
    complaintDB.get(sql, params, (err, row) => {
      if (err) return reject(err);
      return resolve(row || null);
    });
  });

const waitFor = async (predicate, timeoutMs = 5000) => {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (await predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Timed out waiting for condition');
};

before(async () => {
  CreateUsersTable();
  CreateOrganizationTable();
  CreateComplaintTable();
  CreateNotificationsTable();
  CreateSettingsTables();

  await waitFor(async () => {
    const row = await getQuery(
      "SELECT COUNT(*) AS count FROM sqlite_master WHERE type = 'table' AND name IN ('users', 'organization', 'complaint', 'notifications', 'organization_settings', 'user_settings')"
    );
    return Number(row?.count || 0) >= 6;
  });

  await runQuery(
    `
    INSERT INTO organization (
      organization_id, name, organization_type, email, phone, address, logo, status, join_code, public_feedback_slug, self_signup_enabled
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [1, 'VoiceLink Org', 'Institution', 'org@example.com', '231000000', 'Monrovia', null, 'active', 'JOIN-ORG', 'voicelink-org', 1]
  );

  await runQuery(
    `
    INSERT INTO users (id, organization_id, full_name, email, password, must_change_password, status, role, email_verified)
    VALUES (?, ?, ?, ?, ?, 0, 'active', 'user', 1)
    `,
    [10, 1, 'Notification User', 'notify-user@example.com', 'hashed-password']
  );
});

after(async () => {
  await new Promise((resolve) => complaintDB.close(() => resolve()));
});

test('user notification preference blocks user-targeted status notifications', async () => {
  await runQuery(
    `
    INSERT INTO user_settings (
      user_id, phone, profile_image, notify_email_updates, notify_status_updates, notify_public_feedback, anonymity_preference
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [10, '', '', 1, 0, 0, 0]
  );

  const created = await createSystemNotification({
    organizationId: 1,
    userId: 10,
    type: NOTIFICATION_TYPES.COMPLAINT_UPDATED,
    message: 'Your complaint status changed.'
  });

  assert.equal(created, null);

  const row = await getQuery('SELECT COUNT(*) AS count FROM notifications');
  assert.equal(Number(row?.count || 0), 0);
});

test('organization notification preference blocks organization-wide complaint notifications', async () => {
  await runQuery(
    `
    INSERT INTO organization_settings (
      organization_id, description, anonymous_complaints_enabled, default_department_id, auto_route_to_department,
      escalation_threshold_hours, response_sla_hours, notify_on_new_complaints, notify_on_public_feedback,
      notify_on_escalations, allow_org_admin_user_management
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [1, '', 1, null, 0, 72, 48, 0, 1, 1, 1]
  );

  const created = await createSystemNotification({
    organizationId: 1,
    type: NOTIFICATION_TYPES.COMPLAINT_CREATED,
    message: 'A new complaint was submitted.'
  });

  assert.equal(created, null);

  const row = await getQuery('SELECT COUNT(*) AS count FROM notifications');
  assert.equal(Number(row?.count || 0), 0);
});

test('organization public feedback preference blocks public feedback notifications', async () => {
  await runQuery('DELETE FROM notifications');
  await runQuery('DELETE FROM organization_settings');

  await runQuery(
    `
    INSERT INTO organization_settings (
      organization_id, description, anonymous_complaints_enabled, default_department_id, auto_route_to_department,
      escalation_threshold_hours, response_sla_hours, notify_on_new_complaints, notify_on_public_feedback,
      notify_on_escalations, allow_org_admin_user_management
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [1, '', 1, null, 0, 72, 48, 1, 0, 1, 1]
  );

  const created = await createSystemNotification({
    organizationId: 1,
    type: NOTIFICATION_TYPES.PUBLIC_FEEDBACK_SUBMITTED,
    message: 'New public feedback was submitted.'
  });

  assert.equal(created, null);

  const row = await getQuery('SELECT COUNT(*) AS count FROM notifications');
  assert.equal(Number(row?.count || 0), 0);
});
