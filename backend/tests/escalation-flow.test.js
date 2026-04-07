import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtempSync } from 'node:fs';

const tempDir = mkdtempSync(path.join(os.tmpdir(), 'voicelink-escalations-'));
const dbPath = path.join(tempDir, 'escalations.sqlite');

process.env.COMPLAINT_DB_PATH = dbPath;
process.env.JWT_SECRET = 'escalation-test-secret';
process.env.NODE_ENV = 'test';

const { default: complaintDB } = await import('../src/model/connect.js');
const { CreateUsersTable } = await import('../src/controllers/user.controller.js');
const { CreateOrganizationTable } = await import('../src/controllers/organization.controller.js');
const { CreateComplaintTable } = await import('../src/controllers/complaint.controller.js');
const { CreateDepartmentTable } = await import('../src/controllers/department.controller.js');
const { CreateAccessmentsTable } = await import('../src/controllers/accessment.controller.js');
const { CreateEscalationsTable, createEscalation, updateEscalationStatus } = await import('../src/controllers/escalation.controller.js');
const { CreateNotificationsTable } = await import('../src/controllers/notification.controller.js');

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

const orgAdmin = { id: 2, role: 'org_admin', organization_id: 1 };

before(async () => {
  CreateUsersTable();
  CreateOrganizationTable();
  CreateDepartmentTable();
  CreateComplaintTable();
  CreateAccessmentsTable();
  CreateEscalationsTable();
  CreateNotificationsTable();

  await waitFor(async () => {
    const row = await getQuery(
      "SELECT COUNT(*) AS count FROM sqlite_master WHERE type = 'table' AND name IN ('users', 'organization', 'department', 'complaint', 'accessments', 'escalations', 'notifications')"
    );
    return Number(row?.count || 0) >= 7;
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
    VALUES
      (?, ?, ?, ?, ?, 0, 'active', 'org_admin', 1),
      (?, ?, ?, ?, ?, 0, 'active', 'org_admin', 1)
    `,
    [2, 1, 'Primary Org Admin', 'org-admin@example.com', 'hashed-password', 3, 1, 'Assigned Admin', 'assigned-admin@example.com', 'hashed-password']
  );

  await runQuery(
    `
    INSERT INTO complaint (
      id, user_id, organization_id, is_anonymous, anonymous_label, title, complaint, category, priority, status, tracking_code
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [1, null, 1, 1, 'Anonymous', 'Missed escalation path', 'Complaint body', 'Service', 'high', 'submitted', 'TRK-111-111']
  );

  await runQuery(
    `
    INSERT INTO accessments (
      id, complaint_id, organization_id, assessor_id, findings, recommendation, status, admin_response
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [1, 1, 1, 2, 'Validated issue', 'Escalate quickly', 'in_review', null]
  );
});

after(async () => {
  await new Promise((resolve) => complaintDB.close(() => resolve()));
});

test('createEscalation returns complaint linkage from the related assessment', async () => {
  const response = await invoke(createEscalation, {
    user: orgAdmin,
    body: {
      accessment_id: 1,
      assigned_to: 3,
      escalation_level: 'level_2',
      reason: 'Needs senior review',
      notes: 'Escalate to the assigned admin',
      status: 'pending'
    }
  });

  assert.equal(response.status, 201);
  assert.equal(response.body.data.complaint_id, 1);
  assert.equal(response.body.data.complaint_title, 'Missed escalation path');
});

test('createEscalation blocks terminal statuses on creation', async () => {
  const response = await invoke(createEscalation, {
    user: orgAdmin,
    body: {
      accessment_id: 1,
      escalation_level: 'level_1',
      reason: 'Trying to skip workflow',
      status: 'resolved'
    }
  });

  assert.equal(response.status, 400);
  assert.match(response.body.message, /must start as pending or in_progress/i);
});

test('updateEscalationStatus auto-populates resolved_at when resolving', async () => {
  const response = await invoke(updateEscalationStatus, {
    user: orgAdmin,
    params: { id: '1' },
    body: {
      status: 'resolved'
    }
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.data.status, 'resolved');
  assert.ok(response.body.data.resolved_at);
});

test('updateEscalationStatus clears resolved_at when moving back to a non-resolved state', async () => {
  const response = await invoke(updateEscalationStatus, {
    user: orgAdmin,
    params: { id: '1' },
    body: {
      status: 'in_progress'
    }
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.data.status, 'in_progress');
  assert.equal(response.body.data.resolved_at, null);
});
