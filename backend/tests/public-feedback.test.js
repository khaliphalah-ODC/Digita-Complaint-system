import test, { before } from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtempSync } from 'node:fs';
import bcrypt from 'bcrypt';

const tempDir = mkdtempSync(path.join(os.tmpdir(), 'dcms-public-feedback-'));
const dbPath = path.join(tempDir, 'public-feedback.sqlite');

process.env.COMPLAINT_DB_PATH = dbPath;
process.env.JWT_SECRET = 'public-feedback-test-secret';
process.env.PUBLIC_FEEDBACK_URL_BASE = 'http://localhost:5173/public-feedback/';
process.env.NODE_ENV = 'test';

const { default: complaintDB } = await import('../src/model/connect.js');
const { CreateUsersTable } = await import('../src/controllers/user.controller.js');
const { CreateOrganizationTable } = await import('../src/controllers/organization.controller.js');
const { CreateComplaintTable } = await import('../src/controllers/complaint.controller.js');
const {
  CreatePublicFeedbackTables,
  createCurrentFeedbackField,
  getCurrentFeedbackForm,
  getCurrentFeedbackSubmissions,
  reorderCurrentFeedbackFields,
  submitPublicFeedback
} = await import('../src/controllers/publicFeedback.controller.js');

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

const waitFor = async (predicate, timeoutMs = 5000) => {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (await predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Timed out waiting for condition');
};

const state = {
  orgAdmin: { id: 10, role: 'org_admin' },
  organizationId: 1
};

before(async () => {
  CreateUsersTable();
  CreateOrganizationTable();
  CreateComplaintTable();

  await runQuery(`
    CREATE TABLE IF NOT EXISTS public_feedback_forms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organization_id INTEGER NOT NULL,
      title TEXT,
      description TEXT,
      is_enabled INTEGER DEFAULT 1,
      allow_anonymous INTEGER DEFAULT 1,
      fields_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS public_feedback_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organization_id INTEGER NOT NULL,
      is_anonymous INTEGER DEFAULT 1,
      respondent_name TEXT,
      respondent_email TEXT,
      respondent_phone TEXT,
      overall_rating INTEGER,
      message TEXT,
      answers_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const passwordHash = await bcrypt.hash('Admin@123', 10);

  await runQuery(
    `
    INSERT INTO organization (
      organization_id, name, organization_type, email, phone, address, logo, status, join_code, public_feedback_slug, self_signup_enabled
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [1, 'Legacy Health Board', 'Government', 'legacy-org@example.com', '100000', 'Monrovia', null, 'active', 'JOIN123', 'legacy-health-board', 1]
  );

  await runQuery(
    `
    INSERT INTO users (id, organization_id, full_name, email, password, must_change_password, status, role)
    VALUES (?, ?, ?, ?, ?, 0, 'active', 'org_admin')
    `,
    [10, 1, 'Legacy Org Admin', 'legacy-admin@example.com', passwordHash]
  );

  await runQuery(
    `
    INSERT INTO public_feedback_forms (organization_id, title, description, is_enabled, allow_anonymous, fields_json)
    VALUES (?, ?, ?, 1, 1, ?)
    `,
    [
      1,
      'Legacy Service Feedback',
      'Migrated from the original public feedback form.',
      JSON.stringify([
        {
          label: 'Service Quality',
          key: 'service_quality',
          type: 'rating',
          required: true
        },
        {
          label: 'Share your experience',
          key: 'message_summary',
          type: 'long_text',
          required: true
        }
      ])
    ]
  );

  await runQuery(
    `
    INSERT INTO public_feedback_submissions (
      organization_id, is_anonymous, respondent_name, respondent_email, overall_rating, message, answers_json
    ) VALUES (?, 0, ?, ?, 4, ?, ?)
    `,
    [
      1,
      'Legacy Citizen',
      'legacy-citizen@example.com',
      'The previous form worked well.',
      JSON.stringify({
        service_quality: 4,
        message_summary: 'The previous form worked well.'
      })
    ]
  );

  CreatePublicFeedbackTables();

  await waitFor(async () => {
    const tableRow = await getQuery(
      "SELECT COUNT(*) AS count FROM sqlite_master WHERE type = 'table' AND name = 'feedback_forms'"
    );
    if (Number(tableRow?.count || 0) !== 1) return false;
    const row = await getQuery('SELECT COUNT(*) AS count FROM feedback_forms WHERE organization_id = ?', [1]);
    return Number(row?.count || 0) === 1;
  });
});

test('migrates legacy public feedback form data into the normalized tables', async () => {
  const response = await invoke(getCurrentFeedbackForm, {
    user: state.orgAdmin
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.data.title, 'Legacy Service Feedback');
  assert.equal(response.body.data.organization_slug, 'legacy-health-board');
  assert.ok(Array.isArray(response.body.data.fields));
  assert.ok(response.body.data.fields.some((field) => field.field_key === 'service_quality'));
  assert.ok(String(response.body.data.public_qr_url || '').startsWith('data:image/'));
  assert.equal(response.body.data.legacy_migration.state, 'retired');
  assert.equal(response.body.data.legacy_migration.archived_legacy_tables, true);

  const activeLegacyTable = await getQuery(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'public_feedback_forms'"
  );
  const archivedLegacyTable = await getQuery(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'legacy_public_feedback_forms_backup'"
  );
  assert.equal(activeLegacyTable, null);
  assert.equal(archivedLegacyTable?.name, 'legacy_public_feedback_forms_backup');
});

test('validates required public fields before accepting a submission', async () => {
  const response = await invoke(submitPublicFeedback, {
    params: { slug: 'legacy-health-board' },
    body: {
      is_anonymous: true,
      responses: {
        service_quality: '',
        message_summary: ''
      }
    }
  });

  assert.equal(response.status, 400);
  assert.match(response.body.message, /Failed to submit feedback/i);
});

test('supports org-admin field creation, reordering, and filtered submission pagination', async () => {
  const createFieldResponse = await invoke(createCurrentFeedbackField, {
    user: state.orgAdmin,
    body: {
      label: 'Would you recommend us?',
      field_key: 'would_recommend',
      field_type: 'yes_no',
      is_required: true,
      is_active: true
    }
  });

  assert.equal(createFieldResponse.status, 201);
  const createdField = createFieldResponse.body.data.fields.find((field) => field.field_key === 'would_recommend');
  assert.ok(createdField);

  const reorderedIds = createFieldResponse.body.data.fields
    .map((field) => field.id)
    .reverse();

  const reorderResponse = await invoke(reorderCurrentFeedbackFields, {
    user: state.orgAdmin,
    body: { field_ids: reorderedIds }
  });

  assert.equal(reorderResponse.status, 200);
  assert.deepEqual(
    reorderResponse.body.data.fields.map((field) => field.id),
    reorderedIds
  );

  const submitResponse = await invoke(submitPublicFeedback, {
    params: { slug: 'legacy-health-board' },
    body: {
      is_anonymous: false,
      responses: {
        service_quality: 5,
        message_summary: 'Quick and respectful service.',
        would_recommend: 'yes',
        respondent_name: 'New Citizen',
        respondent_email: 'new-citizen@example.com'
      }
    }
  });

  assert.equal(submitResponse.status, 201);

  const listResponse = await invoke(getCurrentFeedbackSubmissions, {
    user: state.orgAdmin,
    query: {
      page: '1',
      page_size: '1',
      anonymous: 'no'
    }
  });

  assert.equal(listResponse.status, 200);
  assert.equal(listResponse.body.data.pagination.page_size, 1);
  assert.equal(listResponse.body.data.pagination.total_items, 2);
  assert.equal(listResponse.body.data.items.length, 1);
  assert.equal(listResponse.body.data.items[0].is_anonymous, 0);
});
