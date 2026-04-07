import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtempSync } from 'node:fs';
import bcrypt from 'bcrypt';

const tempDir = mkdtempSync(path.join(os.tmpdir(), 'dcms-settings-'));
const dbPath = path.join(tempDir, 'settings.sqlite');

process.env.COMPLAINT_DB_PATH = dbPath;
process.env.JWT_SECRET = 'settings-test-secret';
process.env.PUBLIC_FEEDBACK_URL_BASE = 'http://localhost:5173/public-feedback/';
process.env.NODE_ENV = 'test';

const { default: complaintDB } = await import('../src/model/connect.js');
const { CreateUsersTable } = await import('../src/controllers/user.controller.js');
const { CreateOrganizationTable } = await import('../src/controllers/organization.controller.js');
const { CreateComplaintTable } = await import('../src/controllers/complaint.controller.js');
const { CreateAccessmentsTable } = await import('../src/controllers/assessment.controller.js');
const { CreateDepartmentTable } = await import('../src/controllers/department.controller.js');
const { CreatePublicFeedbackTables } = await import('../src/controllers/publicFeedback.controller.js');
const {
  CreateSettingsTables,
  getCurrentOrganizationSettings,
  getCurrentUserSettings,
  updateCurrentOrganizationSettings,
  updateCurrentUserSettings
} = await import('../src/controllers/settings.controller.js');

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

const invoke = (handler, req = {}) =>
  new Promise((resolve, reject) => {
    let statusCode = 200;
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(payload) {
        resolve({ status: statusCode, body: payload });
        return this;
      }
    };

    try {
      const maybePromise = handler(req, res);
      if (maybePromise?.catch) {
        maybePromise.catch(reject);
      }
    } catch (error) {
      reject(error);
    }
  });

const state = {
  orgAdmin: { id: 10, role: 'org_admin', organization_id: 1 },
  user: { id: 11, role: 'user', organization_id: 1 },
  superAdmin: { id: 12, role: 'super_admin', organization_id: null }
};

before(async () => {
  CreateUsersTable();
  CreateOrganizationTable();
  CreateComplaintTable();
  CreateAccessmentsTable();
  CreateDepartmentTable();
  CreatePublicFeedbackTables();
  CreateSettingsTables();

  await waitFor(async () => {
    const row = await getQuery(
      "SELECT COUNT(*) AS count FROM sqlite_master WHERE type = 'table' AND name IN ('users', 'organization', 'department', 'feedback_forms', 'organization_settings', 'user_settings')"
    );
    return Number(row?.count || 0) >= 6;
  });

  const passwordHash = await bcrypt.hash('Admin@123', 10);

  await runQuery(
    `
    INSERT INTO organization (
      organization_id, name, organization_type, email, phone, address, logo, status, join_code, public_feedback_slug, self_signup_enabled
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [1, 'Civic Health Board', 'Government', 'org-settings@example.com', '231111111', 'Monrovia', null, 'active', 'JOIN-SETTINGS', 'civic-health-board', 1]
  );

  await runQuery(
    `
    INSERT INTO users (id, organization_id, full_name, email, password, must_change_password, status, role, email_verified)
    VALUES
      (?, ?, ?, ?, ?, 0, 'active', 'org_admin', 1),
      (?, ?, ?, ?, ?, 0, 'active', 'user', 1),
      (?, NULL, ?, ?, ?, 0, 'active', 'super_admin', 1)
    `,
    [
      10, 1, 'Org Settings Admin', 'org-admin-settings@example.com', passwordHash,
      11, 1, 'Resident User', 'resident-user@example.com', passwordHash,
      12, 'Platform Owner', 'platform-owner@example.com', passwordHash
    ]
  );

  await runQuery(
    `
    INSERT INTO department (id, organization_id, name, description, accessment_id)
    VALUES (?, ?, ?, ?, ?)
    `,
    [1, 1, 'Citizen Support', 'Handles citizen support requests', null]
  );

  await runQuery(
    `
    INSERT INTO feedback_forms (
      organization_id, slug, title, description, is_public, is_active, allow_anonymous
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [1, 'civic-health-board', 'Public Service Feedback', 'Share how our team handled your issue.', 1, 1, 1]
  );
});

after(async () => {
  await new Promise((resolve) => complaintDB.close(() => resolve()));
});

test('org-admin settings endpoint returns only organization-scoped data for the authenticated org admin', async () => {
  const response = await invoke(getCurrentOrganizationSettings, {
    user: state.orgAdmin
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.organization.organization_id, 1);
  assert.equal(response.body.data.organization.name, 'Civic Health Board');
  assert.equal(response.body.data.public_feedback.public_url, 'http://localhost:5173/public-feedback/civic-health-board');
  assert.deepEqual(response.body.data.departments, [{ id: 1, name: 'Citizen Support' }]);
});

test('org-admin settings endpoint blocks super admins from org-admin-only organization settings', async () => {
  const response = await invoke(getCurrentOrganizationSettings, {
    user: state.superAdmin
  });

  assert.equal(response.status, 403);
  assert.match(response.body.message, /only org_admin/i);
});

test('org-admin settings updates change only the authenticated organization configuration', async () => {
  const response = await invoke(updateCurrentOrganizationSettings, {
    user: state.orgAdmin,
    body: {
      organization: {
        name: 'Civic Health Board Updated',
        organization_type: 'Public Agency',
        email: 'updated-org-settings@example.com',
        phone: '231222222',
        address: 'Sinkor, Monrovia',
        logo: 'https://example.com/logo.png',
        description: 'Updated organization profile text.'
      },
      workflow: {
        anonymous_complaints_enabled: false,
        default_department_id: 1,
        auto_route_to_department: true,
        escalation_threshold_hours: 24,
        response_sla_hours: 12
      },
      notifications: {
        notify_on_new_complaints: true,
        notify_on_public_feedback: false,
        notify_on_escalations: true
      },
      access_controls: {
        allow_org_admin_user_management: false
      }
    }
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.data.organization.name, 'Civic Health Board Updated');
  assert.equal(response.body.data.workflow.default_department_id, 1);
  assert.equal(response.body.data.workflow.auto_route_to_department, true);
  assert.equal(response.body.data.notifications.notify_on_public_feedback, false);
  assert.equal(response.body.data.access_controls.allow_org_admin_user_management, false);

  const persistedOrganization = await getQuery(
    'SELECT name, organization_type, email, phone, address, logo FROM organization WHERE organization_id = ?',
    [1]
  );
  assert.deepEqual(persistedOrganization, {
    name: 'Civic Health Board Updated',
    organization_type: 'Public Agency',
    email: 'updated-org-settings@example.com',
    phone: 231222222,
    address: 'Sinkor, Monrovia',
    logo: 'https://example.com/logo.png'
  });

  const persistedSettings = await getQuery(
    `
    SELECT description, anonymous_complaints_enabled, default_department_id, auto_route_to_department,
           escalation_threshold_hours, response_sla_hours, notify_on_new_complaints,
           notify_on_public_feedback, notify_on_escalations, allow_org_admin_user_management
    FROM organization_settings
    WHERE organization_id = ?
    `,
    [1]
  );

  assert.deepEqual(persistedSettings, {
    description: 'Updated organization profile text.',
    anonymous_complaints_enabled: 0,
    default_department_id: 1,
    auto_route_to_department: 1,
    escalation_threshold_hours: 24,
    response_sla_hours: 12,
    notify_on_new_complaints: 1,
    notify_on_public_feedback: 0,
    notify_on_escalations: 1,
    allow_org_admin_user_management: 0
  });
});

test('user settings endpoints return and update only the authenticated user account', async () => {
  const getResponse = await invoke(getCurrentUserSettings, {
    user: state.user
  });

  assert.equal(getResponse.status, 200);
  assert.equal(getResponse.body.data.profile.id, 11);
  assert.equal(getResponse.body.data.profile.email, 'resident-user@example.com');

  const updateResponse = await invoke(updateCurrentUserSettings, {
    user: state.user,
    body: {
      profile: {
        full_name: 'Resident User Updated',
        phone: '5551234',
        profile_image: 'https://example.com/profile.png'
      },
      notifications: {
        notify_email_updates: false,
        notify_status_updates: true,
        notify_public_feedback: true
      },
      preferences: {
        anonymity_preference: true
      }
    }
  });

  assert.equal(updateResponse.status, 200);
  assert.equal(updateResponse.body.data.profile.full_name, 'Resident User Updated');
  assert.equal(updateResponse.body.data.profile.phone, '5551234');
  assert.equal(updateResponse.body.data.notifications.notify_email_updates, false);
  assert.equal(updateResponse.body.data.preferences.anonymity_preference, true);

  const persistedUser = await getQuery('SELECT full_name FROM users WHERE id = ?', [11]);
  assert.deepEqual(persistedUser, { full_name: 'Resident User Updated' });

  const persistedSettings = await getQuery(
    `
    SELECT phone, profile_image, notify_email_updates, notify_status_updates, notify_public_feedback, anonymity_preference
    FROM user_settings
    WHERE user_id = ?
    `,
    [11]
  );

  assert.deepEqual(persistedSettings, {
    phone: '5551234',
    profile_image: 'https://example.com/profile.png',
    notify_email_updates: 0,
    notify_status_updates: 1,
    notify_public_feedback: 1,
    anonymity_preference: 1
  });
});
