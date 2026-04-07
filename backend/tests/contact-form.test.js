import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtempSync } from 'node:fs';

const tempDir = mkdtempSync(path.join(os.tmpdir(), 'dcms-contact-form-'));
const dbPath = path.join(tempDir, 'contact-form.sqlite');

process.env.COMPLAINT_DB_PATH = dbPath;
process.env.JWT_SECRET = 'contact-form-test-secret';
process.env.NODE_ENV = 'test';
delete process.env.MAIL_HOST;
delete process.env.MAIL_PORT;
delete process.env.MAIL_SECURE;
delete process.env.MAIL_USER;
delete process.env.MAIL_PASS;
delete process.env.MAIL_FROM;
delete process.env.CONTACT_FORM_TO;

const { default: complaintDB } = await import('../src/model/connect.js');
const { ContactSubmissionTable } = await import('../src/model/contactSubmission.model.js');
const { default: emailRoutes } = await import('../src/routes/email.route.js');

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

const contactRouteHandlers = emailRoutes.stack
  .find((layer) => layer.route?.path === '/contact' && layer.route?.methods?.post)
  ?.route?.stack
  ?.map((layer) => layer.handle) || [];

const invokeRoute = (handlers, req = {}) =>
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

    const runHandler = (index) => {
      const handler = handlers[index];
      if (!handler) return;

      let nextCalled = false;
      const next = (error) => {
        if (error) return reject(error);
        nextCalled = true;
        return runHandler(index + 1);
      };

      try {
        const maybePromise = handler(req, res, next);
        if (maybePromise?.catch) {
          maybePromise.catch(reject);
        }
        if (maybePromise?.then) {
          maybePromise.then(() => {
            if (nextCalled) return;
          }).catch(reject);
        }
      } catch (error) {
        reject(error);
      }
    };

    runHandler(0);
  });

before(async () => {
  await runQuery(ContactSubmissionTable);

  await waitFor(async () => {
    const row = await getQuery(
      "SELECT COUNT(*) AS count FROM sqlite_master WHERE type = 'table' AND name = 'contact_submissions'"
    );
    return Number(row?.count || 0) === 1;
  });
});

after(async () => {
  await new Promise((resolve) => complaintDB.close(() => resolve()));
});

test('contact form accepts and stores submissions even when mail transport is not configured', async () => {
  const response = await invokeRoute(contactRouteHandlers, {
    body: {
      full_name: 'Test Contact User',
      email: 'contact-user@example.com',
      organization: 'VoiceLink QA',
      subject: 'Need help with contact form',
      message: 'This message should be saved even without mail transport configured.'
    }
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.delivery_status, 'saved');

  const savedSubmission = await getQuery(
    `
    SELECT full_name, email, organization, subject, delivery_status, delivery_error
    FROM contact_submissions
    WHERE id = ?
    `,
    [response.body.data.submission_id]
  );

  assert.deepEqual(savedSubmission, {
    full_name: 'Test Contact User',
    email: 'contact-user@example.com',
    organization: 'VoiceLink QA',
    subject: 'Need help with contact form',
    delivery_status: 'saved',
    delivery_error: 'Contact inbox email is not configured.'
  });
});
