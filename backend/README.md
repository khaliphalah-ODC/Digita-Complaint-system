# VoiceLink Backend

Production-ready backend service for **VoiceLink**. This API is built with **Node.js**, **Express.js**, and **SQLite**, and provides secure complaint intake, role-based access control, complaint lifecycle tracking, escalation handling, notifications, and multi-organization support.

## Live Deployment

- Public API base: `https://digital-complaint-system-api-production.up.railway.app`
- Live frontend consuming this API: `https://voicelink-odc.netlify.app`

## Backend Overview

The backend is responsible for:

- authenticating users and issuing JWTs
- enforcing role-based access for `user`, `org_admin`, and `super_admin`
- storing complaints, organizations, departments, and workflow records in SQLite
- generating complaint tracking codes for public tracking
- supporting escalation and status history workflows
- supporting organization-managed public feedback forms, public submission links, and QR access
- exposing split organization settings and user settings modules
- sending email for verification, password reset, and contact actions
- isolating organization-level data for multi-tenant administration

This service follows a REST API design and uses a controller/model structure where routes map requests to controllers, and controllers interact with SQLite through SQL query modules.

## Architecture

```text
Client / API Consumer
        |
        v
 Express Routes
        |
        v
 Controllers
        |
        v
 Models / SQL Queries
        |
        v
 SQLite Database
```

### Runtime Flow

1. `server.js` boots the application, enables CORS, parses JSON, mounts routes, initializes database tables, and seeds the super admin account.
2. Route modules define HTTP endpoints and attach middleware such as JWT verification and role checks.
3. Controllers validate input, enforce business rules, manage role access, and return standardized JSON responses.
4. Models define table creation SQL and reusable queries.
5. Services handle cross-cutting concerns such as email and notifications.

## Tech Stack

- **Node.js**
- **Express.js**
- **SQLite3**
- **JWT** for stateless authentication
- **bcrypt** for password hashing
- **Nodemailer** for outbound email
- **Joi** for request validation
- **REST API** design

## Features

- User registration and login
- Account onboarding through direct registration, organization join-code registration, and Google sign-in/sign-up
- Email verification and password reset flow
- Google login support
- JWT-based authentication
- Role-based access control (RBAC)
- Complaint submission with generated tracking code
- Anonymous and authenticated complaint intake
- Complaint lifecycle management: `submitted -> in_review -> resolved -> closed`
- Status logging for workflow history
- Escalation management for organization admins
- Internal complaint messaging
- Notifications for complaint, escalation, assignment, and chat events
- Department and organization management
- Public feedback form and submission management
- Organization-level and user-level settings management
- Organization join URL and QR-based onboarding support
- Multi-organization tenancy controls
- Audit log support

## API Documentation

### Base URL

```bash
http://localhost:5000
```

### Response Format

Most endpoints use the shared response structure below:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

Error responses follow:

```json
{
  "success": false,
  "message": "Validation failed",
  "error": "Additional error detail"
}
```

### Authorization Header

Protected endpoints require a bearer token:

```http
Authorization: Bearer <jwt_token>
```

### Role Legend

- `User`: submits, tracks, chats, gives feedback on own complaints, and manages own account settings
- `Organization Admin`: manages complaints, departments, escalations, notifications, users, public feedback, and organization settings within one organization
- `Super Admin`: manages organizations, global oversight, and platform-level operations

### Onboarding paths

The current system supports three primary account onboarding methods:

- direct registration through `POST /api/users/register`
- organization join-code registration through `POST /api/users/register-with-code`
- Google sign-in/sign-up through `POST /api/users/google-login`

Organization onboarding can also be delivered through a QR-backed join link generated from the organization's join code flow.

---

## 1. Auth & Users (`/api/users`)

> Actual mounted base path: `/api/users`

### `POST /api/users/register`

- **Description:** Register a new platform user.
- **Access:** Public
- **Request body:**

```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "password": "StrongPass123!",
  "organization_id": 1,
  "department_id": 2
}
```

- **Example response:**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": 12,
    "full_name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "organization_id": 1,
    "email_verified": 0
  }
}
```

### `POST /api/users/register-with-code`

- **Description:** Register using an organization join code.
- **Access:** Public
- **Request body:**

```json
{
  "full_name": "Mary Doe",
  "email": "mary@example.com",
  "password": "StrongPass123!",
  "join_code": "AB12CD34"
}
```

- **Example response:**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": 18,
    "email": "mary@example.com",
    "organization_id": 3,
    "role": "user",
    "status": "pending"
  }
}
```

### `POST /api/users/verify-email`

- **Description:** Verify a user's email using the verification token.
- **Access:** Public
- **Request body:**

```json
{
  "token": "verification-token",
  "email": "john@example.com"
}
```

- **Example response:**

```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "email_verified": 1
  }
}
```

### `POST /api/users/resend-verification`

- **Description:** Resend the email verification link.
- **Access:** Public
- **Request body:**

```json
{
  "email": "john@example.com"
}
```

- **Example response:**

```json
{
  "success": true,
  "message": "Verification email sent successfully",
  "data": null
}
```

### `POST /api/users/forgot-password/request`

- **Description:** Request a password reset code by email.
- **Access:** Public
- **Request body:**

```json
{
  "email": "john@example.com"
}
```

- **Example response:**

```json
{
  "success": true,
  "message": "Password reset instructions sent successfully",
  "data": {
    "expires_at": "2026-03-29T12:30:00.000Z"
  }
}
```

### `POST /api/users/forgot-password`

- **Description:** Reset password using the issued code.
- **Access:** Public
- **Request body:**

```json
{
  "email": "john@example.com",
  "code": "493182",
  "password": "NewStrongPass123!"
}
```

- **Example response:**

```json
{
  "success": true,
  "message": "Password reset successfully",
  "data": null
}
```

### `POST /api/users/login`

- **Description:** Authenticate with email and password.
- **Access:** Public
- **Request body:**

```json
{
  "email": "john@example.com",
  "password": "StrongPass123!"
}
```

- **Example response:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt-token",
    "user": {
      "id": 12,
      "full_name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "organization_id": 1
    }
  }
}
```

### `POST /api/users/google-login`

- **Description:** Authenticate using a Google credential token.
- **Access:** Public
- **Request body:**

```json
{
  "credential": "google-id-token"
}
```

- **Example response:**

```json
{
  "success": true,
  "message": "Google login successful",
  "data": {
    "token": "jwt-token",
    "user": {
      "email": "john@example.com",
      "role": "user"
    }
  }
}
```

### `GET /api/users/me`

- **Description:** Return the currently authenticated user profile.
- **Access:** Authenticated user
- **Request body:** None
- **Example response:**

```json
{
  "success": true,
  "message": "Current user retrieved successfully",
  "data": {
    "id": 12,
    "full_name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "organization_id": 1,
    "department_id": 2
  }
}
```

### `POST /api/users/logout`

- **Description:** Revoke the current token.
- **Access:** Authenticated user
- **Request body:** None
- **Example response:**

```json
{
  "success": true,
  "message": "Logout successful",
  "data": null
}
```

### `POST /api/users/change-password`

- **Description:** Change the authenticated user's password.
- **Access:** Authenticated user
- **Request body:**

```json
{
  "current_password": "StrongPass123!",
  "password": "NewStrongPass123!"
}
```

- **Example response:**

```json
{
  "success": true,
  "message": "Password changed successfully",
  "data": null
}
```

### `POST /api/users/change-email`

- **Description:** Change the authenticated user's email address.
- **Access:** Authenticated user
- **Request body:**

```json
{
  "email": "newmail@example.com"
}
```

- **Example response:**

```json
{
  "success": true,
  "message": "Email changed successfully",
  "data": {
    "email": "newmail@example.com",
    "email_verified": 0
  }
}
```

### `POST /api/users/assign-existing`

- **Description:** Assign an existing user to the authenticated organization.
- **Access:** `org_admin`
- **Request body:**

```json
{
  "email": "existing@example.com"
}
```

- **Example response:**

```json
{
  "success": true,
  "message": "User assigned to organization successfully",
  "data": {
    "email": "existing@example.com",
    "organization_id": 3
  }
}
```

### `POST /api/users`

- **Description:** Create a user from the admin panel.
- **Access:** `super_admin`, `org_admin`
- **Request body:**

```json
{
  "full_name": "Staff Member",
  "email": "staff@example.com",
  "password": "TempPass123!",
  "role": "user",
  "department_id": 2,
  "organization_id": 3
}
```

- **Example response:**

```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": 20,
    "email": "staff@example.com",
    "role": "user",
    "organization_id": 3
  }
}
```

### `GET /api/users`

- **Description:** List users visible to the authenticated admin.
- **Access:** `super_admin`, `org_admin`
- **Request body:** None
- **Example response:**

```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": [
    {
      "id": 12,
      "full_name": "John Doe",
      "role": "user",
      "organization_id": 1
    }
  ]
}
```

### `GET /api/users/id/:id`

- **Description:** Fetch a single user by numeric ID.
- **Access:** `super_admin`, `org_admin`
- **Request body:** None
- **Example response:**

```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "id": 12,
    "full_name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

### `GET /api/users/email/:email`

- **Description:** Fetch a single user by email address.
- **Access:** `super_admin`, `org_admin`
- **Request body:** None
- **Example response:**

```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "id": 12,
    "email": "john@example.com",
    "role": "user"
  }
}
```

### `PUT /api/users/:id`

- **Description:** Update a user's profile and role-related metadata.
- **Access:** `super_admin`, `org_admin`
- **Request body:**

```json
{
  "full_name": "John Updated",
  "email": "john.updated@example.com",
  "password": "UpdatedPass123!",
  "role": "user",
  "status": "active",
  "department_id": 2,
  "organization_id": 1,
  "must_change_password": 0
}
```

- **Example response:**

```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "id": 12,
    "email": "john.updated@example.com",
    "role": "user"
  }
}
```

### `PATCH /api/users/:id/role`

- **Description:** Update only the role of a user.
- **Access:** `super_admin`, `org_admin`
- **Request body:**

```json
{
  "role": "org_admin"
}
```

- **Example response:**

```json
{
  "success": true,
  "message": "User role updated successfully",
  "data": {
    "id": 12,
    "role": "org_admin"
  }
}
```

### `DELETE /api/users/:id`

- **Description:** Remove a user account.
- **Access:** `super_admin`, `org_admin`
- **Request body:** None
- **Example response:**

```json
{
  "success": true,
  "message": "User deleted successfully",
  "data": {
    "id": 12
  }
}
```

---

## 2. Complaints (`/api/complaint`)

> Requested section name uses `/api/complaints`, but the current backend mounts the resource at `/api/complaint`.

### `POST /api/complaint`

- **Description:** Create a complaint. Supports authenticated and anonymous submission.
- **Access:** Public for anonymous; authenticated for non-anonymous
- **Request body:**

```json
{
  "title": "Delay in service delivery",
  "complaint": "My request has been pending for three weeks.",
  "category": "Service",
  "priority": "high",
  "status": "submitted",
  "is_anonymous": false,
  "organization_id": 1,
  "department_id": 2
}
```

- **Example response:**

```json
{
  "success": true,
  "message": "Complaint created successfully",
  "data": {
    "id": 44,
    "tracking_code": "TRK-123-456",
    "title": "Delay in service delivery",
    "status": "submitted",
    "priority": "high"
  }
}
```

### `GET /api/complaint/track/:trackingCode`

- **Description:** Public complaint tracking lookup by tracking code.
- **Access:** Public
- **Request body:** None
- **Example response:**

```json
{
  "success": true,
  "message": "Complaint retrieved successfully",
  "data": {
    "id": 44,
    "tracking_code": "TRK-123-456",
    "status": "in_review",
    "title": "Delay in service delivery"
  }
}
```

### `GET /api/complaint/unassigned`

- **Description:** List anonymous complaints that are not yet routed to an organization.
- **Access:** Authenticated admin
- **Request body:** None
- **Example response:**

```json
{
  "success": true,
  "message": "Complaints retrieved successfully",
  "data": [
    {
      "id": 51,
      "title": "Unknown agency issue",
      "organization_id": null,
      "is_anonymous": 1
    }
  ]
}
```

### `GET /api/complaint`

- **Description:** List complaints visible to the authenticated user or admin.
- **Access:** Authenticated
- **Request body:** None
- **Example response:**

```json
{
  "success": true,
  "message": "Complaints retrieved successfully",
  "data": [
    {
      "id": 44,
      "title": "Delay in service delivery",
      "status": "submitted",
      "tracking_code": "TRK-123-456"
    }
  ]
}
```

### `PATCH /api/complaint/:id/assign-organization`

- **Description:** Assign an unassigned complaint to an organization.
- **Access:** Authenticated admin
- **Request body:**

```json
{
  "organization_id": 3
}
```

- **Example response:**

```json
{
  "success": true,
  "message": "Complaint organization assigned successfully",
  "data": {
    "id": 51,
    "organization_id": 3
  }
}
```

### `GET /api/complaint/:id`

- **Description:** Fetch a complaint by ID.
- **Access:** Authenticated
- **Request body:** None
- **Example response:**

```json
{
  "success": true,
  "message": "Complaint retrieved successfully",
  "data": {
    "id": 44,
    "title": "Delay in service delivery",
    "status": "in_review",
    "department_name": "Customer Care"
  }
}
```

### `PUT /api/complaint/:id`

- **Description:** Update complaint details, routing, admin response, and status.
- **Access:** Authenticated admin or complaint owner where permitted
- **Request body:**

```json
{
  "department_id": 2,
  "title": "Delay in service delivery",
  "complaint": "Updated description",
  "category": "Service",
  "priority": "high",
  "status": "resolved",
  "admin_response": "Issue resolved by the department."
}
```

- **Example response:**

```json
{
  "success": true,
  "message": "Complaint updated successfully",
  "data": {
    "id": 44,
    "status": "resolved",
    "admin_response": "Issue resolved by the department."
  }
}
```

### `DELETE /api/complaint/:id`

- **Description:** Delete a complaint record.
- **Access:** Authenticated admin
- **Request body:** None
- **Example response:**

```json
{
  "success": true,
  "message": "Complaint deleted successfully",
  "data": {
    "id": 44
  }
}
```

---

## 3. Organizations (`/api/organization`)

> Actual mounted base path: `/api/organization`

### `POST /api/organization`

- **Description:** Create a new organization.
- **Access:** `super_admin`
- **Request body:**

```json
{
  "name": "Ministry of Public Services",
  "organization_type": "Government",
  "email": "info@mps.gov.lr",
  "phone": "+231770000000",
  "address": "Monrovia, Liberia",
  "logo": "https://example.com/logo.png",
  "status": "active",
  "self_signup_enabled": 1
}
```

- **Example response:**

```json
{
  "success": true,
  "message": "Organization created successfully",
  "data": {
    "organization_id": 3,
    "name": "Ministry of Public Services",
    "join_code": "AB12CD34",
    "status": "active"
  }
}
```

### `GET /api/organization/global-stats`

- **Description:** Retrieve global organization-level platform statistics.
- **Access:** `super_admin`
- **Request body:** None
- **Example response:**

```json
{
  "success": true,
  "message": "Global organization stats retrieved successfully",
  "data": {
    "total_organizations": 5,
    "active_organizations": 4,
    "inactive_organizations": 1
  }
}
```

### `GET /api/organization`

- **Description:** List organizations.
- **Access:** `super_admin`, `org_admin`
- **Request body:** None
- **Example response:**

```json
{
  "success": true,
  "message": "Organizations retrieved successfully",
  "data": [
    {
      "organization_id": 3,
      "name": "Ministry of Public Services",
      "status": "active",
      "complaints_count": 12
    }
  ]
}
```

### `POST /api/organization/:id/admin`

- **Description:** Create an organization admin account for an organization.
- **Access:** `super_admin`
- **Request body:**

```json
{
  "admin_full_name": "Org Admin",
  "admin_email": "admin@mps.gov.lr"
}
```

- **Example response:**

```json
{
  "success": true,
  "message": "Organization admin created successfully",
  "data": {
    "id": 26,
    "email": "admin@mps.gov.lr",
    "role": "org_admin",
    "organization_id": 3
  }
}
```

### `GET /api/organization/:id/join-code`

- **Description:** Fetch the join code, join URL, and QR URL for an organization.
- **Access:** `super_admin`, owning `org_admin`
- **Request body:** None
- **Example response:**

```json
{
  "success": true,
  "message": "Organization join code retrieved successfully",
  "data": {
    "organization_id": 3,
    "join_code": "AB12CD34",
    "join_url": "http://localhost:5173/signup?joinCode=AB12CD34"
  }
}
```

### `POST /api/organization/:id/join-code/regenerate`

- **Description:** Regenerate an organization's join code.
- **Access:** `super_admin`, owning `org_admin`
- **Request body:** None
- **Example response:**

```json
{
  "success": true,
  "message": "Organization join code regenerated successfully",
  "data": {
    "organization_id": 3,
    "join_code": "XY98ZT77"
  }
}
```

### `PATCH /api/organization/:id/status`

- **Description:** Activate or deactivate an organization.
- **Access:** `super_admin`
- **Request body:**

```json
{
  "status": "inactive"
}
```

- **Example response:**

```json
{
  "success": true,
  "message": "Organization status updated successfully",
  "data": {
    "organization_id": 3,
    "status": "inactive"
  }
}
```

### `PATCH /api/organization/:id/self-signup`

- **Description:** Enable or disable self-signup for an organization.
- **Access:** `super_admin`, owning `org_admin`
- **Request body:**

```json
{
  "self_signup_enabled": 0
}
```

- **Example response:**

```json
{
  "success": true,
  "message": "Organization self-signup updated successfully",
  "data": {
    "organization_id": 3,
    "self_signup_enabled": 0
  }
}
```

### `GET /api/organization/:id`

- **Description:** Fetch one organization by ID.
- **Access:** `super_admin`, owning `org_admin`
- **Request body:** None
- **Example response:**

```json
{
  "success": true,
  "message": "Organization retrieved successfully",
  "data": {
    "organization_id": 3,
    "name": "Ministry of Public Services",
    "status": "active",
    "complaints_count": 12
  }
}
```

### `PUT /api/organization/:id`

- **Description:** Update organization details.
- **Access:** `super_admin`, owning `org_admin`
- **Request body:**

```json
{
  "name": "Ministry of Public Services",
  "organization_type": "Government",
  "email": "support@mps.gov.lr",
  "phone": "+231770000001",
  "address": "Monrovia, Liberia",
  "logo": "https://example.com/new-logo.png",
  "status": "active"
}
```

- **Example response:**

```json
{
  "success": true,
  "message": "Organization updated successfully",
  "data": {
    "organization_id": 3,
    "email": "support@mps.gov.lr"
  }
}
```

### `DELETE /api/organization/:id`

- **Description:** Delete an organization when no dependent records block removal.
- **Access:** `super_admin`
- **Request body:** None
- **Example response:**

```json
{
  "success": true,
  "message": "Organization deleted successfully",
  "data": {
    "organization_id": 3
  }
}
```

### Public organization discovery endpoints

These endpoints are also available for public workflow integration:

- `GET /api/public/organizations`
- `GET /api/public/organizations/join/:code`
- `GET /api/public/organizations/:organizationId/departments`

---

## 4. Escalations (`/api/escalations`)

> Actual mounted base path: `/api/escalations`

### `POST /api/escalations`

- **Description:** Create an escalation for an assessment record.
- **Access:** `org_admin`
- **Request body:**

```json
{
  "accessment_id": 9,
  "assigned_to": 15,
  "escalation_level": "level_2",
  "reason": "Complaint exceeded SLA",
  "notes": "Escalating to senior review",
  "status": "pending"
}
```

- **Example response:**

```json
{
  "success": true,
  "message": "Escalation created successfully",
  "data": {
    "id": 4,
    "accessment_id": 9,
    "escalation_level": "level_2",
    "status": "pending"
  }
}
```

### `GET /api/escalations`

- **Description:** List escalations for the authenticated organization admin.
- **Access:** `org_admin`
- **Request body:** None
- **Example response:**

```json
{
  "success": true,
  "message": "Escalations retrieved successfully",
  "data": [
    {
      "id": 4,
      "accessment_id": 9,
      "status": "pending"
    }
  ]
}
```

### `PUT /api/escalations/:id`

- **Description:** Update assignment, level, reason, notes, and status for an escalation.
- **Access:** `org_admin`
- **Request body:**

```json
{
  "assigned_to": 15,
  "escalation_level": "level_3",
  "reason": "Escalated to executive review",
  "notes": "High public impact",
  "status": "in_progress"
}
```

- **Example response:**

```json
{
  "success": true,
  "message": "Escalation updated successfully",
  "data": {
    "id": 4,
    "status": "in_progress",
    "assigned_to": 15
  }
}
```

### `PATCH /api/escalations/:id/status`

- **Description:** Update only the escalation status.
- **Access:** `org_admin`
- **Request body:**

```json
{
  "status": "resolved"
}
```

- **Example response:**

```json
{
  "success": true,
  "message": "Escalation status updated successfully",
  "data": {
    "id": 4,
    "status": "resolved"
  }
}
```

### `DELETE /api/escalations/:id`

- **Description:** Delete an escalation.
- **Access:** `org_admin`
- **Request body:** None
- **Example response:**

```json
{
  "success": true,
  "message": "Escalation deleted successfully",
  "data": {
    "id": 4
  }
}
```

---

## 5. Status Logs (`/api/status-logs`)

> Actual mounted base path: `/api/status-logs`

### `POST /api/status-logs`

- **Description:** Create a workflow status log linked to an assessment.
- **Access:** `org_admin`
- **Request body:**

```json
{
  "accessment_id": 9,
  "old_status": "submitted",
  "new_status": "in_review",
  "notes": "Assigned for departmental review"
}
```

- **Example response:**

```json
{
  "success": true,
  "message": "Status log created successfully",
  "data": {
    "id": 11,
    "accessment_id": 9,
    "new_status": "in_review"
  }
}
```

### `GET /api/status-logs`

- **Description:** List all status logs for the authenticated organization.
- **Access:** `org_admin`
- **Request body:** None
- **Example response:**

```json
{
  "success": true,
  "message": "Status logs retrieved successfully",
  "data": [
    {
      "id": 11,
      "accessment_id": 9,
      "new_status": "in_review"
    }
  ]
}
```

### `GET /api/status-logs/accessment/:accessmentId`

- **Description:** Retrieve status logs for a specific assessment.
- **Access:** `org_admin`
- **Request body:** None
- **Example response:**

```json
{
  "success": true,
  "message": "Status logs retrieved successfully",
  "data": [
    {
      "id": 11,
      "old_status": "submitted",
      "new_status": "in_review"
    }
  ]
}
```

### `GET /api/status-logs/:id`

- **Description:** Get a single status log by ID.
- **Access:** `org_admin`
- **Request body:** None
- **Example response:**

```json
{
  "success": true,
  "message": "Status log retrieved successfully",
  "data": {
    "id": 11,
    "notes": "Assigned for departmental review"
  }
}
```

### `PUT /api/status-logs/:id`

- **Description:** Update a status log entry.
- **Access:** `org_admin`
- **Request body:**

```json
{
  "old_status": "submitted",
  "new_status": "resolved",
  "notes": "Resolved after internal review"
}
```

- **Example response:**

```json
{
  "success": true,
  "message": "Status log updated successfully",
  "data": {
    "id": 11,
    "new_status": "resolved"
  }
}
```

### `DELETE /api/status-logs/accessment/:accessmentId`

- **Description:** Delete all status logs for an assessment.
- **Access:** `org_admin`
- **Request body:** None
- **Example response:**

```json
{
  "success": true,
  "message": "Status logs deleted successfully",
  "data": {
    "accessment_id": 9
  }
}
```

### `DELETE /api/status-logs/:id`

- **Description:** Delete one status log.
- **Access:** `org_admin`
- **Request body:** None
- **Example response:**

```json
{
  "success": true,
  "message": "Status log deleted successfully",
  "data": {
    "id": 11
  }
}
```

---

## 6. Notifications (`/api/notification`)

> Actual mounted base path: `/api/notification`

### `POST /api/notification`

- **Description:** Create a notification for a user, complaint, or organization.
- **Access:** `org_admin`
- **Request body:**

```json
{
  "user_id": 12,
  "complaint_id": 44,
  "type": "complaint_updated",
  "message": "Your complaint has moved to in_review."
}
```

- **Example response:**

```json
{
  "success": true,
  "message": "Notification created successfully",
  "data": {
    "id": 32,
    "user_id": 12,
    "is_read": 0
  }
}
```

### `GET /api/notification`

- **Description:** Retrieve notifications for the current user or current organization admin.
- **Access:** Authenticated
- **Request body:** None
- **Example response:**

```json
{
  "success": true,
  "message": "Notifications retrieved successfully",
  "data": [
    {
      "id": 32,
      "message": "Your complaint has moved to in_review.",
      "is_read": 0
    }
  ]
}
```

### `PATCH /api/notification/:id/read`

- **Description:** Mark a notification as read.
- **Access:** Notification owner or organization admin
- **Request body:** None
- **Example response:**

```json
{
  "success": true,
  "message": "Notification marked as read",
  "data": {
    "id": 32,
    "is_read": 1
  }
}
```

### `DELETE /api/notification/:id`

- **Description:** Delete a notification.
- **Access:** `org_admin`
- **Request body:** None
- **Example response:**

```json
{
  "success": true,
  "message": "Notification deleted successfully",
  "data": {
    "id": 32
  }
}
```

---

## 7. Feedback (`/api/feedback`)

> Actual mounted base path: `/api/feedback`

### `POST /api/feedback`

- **Description:** Submit feedback for a complaint owned by the authenticated user.
- **Access:** `user`
- **Request body:**

```json
{
  "complaint_id": 44,
  "rating": 5,
  "comment": "The resolution process was effective."
}
```

- **Example response:**

```json
{
  "success": true,
  "message": "Feedback created successfully",
  "data": {
    "id": 7,
    "complaint_id": 44,
    "rating": 5
  }
}
```

### `GET /api/feedback`

- **Description:** List feedback submitted by the authenticated user.
- **Access:** `user`
- **Request body:** None
- **Example response:**

```json
{
  "success": true,
  "message": "Feedback retrieved successfully",
  "data": [
    {
      "id": 7,
      "complaint_id": 44,
      "rating": 5
    }
  ]
}
```

### `GET /api/feedback/:id`

- **Description:** Fetch one feedback record owned by the authenticated user.
- **Access:** `user`
- **Request body:** None
- **Example response:**

```json
{
  "success": true,
  "message": "Feedback retrieved successfully",
  "data": {
    "id": 7,
    "comment": "The resolution process was effective."
  }
}
```

### `PUT /api/feedback/:id`

- **Description:** Update feedback rating and comment.
- **Access:** `user`
- **Request body:**

```json
{
  "rating": 4,
  "comment": "Issue was resolved, but response time can improve."
}
```

- **Example response:**

```json
{
  "success": true,
  "message": "Feedback updated successfully",
  "data": {
    "id": 7,
    "rating": 4
  }
}
```

### `DELETE /api/feedback/:id`

- **Description:** Delete a feedback record.
- **Access:** `user`
- **Request body:** None
- **Example response:**

```json
{
  "success": true,
  "message": "Feedback deleted successfully",
  "data": {
    "id": 7
  }
}
```

---

## 8. Departments (`/api/department`)

> Requested section name uses `/api/departments`, but the current backend mounts the resource at `/api/department`.

### `POST /api/department`

- **Description:** Create a department for the authenticated organization.
- **Access:** `org_admin`
- **Request body:**

```json
{
  "name": "Customer Care",
    "description": "Handles organization complaints",
  "assessment_id": 9
}
```

- **Example response:**

```json
{
  "success": true,
  "message": "Department created successfully",
  "data": {
    "id": 2,
    "organization_id": 3,
    "name": "Customer Care"
  }
}
```

### `GET /api/department`

- **Description:** List departments for the authenticated organization.
- **Access:** `org_admin`
- **Request body:** None
- **Example response:**

```json
{
  "success": true,
  "message": "Departments retrieved successfully",
  "data": [
    {
      "id": 2,
      "name": "Customer Care"
    }
  ]
}
```

### `GET /api/department/:id`

- **Description:** Fetch one department by ID.
- **Access:** `org_admin`
- **Request body:** None
- **Example response:**

```json
{
  "success": true,
  "message": "Department retrieved successfully",
  "data": {
    "id": 2,
    "name": "Customer Care",
    "description": "Handles organization complaints"
  }
}
```

### `PUT /api/department/:id`

- **Description:** Update department details.
- **Access:** `org_admin`
- **Request body:**

```json
{
  "name": "Customer Support",
  "description": "Updated department description",
  "assessment_id": 9
}
```

- **Example response:**

```json
{
  "success": true,
  "message": "Department updated successfully",
  "data": {
    "id": 2,
    "name": "Customer Support"
  }
}
```

### `DELETE /api/department/:id`

- **Description:** Delete a department.
- **Access:** `org_admin`
- **Request body:** None
- **Example response:**

```json
{
  "success": true,
  "message": "Department deleted successfully",
  "data": {
    "id": 2
  }
}
```

### Public department lookup

- **Endpoint:** `GET /api/public/organizations/:organizationId/departments`
- **Description:** Retrieve public departments for a selected active organization during complaint submission.

---

## 9. Complaint Messages (`/api/complaint-messages`)

> Actual mounted base path: `/api/complaint-messages`

### `GET /api/complaint-messages/:complaintId`

- **Description:** Retrieve all chat messages for a complaint.
- **Access:** Complaint owner or organization admin in the same organization
- **Request body:** None
- **Example response:**

```json
{
  "success": true,
  "message": "Complaint messages retrieved successfully",
  "data": [
    {
      "id": 6,
      "complaint_id": 44,
      "sender_role": "admin",
      "message": "We are reviewing your complaint."
    }
  ]
}
```

### `POST /api/complaint-messages/:complaintId`

- **Description:** Send a new complaint chat message.
- **Access:** Complaint owner or organization admin in the same organization
- **Request body:**

```json
{
  "message": "Thank you for the update."
}
```

- **Example response:**

```json
{
  "success": true,
  "message": "Complaint message sent successfully",
  "data": {
    "id": 7,
    "complaint_id": 44,
    "sender_role": "user",
    "message": "Thank you for the update."
  }
}
```

### `PUT /api/complaint-messages/:complaintId/:messageId`

- **Description:** Edit a previously sent message owned by the authenticated sender.
- **Access:** Message owner
- **Request body:**

```json
{
  "message": "Thank you for the update. Please share the next step."
}
```

- **Example response:**

```json
{
  "success": true,
  "message": "Complaint message updated successfully",
  "data": {
    "id": 7,
    "message": "Thank you for the update. Please share the next step."
  }
}
```

### `DELETE /api/complaint-messages/:complaintId/:messageId`

- **Description:** Delete a message owned by the authenticated sender.
- **Access:** Message owner
- **Request body:** None
- **Example response:**

```json
{
  "success": true,
  "message": "Complaint message deleted successfully",
  "data": {
    "id": 7,
    "complaint_id": 44
  }
}
```

---

## 10. Public Feedback (`/api/feedback`, `/api/public/feedback`, `/api/public-feedback`)

### Organization-managed feedback form endpoints

These endpoints are mounted under the authenticated feedback router and are used by organization admins to manage the current organization's public feedback experience.

### `GET /api/feedback/forms/current`

- **Description:** Retrieve the authenticated org admin's current public feedback form, QR payload, and field definition set.
- **Access:** `org_admin`

### `POST /api/feedback/forms/current`

- **Description:** Create the current organization's public feedback form if one does not yet exist.
- **Access:** `org_admin`

### `PUT /api/feedback/forms/current`

- **Description:** Update the current organization's public feedback title, description, publish state, anonymous policy, and slug-backed form metadata.
- **Access:** `org_admin`

### `GET /api/feedback/forms/current/qr`

- **Description:** Return the current organization's public feedback URL and QR code payload.
- **Access:** `org_admin`

### `POST /api/feedback/forms/current/fields`

- **Description:** Add a new custom field to the current organization's public feedback form.
- **Access:** `org_admin`

### `PUT /api/feedback/forms/current/fields/reorder`

- **Description:** Reorder the current organization's public feedback form fields.
- **Access:** `org_admin`

### `PUT /api/feedback/forms/current/fields/:fieldId`

- **Description:** Update one feedback form field owned by the authenticated organization.
- **Access:** `org_admin`

### `DELETE /api/feedback/forms/current/fields/:fieldId`

- **Description:** Delete one feedback form field owned by the authenticated organization.
- **Access:** `org_admin`

### `GET /api/feedback/submissions/current`

- **Description:** List public feedback submissions for the authenticated organization with pagination and filtering support.
- **Access:** `org_admin`

### `GET /api/feedback/submissions/current/:id`

- **Description:** Retrieve one public feedback submission belonging to the authenticated organization.
- **Access:** `org_admin`

### `GET /api/feedback/analytics/public/system`

- **Description:** Return public-feedback analytics aggregated across organizations for authorized admin reporting flows.
- **Access:** Authenticated admin

### Public feedback form access endpoints

These endpoints are mounted under both `/api/public/feedback` and `/api/public-feedback` for compatibility.

### `GET /api/public/feedback/:slug`

- **Description:** Load the public feedback form for an active organization by slug.
- **Access:** Public

### `POST /api/public/feedback/:slug/submit`

- **Description:** Submit a public feedback response for an active organization form.
- **Access:** Public

### `POST /api/public-feedback/:slug/submissions`

- **Description:** Compatibility alias for public feedback submission.
- **Access:** Public

---

## 11. Settings (`/api/settings`)

### `GET /api/settings/organization/current`

- **Description:** Return organization-level settings for the authenticated org admin's own organization only.
- **Access:** `org_admin`

### `PUT /api/settings/organization/current`

- **Description:** Update organization profile, workflow defaults, org notification preferences, and org access controls for the authenticated org admin's own organization only.
- **Access:** `org_admin`

### `GET /api/settings/user/current`

- **Description:** Return personal account settings for the authenticated user only.
- **Access:** Authenticated user

### `PUT /api/settings/user/current`

- **Description:** Update personal profile, notification preferences, anonymity preference, phone, and profile image for the authenticated user only.
- **Access:** Authenticated user

### Settings boundaries

- Organization settings are separated from personal user settings.
- Org admins can only manage settings for their own `organization_id`.
- User settings are always loaded and updated against the authenticated `req.user.id`.
- Super admin access is intentionally not granted to the org-admin-only organization settings endpoints.

## Authentication & Authorization

### JWT Authentication

- JWTs are issued after successful login.
- Protected routes are enforced through `verifyToken` middleware.
- Revoked tokens are stored in the `revoked_tokens` table and checked during logout flows.

### RBAC Rules

- `user`
  - register, login, submit complaints, track own complaints, receive notifications, chat on own complaints, submit feedback
- `org_admin`
  - manage organization-scoped complaints, departments, status logs, escalations, notifications, and users
- `super_admin`
  - manage organizations, global reporting, and platform oversight

### Multi-Tenant Scope

- Organization admins are restricted to data within their own `organization_id`.
- Super admin access is intentionally limited for some internal organization-scoped modules.
- Complaint, escalation, notification, and user queries enforce organization ownership checks.

## Database Structure

The backend initializes its SQLite schema automatically at startup.

### Core Tables

- `users`
  - stores authentication, role, status, and organization membership
- `organization`
  - stores organization profile, status, join code, and self-signup settings
- `department`
  - stores organization departments
- `complaint`
  - stores complaint details, lifecycle state, tracking code, routing, and admin response
- `accessments`
  - stores complaint assessment records used by escalation and status logs
- `status_logs`
  - stores assessment status history
- `escalations`
  - stores escalation requests and resolution state
- `notifications`
  - stores system notifications for users and organizations
- `complaint_messages`
  - stores complaint chat messages between users and organization admins
- `feedback`
  - stores user feedback and ratings for complaints
- `organization_settings`
  - stores org-admin-managed organization profile extensions, workflow defaults, notification toggles, and access controls
- `user_settings`
  - stores per-user phone, profile image, personal notification preferences, and anonymity preference
- `feedback_forms`
  - stores one public feedback form configuration per organization
- `feedback_form_fields`
  - stores configurable public feedback form fields and sort order
- `feedback_submissions`
  - stores public feedback responses tied to organizations and forms

### Supporting Tables

- `audit_logs`
  - stores audit trail entries for platform actions
- `platform_settings`
  - stores runtime platform and policy settings
- `password_reset_tokens`
  - stores password reset codes and expiry timestamps
- `email_verification_tokens`
  - stores email verification tokens
- `revoked_tokens`
  - stores logged-out JWTs
- `testimonials`
  - stores user testimonials used elsewhere in the project

### Schema notes

- The backend auto-creates and migrates tables at startup through `server.js`.
- Some live columns are introduced through controller migration helpers, not only the base model SQL. A key example is extra complaint workflow columns such as `admin_response`, `reviewed_by`, and `reviewed_at`.
- Legacy `accessment` naming is preserved in table names and routes for compatibility with the current codebase.

## Installation & Setup

### Prerequisites

- Node.js 18+
- npm

### Steps

```bash
cd backend
npm install
```

Run the backend test suite:

```bash
npm test
```

Create your environment file:

```bash
cp .env.example .env
```

If you do not want to create `.env.example`, use the template in the next section directly.

## Environment Variables

Example `.env`:

```env
PORT=5000
CORS_ORIGIN=http://localhost:5173

COMPLAINT_DB_PATH=./complaints.db

JWT_SECRET=26006caf6eed88975e87b26c10d303b1ada5cd11a761b243c463fb3ceae280279bb38805f9b02d5b77d7155c8ff742fa0e0b41a10e88b030869c16aa53c3fddf

JWT_EXPIRES_IN=1d

MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=no-reply@example.com
MAIL_PASS=replace_with_mail_password
MAIL_FROM="VoiceLink <no-reply@example.com>"
CONTACT_FORM_TO=support@example.com

EMAIL_VERIFICATION_URL=http://localhost:5173/verify-email
EMAIL_VERIFICATION_TTL_MS=86400000

PASSWORD_RESET_TTL_MS=900000
PASSWORD_RESET_PREVIEW=false

JOIN_CODE_URL_BASE=http://localhost:5173/signup?joinCode=
ORG_ADMIN_DEFAULT_PASSWORD=Admin@123

GOOGLE_CLIENT_ID=your_google_client_id

SUPER_ADMIN_FULL_NAME=Platform Super Admin
SUPER_ADMIN_EMAIL=superadmin@example.com
SUPER_ADMIN_PASSWORD=ChangeThisImmediately
SUPER_ADMIN_ORGANIZATION_ID=1
```

### Environment Notes

- `COMPLAINT_DB_PATH` controls where the SQLite database file is stored.
- `JWT_SECRET` secures token signing. Use a strong random secret in production.
- `MAIL_*` values are required for verification, password reset, and contact email flows.
- `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD` are needed for seeding the initial platform super admin.
- `GOOGLE_CLIENT_ID` is only required if Google login is enabled.

## Running the Server

### Development

```bash
cd backend
npm run dev
```

### Production

```bash
cd backend
npm start
```

The API will start on:

```bash
http://localhost:5000
```

## Deployment

### Render

This repository already includes a `render.yaml` with:

- `rootDir: backend`
- `buildCommand: npm install`
- `startCommand: npm start`

Recommended production setup on Render:

1. Create a Web Service from the repository.
2. Confirm the root directory is `backend`.
3. Set all required environment variables.
4. Attach a persistent disk if you plan to keep SQLite in production.
5. Deploy and verify the health response at `/`.

### Railway

For Railway:

1. Create a new project from the repository.
2. Set the service root to `backend`.
3. Add all environment variables from the `.env` template.
4. Ensure SQLite file persistence is handled correctly, or migrate to PostgreSQL/MySQL for long-term production use.

### Important SQLite Hosting Note

SQLite is suitable for local development, demos, and small deployments. For cloud production:

- use persistent storage if the platform supports it
- avoid ephemeral file systems for database persistence
- consider migrating to a server-based database if traffic or concurrency grows

## Testing

### Automated tests

Run the current test suite:

```bash
cd backend
npm test
```

Current repository coverage includes Node test runner support and RBAC / tenant isolation testing.

### API testing tools

Recommended tools:

- Postman
- Thunder Client
- Insomnia

Suggested collection groups:

- Auth
- Complaints
- Organization Admin
- Super Admin
- Notifications
- Feedback

When testing protected routes, first authenticate and reuse the JWT in the `Authorization` header.

## Security Practices

- Passwords are hashed with `bcrypt`.
- JWT-protected routes require a valid bearer token.
- Email verification is supported before full account trust.
- Password reset uses expiring reset codes.
- Role-based access control is enforced per route.
- Organization-level checks reduce tenant data leakage.
- Error responses normalize sensitive SQLite/internal error details.
- CORS is configurable using `CORS_ORIGIN`.

## Known Issues

- Route naming is not fully uniform across modules. Some resources use singular paths such as `/api/complaint`, `/api/department`, and `/api/notification`.
- The codebase uses the legacy spelling `accessment` in several routes, tables, and parameters even though the intended concept is `assessment`.
- SQLite is file-based and may not scale well under high concurrency or stateless cloud environments without persistent storage.
- Automated coverage exists, but broader endpoint-level integration coverage can still be expanded.

## Future Improvements

- standardize route naming and resource pluralization
- rename `accessment` references to `assessment` consistently across code, tables, and APIs
- add OpenAPI / Swagger documentation
- expand automated integration and end-to-end tests
- add request rate limiting and account lockout protections
- add structured logging and monitoring
- add database migrations for schema versioning
- support a production-grade relational database such as PostgreSQL
- implement refresh tokens and token rotation
- add file attachment support for complaints
