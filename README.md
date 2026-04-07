# VoiceLink

A full-stack complaint intake, tracking, and case-management platform for multi-organization environments. VoiceLink focuses on internal complaint handling and tracking with role-based workflows for users, organization admins, and super admins.

## Quick Access

- Live Demo: [voicelink-odc.netlify.app](https://voicelink-odc.netlify.app)
- Backend API: [digital-complaint-system-api-production.up.railway.app](https://digital-complaint-system-api-production.up.railway.app)

This repository contains:

- a **Vue 3 + Vite** frontend in [`frontend/`](./frontend)
- a **Node.js + Express + SQLite** backend in [`backend/`](./backend)

## Live Deployment

- Frontend demo: `https://voicelink-odc.netlify.app`
- Backend API: `https://digital-complaint-system-api-production.up.railway.app`

Subproject documentation:

- [Frontend README](./frontend/README.md)
- [Backend README](./backend/README.md)

## Overview

**VoiceLink** is built to help organizations receive complaints digitally, route them to the right team, track progress through structured workflow stages, and give complainants a more transparent experience through tracking codes, notifications, and status history.

It supports:

- internal complaint submission
- complaint tracking by tracking code
- authenticated complaint workflows
- role-based dashboards
- multi-organization data separation
- escalation and status logging
- organization-managed public feedback forms

## Problem Statement

Many complaint processes still depend on fragmented channels such as paper forms, inboxes, spreadsheets, and generic online forms. Those approaches often create operational gaps:

- complaints are hard to track after submission
- responsibility is unclear across departments
- escalation paths are inconsistent
- status history is incomplete
- users cannot easily see progress
- organizations lack tenant-safe administration
- oversight and reporting are difficult

VoiceLink addresses this by turning complaint handling into a structured digital workflow from intake to closure.

## Why This Project Matters

Complaint handling is directly tied to trust, responsiveness, and accountability. A system like VoiceLink helps institutions:

- reduce manual follow-up burden
- improve visibility for complainants
- standardize review and escalation workflows
- preserve workflow history for audits and reporting
- support multi-organization operations without mixing data

## Why VoiceLink Stands Out From Google Forms and Basic Complaint Tools

Unlike a simple form tool, VoiceLink does not stop at collecting a complaint. It supports:

- unique tracking codes
- complaint lifecycle updates
- organization and department routing
- escalation workflow
- role-based dashboards
- complaint chat/messages
- notifications
- feedback and testimonial flows
- organization-level settings and public feedback forms

A generic form captures input. VoiceLink manages the case after submission.

## Why VoiceLink Stands Out From Many Existing Complaint Systems

Many complaint platforms focus on only one side of the problem: either intake or internal administration. VoiceLink combines workflow visibility, structured case handling, and platform oversight in one codebase:

- organization-facing complaint and feedback tools
- user self-service tracking
- organization-admin workflow tools
- super-admin oversight and platform controls
- multi-tenant organization separation
- configurable public feedback and onboarding links

## Key Features

- User registration and login
- Email verification
- Password reset
- Google sign-in/sign-up support
- JWT-based authentication
- Anonymous and authenticated complaint submission
- Complaint tracking with unique tracking code
- Complaint review and lifecycle progression
- Department-linked and organization-linked workflows
- Assessment workflow
- Escalation workflow
- Notifications
- Complaint message threads
- Testimonials and user feedback
- Public feedback forms and submissions
- QR/public-link support for feedback and organization join flows
- Multi-organization support
- Role-based dashboards
- Split organization settings and user settings
- Audit and status history support

## System Roles

| Role | Responsibilities |
|---|---|
| `user` | Register, sign in, submit complaints, track own complaints, view notifications, submit feedback, submit testimonials, view organization information, and manage personal settings |
| `org_admin` | Manage complaints, users, departments, assessments, escalations, notifications, analytics, public feedback, organization settings, and organization-scoped operations for their own organization |
| `super_admin` | Manage organizations, triage complaints, review reports and audit logs, manage platform settings, and oversee platform-wide operations |

## Tech Stack

### Frontend

- Vue 3
- Vite 7
- Vue Router 4
- Pinia
- Tailwind CSS v4
- Axios
- Font Awesome
- Chart.js + `vue-chartjs`
- Swiper
- Zod
- Vitest

### Backend

- Node.js
- Express.js
- SQLite3
- `jsonwebtoken`
- `bcrypt`
- `joi`
- `nodemailer`
- `qrcode`
- Node test runner

### Deployment

- Frontend: Netlify via [`netlify.toml`](./netlify.toml)
- Backend: Render via [`render.yaml`](./render.yaml)
- Backend can also be deployed elsewhere with manual configuration

## Project Architecture

```text
Public Users / Authenticated Users / Admins
                  |
                  v
         Vue 3 Frontend (SPA)
                  |
                  v
        Express REST API Backend
                  |
                  v
   Controllers / Middleware / Services / Models
                  |
                  v
             SQLite Database
```

### High-Level Layers

- **Frontend**
  - public pages
  - auth pages
  - user workspace
  - org-admin workspace
  - super-admin workspace
- **Backend**
  - auth and token verification
  - role and tenant access control
  - complaint workflow and routing
  - public feedback and onboarding helpers
  - notification, email, and audit support
- **Database**
  - users, organizations, departments
  - complaints, assessments, escalations
  - notifications, feedback, testimonials
  - organization settings, user settings, platform settings
  - public feedback forms and submissions

## Application Flow

### Account Onboarding

The current system supports three primary account onboarding paths:

1. Direct registration
2. Organization join-code registration
3. Google sign-in / sign-up

Organization onboarding can also be delivered through a QR-backed join link built from the join-code flow.

### Complaint Flow

1. A user submits a complaint
2. The backend creates a tracking code
3. The complaint is linked to an organization and optionally a department
4. Organization admins review the complaint
5. Assessments and escalations are created where needed
6. Status changes are recorded
7. Notifications and message threads support follow-up
8. The complaint moves toward resolution and closure

### Public Feedback Flow

1. An organization admin configures a public feedback form
2. The backend exposes a public slug-based URL
3. The form can be shared directly or through QR access
4. Submissions are reviewed from the organization admin workspace

## Repository Structure

```text
.
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── model/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   ├── tests/
│   ├── package.json
│   ├── README.md
│   └── server.js
├── exports/
│   └── readmes/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── asset/
│   │   ├── components/
│   │   ├── config/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── router/
│   │   ├── services/
│   │   └── stores/
│   ├── package.json
│   ├── README.md
│   └── vite.config.js
├── scripts/
│   └── export-readmes.mjs
├── complaints.db
├── m.js
├── netlify.toml
├── package-lock.json
├── render.yaml
└── README.md
```

### Root Package Notes

- There is currently **no root `package.json`**
- The main runnable applications live in `frontend/` and `backend/`
- Root-level automation currently includes [`scripts/export-readmes.mjs`](./scripts/export-readmes.mjs)

## Repository Tracking

Team repository:

- `https://github.com/Yeato-y/Digital-Complaint-Management-System-Group1.git`

Latest shared repository update:

| Repository | Commit | Meaningful summary |
|---|---|---|
| `Yeato-y/Digital-Complaint-Management-System-Group1` | `b7ddbb2` | Merged the `develop` branch into the main shared project history, bringing team changes together into one updated codebase. |

## Frontend Summary

The frontend is a Vue single-page application with three layout layers:

- [`frontend/src/layouts/PublicLayout.vue`](./frontend/src/layouts/PublicLayout.vue)
- [`frontend/src/layouts/MainLayout.vue`](./frontend/src/layouts/MainLayout.vue)
- [`frontend/src/layouts/AdminLayout.vue`](./frontend/src/layouts/AdminLayout.vue)

### Frontend Route Areas

The router lives in [`frontend/src/router/index.js`](./frontend/src/router/index.js) and includes:

- public pages:
  - `/`
  - `/about`
  - `/features`
  - `/services`
  - `/contact`
  - `/public-feedback/:slug`
  - `/signin`
  - `/login`
  - `/signup`
  - `/verify-email`
  - `/forgot-password`
- shared authenticated pages:
  - `/submit-complaint`
  - `/track-complaint`
  - `/change-password`
- user pages:
  - `/user/dashboard`
  - `/notifications`
  - `/feedback`
  - `/testimonial`
  - `/user/settings`
  - `/organizations`
- organization admin pages:
  - `/org-admin/dashboard`
  - `/org-admin/users`
  - `/org-admin/complaints`
  - `/org-admin/complaints/:id`
  - `/org-admin/analytics`
  - `/org-admin/departments`
  - `/org-admin/assessments`
  - `/org-admin/escalations`
  - `/org-admin/notifications`
  - `/org-admin/public-feedback`
  - `/org-admin/public-feedback/submissions/:id`
  - `/org-admin/settings`
  - `/org-admin/status-logs`
  - `/org-admin/organization`
- super admin pages:
  - `/admin/dashboard`
  - `/admin/organizations`
  - `/admin/organizations/:id`
  - `/admin/triage`
  - `/admin/reports`
  - `/admin/testimonials`
  - `/admin/audit-logs`
  - `/admin/settings`

The router also contains compatibility redirects for older or alternate paths such as `/dashboard`, `/complaint`, `/complaints`, `/team-dashboard`, and several admin aliases.

### Frontend State and Shared UI

Current Pinia stores:

- [`frontend/src/stores/session.js`](./frontend/src/stores/session.js)
- [`frontend/src/stores/complaint.js`](./frontend/src/stores/complaint.js)
- [`frontend/src/stores/notifications.js`](./frontend/src/stores/notifications.js)
- [`frontend/src/stores/uiToast.js`](./frontend/src/stores/uiToast.js)

Notable shared components:

- [`frontend/src/components/SidebarNav.vue`](./frontend/src/components/SidebarNav.vue)
- [`frontend/src/components/AuthTopNav.vue`](./frontend/src/components/AuthTopNav.vue)
- [`frontend/src/components/LiveSupportModal.vue`](./frontend/src/components/LiveSupportModal.vue)
- [`frontend/src/components/GoogleAuthButton.vue`](./frontend/src/components/GoogleAuthButton.vue)
- [`frontend/src/components/AdminComplaintReviewForm.vue`](./frontend/src/components/AdminComplaintReviewForm.vue)
- [`frontend/src/components/ui/DataTable.vue`](./frontend/src/components/ui/DataTable.vue)

### Frontend Scripts

Defined in [`frontend/package.json`](./frontend/package.json):

```bash
npm run dev
npm run build
npm run preview
npm run test
npm run test:watch
```

## Backend Summary

The backend is an Express API started from [`backend/server.js`](./backend/server.js). On startup it:

- enables CORS
- parses JSON and form payloads
- mounts route modules
- initializes database tables
- seeds the super admin account

### Mounted Backend API Areas

Actual mounted base paths in `server.js`:

- `/api/email`
- `/api/users`
- `/api/assessments`
- `/api/escalations`
- `/api/status-logs`
- `/api/feedback`
- `/api/organization`
- `/api/department`
- `/api/notification`
- `/api/complaint`
- `/api/complaint-messages`
- `/api/testimonials`
- `/api/platform-settings`
- `/api/audit-logs`
- `/api/public/feedback`
- `/api/public-feedback`
- `/api/settings`

Compatibility aliases currently mounted:

- `/api/accessments`
- `/api/organizations`

Public helper endpoints currently mounted:

- `GET /api/public/organizations`
- `GET /api/public/organizations/join/:code`
- `GET /api/public/organizations/:organizationId/departments`

### Backend Structure

Key backend folders:

- [`backend/src/routes`](./backend/src/routes)
- [`backend/src/controllers`](./backend/src/controllers)
- [`backend/src/model`](./backend/src/model)
- [`backend/src/services`](./backend/src/services)
- [`backend/src/middleware`](./backend/src/middleware)
- [`backend/src/utils`](./backend/src/utils)

Current route modules include:

- `user.route.js`
- `organization.route.js`
- `department.route.js`
- `complaint.route.js`
- `complaintMessage.route.js`
- `assessment.route.js`
- `accessment.route.js`
- `escalation.route.js`
- `statusLog.route.js`
- `feedback.route.js`
- `notification.route.js`
- `testimonial.route.js`
- `platformSettings.route.js`
- `publicFeedback.route.js`
- `settings.route.js`
- `audit.route.js`
- `email.route.js`

Current model modules include:

- `user.model.js`
- `organization.model.js`
- `department.model.js`
- `complaint.model.js`
- `assessment.model.js`
- `accessment.model.js`
- `escalation.model.js`
- `statusLog.model.js`
- `feedback.model.js`
- `notification.model.js`
- `complaintMessage.model.js`
- `testimonial.model.js`
- `platformSettings.model.js`
- `settings.model.js`
- `publicFeedback.model.js`
- `audit.model.js`
- `passwordReset.model.js`

### Backend Scripts

Defined in [`backend/package.json`](./backend/package.json):

```bash
npm run dev
npm start
npm test
npm run seed:super-admin
npm run migrate:tenant
npm run smoke
npm run release:check
```

## Installation and Local Setup

### Prerequisites

- Node.js
- npm
- SMTP credentials if email features are required locally
- Google client ID if Google auth is enabled

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd Digital-Complaint-Management-System-Group1
```

### 2. Install frontend dependencies

```bash
cd frontend
npm install
cd ..
```

### 3. Install backend dependencies

```bash
cd backend
npm install
cd ..
```

## Environment Variables

The repository does not currently expose a committed root `.env.example`, so use the values below as implementation-aligned placeholders based on actual code usage.

### Frontend (`frontend/.env`)

```env
VITE_API_BASE_URL=/api
VITE_API_URL=/users
VITE_GOOGLE_CLIENT_ID=
VITE_SOCIAL_FACEBOOK_URL=https://www.facebook.com
VITE_SOCIAL_GOOGLE_URL=https://accounts.google.com
VITE_SOCIAL_X_URL=https://x.com
VITE_SOCIAL_LINKEDIN_URL=https://www.linkedin.com
VITE_SOCIAL_INSTAGRAM_URL=https://www.instagram.com
```

### Backend (`backend/.env`)

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
MAIL_PASS=<replace_with_mail_password>
MAIL_FROM="VoiceLink <no-reply@example.com>"
CONTACT_FORM_TO=support@example.com

EMAIL_VERIFICATION_URL=http://localhost:5173/verify-email
EMAIL_VERIFICATION_TTL_MS=86400000
PASSWORD_RESET_TTL_MS=900000
PASSWORD_RESET_PREVIEW=false

JOIN_CODE_URL_BASE=http://localhost:5173/signup?joinCode=
PUBLIC_FEEDBACK_URL_BASE=http://localhost:5173/public-feedback/
ORG_ADMIN_DEFAULT_PASSWORD=Admin@123

GOOGLE_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_ID=

SUPER_ADMIN_FULL_NAME=Platform Super Admin
SUPER_ADMIN_EMAIL=superadmin@example.com
SUPER_ADMIN_PASSWORD=<change_this_immediately>
SUPER_ADMIN_ORGANIZATION_ID=1

API_KEY=
```

### Environment Notes

- The backend accepts `JWT_SECRET`, `JWT_SECRET_KEY`, or `JWT_KEY` in token middleware.
- `PUBLIC_FEEDBACK_URL_BASE` and `JOIN_CODE_URL_BASE` affect generated public and QR-backed links.
- `COMPLAINT_DB_PATH` controls where SQLite data is stored.
- `API_KEY` appears in a utility middleware and may be optional depending on usage.

## Running the Project

### Start the backend

```bash
cd backend
npm run dev
```

Default local backend URL:

```text
http://localhost:5000
```

### Start the frontend

In a second terminal:

```bash
cd frontend
npm run dev
```

The frontend runs through Vite and uses its configured API integration for local development.

## API and Frontend Integration

### Frontend API Configuration

The frontend reads:

- `VITE_API_BASE_URL`
- `VITE_API_URL`

from [`frontend/src/services/api/config.js`](./frontend/src/services/api/config.js).

### Integration Areas

The frontend and backend are wired together around:

- auth and session state
- complaint submission and tracking
- organization and department selection
- notifications
- complaint messages
- feedback and testimonials
- public feedback forms
- organization settings
- user settings
- super-admin organization and reporting views

### Naming Note

The repository still contains legacy `accessment` naming in some backend files and compatibility routes alongside `assessment`. The current code intentionally supports both during ongoing standardization.

## Deployment

### Frontend Deployment

[`netlify.toml`](./netlify.toml) configures:

- base directory: `frontend`
- build command: `npm run build`
- publish directory: `dist`
- SPA redirect to `index.html`
- Node version: `22`

### Backend Deployment

[`render.yaml`](./render.yaml) configures:

- service type: `web`
- service name: `digital-complaint-system-api`
- root directory: `backend`
- build command: `npm install`
- start command: `npm start`
- auto deploy enabled

### Deployment Notes

- Netlify is already configured for the frontend.
- Render is already configured for the backend.
- If deployed elsewhere, the backend still needs the same environment variables and persistent storage planning for SQLite.

## Testing

### Frontend

Run:

```bash
cd frontend
npm run test
```

Current frontend tests in the repository include:

- `src/router/auth.spec.js`
- `src/services/api/adapters.spec.js`
- `src/services/public-feedback-builder.service.spec.js`
- `src/services/complaint-submission.service.spec.js`
- `src/stores/complaint.spec.js`
- `src/stores/session.spec.js`

### Backend

Run:

```bash
cd backend
npm test
```

Current backend tests in the repository include:

- `tests/public-feedback.test.js`
- `tests/rbac-tenant-isolation.test.js`
- `tests/settings.test.js`

### Additional Backend Checks

```bash
cd backend
npm run smoke
npm run release:check
```

## Known Issues

- The codebase still carries both `assessment` and `accessment` naming in some routes, controllers, and models.
- Some schema evolution is handled by runtime initialization logic rather than a dedicated migration framework.
- SQLite is a good fit for local development and demos, but production durability needs careful hosting setup.
- Some older compatibility redirects and route aliases remain in place while the project is being standardized.

## Future Improvements

- Fully standardize `assessment` naming across backend and frontend references
- Expand integration and end-to-end test coverage
- Improve production deployment strategy for persistent database storage
- Add richer reporting and analytics depth
- Strengthen typed contracts or schema validation between frontend and backend
- Continue consolidating compatibility routes once legacy paths are no longer needed

## Contributors / Team

This is a **group project**. Replace the placeholders below with your actual team details:

- **Member 1** — Frontend / UI
- **Member 2** — Backend / API
- **Member 3** — Database / Testing
- **Member 4** — Documentation / QA

If needed, you can also add:

- project supervisor
- institution / department
- course or capstone title

## License

This repository does not currently include a root `LICENSE` file.

Recommended next step:

- add an official `LICENSE` file if you want open-source distribution

Until then, use a project-specific statement such as:

`Copyright (c) [Year] [Team Name]. All rights reserved.`
