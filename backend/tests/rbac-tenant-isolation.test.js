import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtempSync } from 'node:fs';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const tempDir = mkdtempSync(path.join(os.tmpdir(), 'dcms-rbac-'));
const dbPath = path.join(tempDir, 'tenant-isolation.sqlite');

process.env.COMPLAINT_DB_PATH = dbPath;
process.env.JWT_SECRET = 'tenant-test-secret';
process.env.ORG_ADMIN_DEFAULT_PASSWORD = 'Admin@123';
process.env.PASSWORD_RESET_PREVIEW = 'true';
process.env.NODE_ENV = 'test';

const { default: complaintDB } = await import('../src/model/connect.js');
const {
  assignExistingUserToOrganization,
  CreateUsersTable,
  CreateRevokedTokensTable,
  CreatePasswordResetTokensTable,
  createUser,
  getAllUsers,
  loginUser,
  requestPasswordReset,
  resetPasswordWithToken,
  updateUserRole
} = await import('../src/controllers/user.controller.js');
const {
  CreateOrganizationTable,
  createOrganization,
  deleteOrganization,
  getGlobalOrganizationStats
} = await import('../src/controllers/organization.controller.js');
const {
  assignComplaintOrganization,
  createComplaint,
  CreateComplaintTable,
  getAllComplaints,
  getComplaintById,
  getComplaintByTrackingCode,
  getUnassignedAnonymousComplaints
} = await import('../src/controllers/complaint.controller.js');
const { CreateDepartmentTable, getDepartmentById } = await import('../src/controllers/department.controller.js');
const { CreateAccessmentsTable } = await import('../src/controllers/accessment.controller.js');
const { CreateEscalationsTable, getEscalationById } = await import('../src/controllers/escalation.controller.js');
const { CreateNotificationsTable, getNotificationById } = await import('../src/controllers/notification.controller.js');
const { CreateStatusLogsTable, getStatusLogById } = await import('../src/controllers/statusLog.controller.js');
const { CreateFeedbackTable, getAllFeedback } = await import('../src/controllers/feedback.controller.js');
const { default: verifyToken } = await import('../src/middleware/verifyToken.js');

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
    if (await predicate()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Timed out waiting for condition');
};

const invoke = (handler, req) =>
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
      if (maybePromise && typeof maybePromise.catch === 'function') {
        maybePromise.catch(reject);
      }
    } catch (error) {
      reject(error);
    }
  });

const state = {
  users: {},
  organizations: {},
  complaints: {},
  department: null,
  accessment: null,
  escalation: null,
  notification: null,
  statusLog: null
};

const invokeVerifyToken = (req) =>
  new Promise((resolve) => {
    let statusCode = 200;
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(payload) {
        resolve({ status: statusCode, body: payload, nextCalled: false });
        return this;
      }
    };

    verifyToken(req, res, () => {
      resolve({ status: 200, body: null, nextCalled: true });
    });
  });

before(async () => {
  CreateUsersTable();
  CreateRevokedTokensTable();
  CreatePasswordResetTokensTable();
  CreateOrganizationTable();
  CreateComplaintTable();
  CreateDepartmentTable();
  CreateAccessmentsTable();
  CreateEscalationsTable();
  CreateNotificationsTable();
  CreateStatusLogsTable();
  CreateFeedbackTable();

  await waitFor(async () => {
    const row = await getQuery(
      "SELECT COUNT(*) AS count FROM sqlite_master WHERE type = 'table' AND name IN ('users', 'organization', 'complaint', 'department', 'accessments', 'notifications', 'status_logs', 'escalations', 'feedback')"
    );
    return Number(row?.count || 0) >= 9;
  });

  const passwordHash = await bcrypt.hash('TestPassword@123', 10);

  await runQuery(
    `
    INSERT INTO organization (organization_id, name, organization_type, email, phone, address, logo, status)
    VALUES
      (1, 'Org One', 'Government', 'org-one@example.com', '1000001', 'Monrovia', NULL, 'active'),
      (2, 'Org Two', 'Municipal', 'org-two@example.com', '1000002', 'Paynesville', NULL, 'active')
    `
  );

  await runQuery(
    `
    INSERT INTO users (id, organization_id, department_id, full_name, email, password, must_change_password, status, role)
    VALUES
      (1, NULL, NULL, 'Platform Super Admin', 'superadmin@example.com', ?, 0, 'active', 'super_admin'),
      (2, 1, NULL, 'Org One Admin', 'orgadmin1@example.com', ?, 0, 'active', 'org_admin'),
      (3, 2, NULL, 'Org Two Admin', 'orgadmin2@example.com', ?, 0, 'active', 'org_admin'),
      (4, 1, NULL, 'Org One User', 'user1@example.com', ?, 0, 'active', 'user'),
      (5, 2, NULL, 'Org Two User', 'user2@example.com', ?, 0, 'active', 'user'),
      (6, NULL, NULL, 'Public Signup User', 'signupuser@example.com', ?, 0, 'active', 'user')
    `,
    [passwordHash, passwordHash, passwordHash, passwordHash, passwordHash, passwordHash]
  );

  await runQuery(
    `
    INSERT INTO complaint (
      id, user_id, organization_id, is_anonymous, anonymous_label, title, complaint, category, priority, status, tracking_code, admin_response, reviewed_by, reviewed_at
    )
    VALUES
      (1, 4, 1, 0, NULL, 'Complaint One', 'Org one complaint body', 'Service', 'high', 'submitted', 'TRK-001-001', NULL, NULL, NULL),
      (2, 5, 2, 0, NULL, 'Complaint Two', 'Org two complaint body', 'Billing', 'medium', 'submitted', 'TRK-002-002', NULL, NULL, NULL),
      (3, NULL, NULL, 1, 'Anonymous Reporter', 'Anonymous Complaint', 'Anonymous complaint body', 'General', 'low', 'submitted', 'TRK-003-003', NULL, NULL, NULL)
    `
  );

  await runQuery(
    `
    INSERT INTO department (id, organization_id, name, description, accessment_id)
    VALUES (1, 1, 'Customer Care', 'Org one support department', NULL)
    `
  );

  await runQuery(
    `
    INSERT INTO accessments (id, complaint_id, organization_id, assessor_id, findings, recommendation, status, admin_response)
    VALUES (1, 1, 1, 2, 'Validated complaint', 'Review policy', 'in_review', NULL)
    `
  );

  await runQuery('UPDATE department SET accessment_id = 1 WHERE id = 1');

  await runQuery(
    `
    INSERT INTO escalations (id, accessment_id, organization_id, escalated_by, assigned_to, escalation_level, reason, notes, status)
    VALUES (1, 1, 1, 2, 2, 'level_1', 'Needs escalation', 'Escalated for follow-up', 'pending')
    `
  );

  await runQuery(
    `
    INSERT INTO notifications (id, organization_id, user_id, complaint_id, type, message, is_read)
    VALUES (1, 1, 4, 1, 'complaint_update', 'Complaint review started', 0)
    `
  );

  await runQuery(
    `
    INSERT INTO status_logs (id, accessment_id, organization_id, changed_by, old_status, new_status, notes)
    VALUES (1, 1, 1, 2, 'pending', 'in_review', 'Moved into active review')
    `
  );

  await runQuery(
    `
    INSERT INTO feedback (id, complaint_id, user_id, rating, comment)
    VALUES (1, 1, 4, 4, 'Helpful follow-up')
    `
  );

  state.organizations.org1 = { organization_id: 1 };
  state.organizations.org2 = { organization_id: 2 };
  state.users.superAdmin = { id: 1, role: 'super_admin', organization_id: null };
  state.users.orgAdmin1 = { id: 2, role: 'org_admin', organization_id: 1 };
  state.users.orgAdmin2 = { id: 3, role: 'org_admin', organization_id: 2 };
  state.users.user1 = { id: 4, role: 'user', organization_id: 1 };
  state.users.user2 = { id: 5, role: 'user', organization_id: 2 };
  state.users.signupUser = { id: 6, role: 'user', organization_id: null, email: 'signupuser@example.com' };
  state.complaints.org1 = { id: 1, tracking_code: 'TRK-001-001' };
  state.complaints.org2 = { id: 2, tracking_code: 'TRK-002-002' };
  state.complaints.anonymous = { id: 3, tracking_code: 'TRK-003-003' };
  state.department = { id: 1 };
  state.accessment = { id: 1 };
  state.escalation = { id: 1 };
  state.notification = { id: 1 };
  state.statusLog = { id: 1 };
});

after(async () => {
  await new Promise((resolve) => complaintDB.close(() => resolve()));
});

test('super_admin sees aggregate organization data and can manage the shared user directory only', async () => {
  const statsResponse = await invoke(getGlobalOrganizationStats, {
    user: state.users.superAdmin
  });
  assert.equal(statsResponse.status, 200);
  assert.equal(statsResponse.body.success, true);
  assert.equal(Number(statsResponse.body.data.totalOrganizations) >= 2, true);
  assert.equal(Number(statsResponse.body.data.totalComplaints) >= 3, true);

  const complaintsResponse = await invoke(getAllComplaints, {
    user: state.users.superAdmin
  });
  assert.equal(complaintsResponse.status, 403);

  const usersResponse = await invoke(getAllUsers, {
    user: state.users.superAdmin
  });
  assert.equal(usersResponse.status, 200);
  assert.equal(usersResponse.body.success, true);
  assert.equal(usersResponse.body.data.some((user) => user.email === 'superadmin@example.com'), true);
  assert.equal(usersResponse.body.data.some((user) => user.email === 'user2@example.com'), true);

  const departmentResponse = await invoke(getDepartmentById, {
    user: state.users.superAdmin,
    params: { id: String(state.department.id) }
  });
  assert.equal(departmentResponse.status, 403);

  const escalationResponse = await invoke(getEscalationById, {
    user: state.users.superAdmin,
    params: { id: String(state.escalation.id) }
  });
  assert.equal(escalationResponse.status, 403);

  const notificationResponse = await invoke(getNotificationById, {
    user: state.users.superAdmin,
    params: { id: String(state.notification.id) }
  });
  assert.equal(notificationResponse.status, 403);

  const statusLogResponse = await invoke(getStatusLogById, {
    user: state.users.superAdmin,
    params: { id: String(state.statusLog.id) }
  });
  assert.equal(statusLogResponse.status, 403);
});

test('org_admin is limited to records inside their own organization', async () => {
  const usersResponse = await invoke(getAllUsers, {
    user: state.users.orgAdmin1
  });
  assert.equal(usersResponse.status, 200);
  assert.equal(
    usersResponse.body.data.every((user) => Number(user.organization_id) === Number(state.users.orgAdmin1.organization_id)),
    true
  );
  assert.equal(usersResponse.body.data.some((user) => user.email === 'user2@example.com'), false);

  const complaintsResponse = await invoke(getAllComplaints, {
    user: state.users.orgAdmin1
  });
  assert.equal(complaintsResponse.status, 200);
  assert.equal(complaintsResponse.body.data.some((complaint) => complaint.id === state.complaints.org1.id), true);
  assert.equal(complaintsResponse.body.data.some((complaint) => complaint.id === state.complaints.org2.id), false);

  const crossComplaintResponse = await invoke(getComplaintById, {
    user: state.users.orgAdmin1,
    params: { id: String(state.complaints.org2.id) }
  });
  assert.equal(crossComplaintResponse.status, 403);

  const crossDepartmentResponse = await invoke(getDepartmentById, {
    user: state.users.orgAdmin2,
    params: { id: String(state.department.id) }
  });
  assert.equal(crossDepartmentResponse.status, 403);

  const crossEscalationResponse = await invoke(getEscalationById, {
    user: state.users.orgAdmin2,
    params: { id: String(state.escalation.id) }
  });
  assert.equal(crossEscalationResponse.status, 403);

  const crossNotificationResponse = await invoke(getNotificationById, {
    user: state.users.orgAdmin2,
    params: { id: String(state.notification.id) }
  });
  assert.equal(crossNotificationResponse.status, 403);

  const crossStatusLogResponse = await invoke(getStatusLogById, {
    user: state.users.orgAdmin2,
    params: { id: String(state.statusLog.id) }
  });
  assert.equal(crossStatusLogResponse.status, 403);

  const feedbackResponse = await invoke(getAllFeedback, {
    user: state.users.orgAdmin1
  });
  assert.equal(feedbackResponse.status, 403);

  const assignExistingUserResponse = await invoke(assignExistingUserToOrganization, {
    user: state.users.orgAdmin1,
    body: {
      email: state.users.signupUser.email
    }
  });
  assert.equal(assignExistingUserResponse.status, 200);
  assert.equal(Number(assignExistingUserResponse.body.data.organization_id), 1);

  const refreshedUsersResponse = await invoke(getAllUsers, {
    user: state.users.orgAdmin1
  });
  assert.equal(
    refreshedUsersResponse.body.data.some((user) => user.email === state.users.signupUser.email && Number(user.organization_id) === 1),
    true
  );
});

test('org_admin cannot create a user with a duplicate email', async () => {
  const response = await invoke(createUser, {
    user: state.users.orgAdmin1,
    body: {
      full_name: 'Duplicate Email User',
      email: 'user2@example.com',
      password: 'Password@123',
      status: 'active'
    }
  });

  assert.equal(response.status, 409);
  assert.equal(response.body.success, false);
  assert.equal(response.body.message, 'Email already exists');
});

test('org_admin can promote a same-organization staff member to org_admin but cannot assign super_admin', async () => {
  const promoteResponse = await invoke(updateUserRole, {
    user: state.users.orgAdmin1,
    params: { id: String(state.users.user1.id) },
    body: { role: 'org_admin' }
  });

  assert.equal(promoteResponse.status, 200);
  assert.equal(promoteResponse.body.success, true);
  assert.equal(promoteResponse.body.data.role, 'org_admin');

  const forbiddenRoleResponse = await invoke(updateUserRole, {
    user: state.users.orgAdmin1,
    params: { id: String(state.users.user1.id) },
    body: { role: 'super_admin' }
  });

  assert.equal(forbiddenRoleResponse.status, 400);
  assert.equal(forbiddenRoleResponse.body.success, false);
  assert.equal(forbiddenRoleResponse.body.message, 'role must be org_admin or user');

  const crossOrgResponse = await invoke(updateUserRole, {
    user: state.users.orgAdmin1,
    params: { id: String(state.users.user2.id) },
    body: { role: 'org_admin' }
  });

  assert.equal(crossOrgResponse.status, 403);
});

test('super_admin can create an organization admin inside a selected organization', async () => {
  const response = await invoke(createUser, {
    user: state.users.superAdmin,
    body: {
      organization_id: 2,
      full_name: 'Org Two Backup Admin',
      email: 'backupadmin@example.com',
      password: 'Password@123',
      role: 'org_admin',
      status: 'active'
    }
  });

  assert.equal(response.status, 201);
  assert.equal(response.body.success, true);
  assert.equal(Number(response.body.data.organization_id), 2);
  assert.equal(response.body.data.role, 'org_admin');
});

test('super_admin can create an organization together with its first organization admin', async () => {
  const response = await invoke(createOrganization, {
    user: state.users.superAdmin,
    body: {
      name: 'New Oversight Org',
      organization_type: 'Agency',
      email: 'newoverightorg@example.com',
      phone: '0888123456',
      address: 'Sinkor, Monrovia',
      status: 'active',
      admin_full_name: 'New Oversight Admin',
      admin_email: 'neworgadmin@example.com'
    }
  });

  assert.equal(response.status, 201);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.organization.name, 'New Oversight Org');
  assert.equal(response.body.data.organization_admin.full_name, 'New Oversight Admin');
  assert.equal(response.body.data.organization_admin.email, 'neworgadmin@example.com');

  const createdAdmin = await getQuery('SELECT * FROM users WHERE email = ?', ['neworgadmin@example.com']);
  assert.ok(createdAdmin);
  assert.equal(createdAdmin.role, 'org_admin');
  assert.equal(createdAdmin.status, 'active');
  assert.equal(Number(createdAdmin.must_change_password), 1);
});

test('organization creation rolls back if the organization admin cannot be created', async () => {
  const response = await invoke(createOrganization, {
    user: state.users.superAdmin,
    body: {
      name: 'Rolled Back Org',
      organization_type: 'Agency',
      email: 'rolledbackorg@example.com',
      address: 'Broad Street, Monrovia',
      status: 'active',
      admin_full_name: 'Duplicate Admin',
      admin_email: 'orgadmin1@example.com'
    }
  });

  assert.equal(response.status, 409);
  assert.equal(response.body.success, false);
  assert.equal(response.body.message, 'Organization admin email already exists');

  const createdOrganization = await getQuery('SELECT * FROM organization WHERE email = ?', ['rolledbackorg@example.com']);
  assert.equal(createdOrganization, null);
});

test('organization creation returns a conflict when the organization email already exists', async () => {
  const response = await invoke(createOrganization, {
    user: state.users.superAdmin,
    body: {
      name: 'Duplicate Email Org',
      organization_type: 'Agency',
      email: 'org-one@example.com',
      address: 'Broad Street, Monrovia',
      status: 'active',
      admin_full_name: 'Another Org Admin',
      admin_email: 'another-new-admin@example.com'
    }
  });

  assert.equal(response.status, 409);
  assert.equal(response.body.success, false);
  assert.equal(response.body.message, 'Organization email already exists');
});

test('user only sees their own complaints and notifications while anonymous tracking still works', async () => {
  const ownComplaintsResponse = await invoke(getAllComplaints, {
    user: state.users.user1
  });
  assert.equal(ownComplaintsResponse.status, 200);
  assert.equal(ownComplaintsResponse.body.data.length, 1);
  assert.equal(ownComplaintsResponse.body.data[0].id, state.complaints.org1.id);

  const foreignComplaintResponse = await invoke(getComplaintById, {
    user: state.users.user1,
    params: { id: String(state.complaints.org2.id) }
  });
  assert.equal(foreignComplaintResponse.status, 403);

  const ownNotificationResponse = await invoke(getNotificationById, {
    user: state.users.user1,
    params: { id: String(state.notification.id) }
  });
  assert.equal(ownNotificationResponse.status, 200);
  assert.equal(Number(ownNotificationResponse.body.data.user_id), Number(state.users.user1.id));

  const foreignNotificationResponse = await invoke(getNotificationById, {
    user: state.users.user2,
    params: { id: String(state.notification.id) }
  });
  assert.equal(foreignNotificationResponse.status, 403);

  const trackingResponse = await invoke(getComplaintByTrackingCode, {
    params: { trackingCode: state.complaints.anonymous.tracking_code }
  });
  assert.equal(trackingResponse.status, 200);
  assert.equal(trackingResponse.body.data.id, state.complaints.anonymous.id);
  assert.equal(Number(trackingResponse.body.data.is_anonymous), 1);

  const feedbackResponse = await invoke(getAllFeedback, {
    user: state.users.user1
  });
  assert.equal(feedbackResponse.status, 200);
  assert.equal(feedbackResponse.body.data.length, 1);
  assert.equal(Number(feedbackResponse.body.data[0].user_id), Number(state.users.user1.id));
});

test('anonymous complaints can be routed directly to an organization or assigned later by super admin triage', async () => {
  const directAnonymousResponse = await invoke(createComplaint, {
    body: {
      title: 'Anonymous Routed Complaint',
      complaint: 'Anonymous complaint routed directly',
      is_anonymous: true,
      anonymous_label: 'Guest Reporter',
      organization_id: 1,
      department_id: 1
    },
    user: null
  });

  assert.equal(directAnonymousResponse.status, 201);
  assert.equal(Number(directAnonymousResponse.body.data.complaint_organization_id), 1);
  assert.equal(Number(directAnonymousResponse.body.data.complaint_department_id), 1);
  assert.equal(Number(directAnonymousResponse.body.data.is_anonymous), 1);

  const invalidDepartmentResponse = await invoke(createComplaint, {
    body: {
      title: 'Anonymous Wrong Department',
      complaint: 'Anonymous complaint with invalid department routing',
      is_anonymous: true,
      anonymous_label: 'Guest Reporter',
      organization_id: 2,
      department_id: 1
    },
    user: null
  });

  assert.equal(invalidDepartmentResponse.status, 400);

  const missingOrganizationResponse = await invoke(createComplaint, {
    body: {
      title: 'Anonymous Missing Organization',
      complaint: 'Anonymous complaint without routing details',
      is_anonymous: true,
      anonymous_label: 'Guest Reporter'
    },
    user: null
  });

  assert.equal(missingOrganizationResponse.status, 400);

  const unassignedAnonymousResponse = await invoke(createComplaint, {
    body: {
      title: 'Anonymous Unassigned Complaint',
      complaint: 'Anonymous complaint pending triage',
      is_anonymous: true,
      anonymous_label: 'Guest Reporter',
      unknown_organization: true
    },
    user: null
  });

  assert.equal(unassignedAnonymousResponse.status, 201);
  assert.equal(unassignedAnonymousResponse.body.data.complaint_organization_id, null);

  const triageResponse = await invoke(getUnassignedAnonymousComplaints, {
    user: state.users.superAdmin
  });
  assert.equal(triageResponse.status, 200);
  assert.equal(
    triageResponse.body.data.some((row) => row.id === unassignedAnonymousResponse.body.data.id),
    true
  );

  const assignResponse = await invoke(assignComplaintOrganization, {
    user: state.users.superAdmin,
    params: { id: String(unassignedAnonymousResponse.body.data.id) },
    body: { organization_id: 2 }
  });
  assert.equal(assignResponse.status, 200);
  assert.equal(Number(assignResponse.body.data.complaint_organization_id), 2);

  const orgAdminComplaintList = await invoke(getAllComplaints, {
    user: state.users.orgAdmin2
  });
  assert.equal(orgAdminComplaintList.status, 200);
  assert.equal(
    orgAdminComplaintList.body.data.some((row) => row.id === unassignedAnonymousResponse.body.data.id),
    true
  );
});

test('super_admin cannot delete an organization while related records still exist', async () => {
  const response = await invoke(deleteOrganization, {
    user: state.users.superAdmin,
    params: { id: String(state.organizations.org1.organization_id) }
  });

  assert.equal(response.status, 409);
  assert.equal(response.body.success, false);
  assert.match(response.body.message, /Cannot delete organization/i);
  assert.equal(Number(response.body.error.users) >= 1, true);
  assert.equal(Number(response.body.error.complaints) >= 1, true);
});

test('password reset token flow requires valid token and allows login after reset', async () => {
  const requestResponse = await invoke(requestPasswordReset, {
    body: { email: 'user1@example.com' }
  });

  assert.equal(requestResponse.status, 200);
  const previewToken = requestResponse.body.data?.reset_token_preview;
  assert.equal(typeof previewToken, 'string');

  const newPassword = 'FreshPass@123';
  const hashedNewPassword = await bcrypt.hash(newPassword, 10);

  const resetResponse = await invoke(resetPasswordWithToken, {
    body: {
      email: 'user1@example.com',
      token: previewToken,
      new_password: hashedNewPassword
    }
  });

  assert.equal(resetResponse.status, 200);
  assert.equal(resetResponse.body.data?.user?.email, 'user1@example.com');

  const loginResponse = await invoke(loginUser, {
    body: {
      email: 'user1@example.com',
      password: newPassword
    }
  });

  assert.equal(loginResponse.status, 200);
  assert.equal(loginResponse.body.data?.user?.email, 'user1@example.com');
});

test('verifyToken rejects revoked bearer tokens', async () => {
  const revokedToken = jwt.sign(
    {
      id: state.users.user1.id,
      role: state.users.user1.role,
      organization_id: state.users.user1.organization_id,
      must_change_password: 0
    },
    process.env.JWT_SECRET
  );

  await runQuery('INSERT OR IGNORE INTO revoked_tokens (token) VALUES (?)', [revokedToken]);

  const response = await invokeVerifyToken({
    headers: {
      authorization: `Bearer ${revokedToken}`
    },
    originalUrl: '/api/organization',
    path: '/api/organization'
  });

  assert.equal(response.nextCalled, false);
  assert.equal(response.status, 401);
  assert.equal(response.body.success, false);
});
