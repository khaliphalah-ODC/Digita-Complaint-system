# VoiceLink Frontend

This is the frontend application for **VoiceLink**. It provides the public website, authentication screens, internal complaint workflows, organization admin workspace, and super admin oversight dashboards.

The app is built with **Vue 3**, **Vite**, **Pinia**, **Vue Router**, **Tailwind CSS v4**, and **Axios**, and is designed as a single-page application that talks to the VoiceLink backend REST API.

## Overview

The frontend serves four main UI contexts:

- **Public users** can browse the landing pages, read platform information, contact the team, and access onboarding through direct sign-up, join-code sign-up, Google sign-in/sign-up, and QR-assisted organization join flows.
- **Authenticated users** can submit complaints, track complaint progress, view notifications, leave feedback, submit testimonials, review organization membership, and manage personal account settings.
- **Organization admins** can manage complaints, users, departments, assessments, escalations, notifications, public feedback and QR settings, organization settings, and organization-level analytics.
- **Super admins** can manage organizations, triage unassigned complaints, review audit data, monitor platform analytics, and adjust platform settings.

## Real Stack

- **Vue 3**
- **Vite 7**
- **Vue Router 4**
- **Pinia**
- **Axios**
- **Tailwind CSS v4**
- **Font Awesome**
- **Chart.js + vue-chartjs**
- **Swiper**
- **Vite Vue DevTools**

## Scripts

Defined in [package.json](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/package.json):

```bash
npm run dev
npm run build
npm run preview
npm run test
npm run test:watch
```

## Project Structure

```text
frontend/
├── public/
├── src/
│   ├── asset/
│   ├── components/
│   ├── config/
│   ├── layouts/
│   ├── pages/
│   ├── router/
│   ├── services/
│   ├── stores/
│   ├── App.vue
│   └── main.js
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## Application Architecture

### Entry and bootstrapping

- [main.js](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/main.js) creates the Vue app, registers Pinia, Vue Router, and Font Awesome icons.
- [App.vue](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/App.vue) is minimal and renders the route tree through `RouterView`.

### Layouts

- [PublicLayout.vue](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/layouts/PublicLayout.vue)
  - wraps public pages and appends the shared footer
- [MainLayout.vue](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/layouts/MainLayout.vue)
  - shared authenticated shell
  - loads the current session
  - shows the sidebar for logged-in users
  - manages the mobile drawer
  - displays the notification bell for standard users
  - hosts the global toast component
- [AdminLayout.vue](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/layouts/AdminLayout.vue)
  - thin wrapper over `MainLayout`

### Routing and access control

Routing is defined in [router/index.js](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/router/index.js).

The router:

- uses `createWebHistory`
- reads JWT claims directly from `localStorage`
- enforces role-based route guards
- supports guest-only pages such as sign-in and sign-up
- redirects users to the correct dashboard based on role
- forces users with `must_change_password=1` to the password change page
- blocks super admin access to several organization-scoped routes

## Routes and Pages

### Public routes

- `/` -> [HomePage.vue](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/pages/HomePage.vue)
- `/about` -> [AboutView.vue](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/pages/AboutView.vue)
- `/features` -> [FeaturesView.vue](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/pages/FeaturesView.vue)
- `/services` -> [ServicesPage.vue](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/pages/ServicesPage.vue)
- `/contact` -> [ContactPage.vue](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/pages/ContactPage.vue)
- `/signin` and `/login` -> [LoginPage.vue](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/pages/LoginPage.vue)
- `/signup` -> [SignUpPage.vue](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/pages/SignUpPage.vue)
- `/verify-email` -> [VerifyEmailPage.vue](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/pages/VerifyEmailPage.vue)
- `/forgot-password` -> [ForgotPasswordPage.vue](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/pages/ForgotPasswordPage.vue)
- `/public-feedback/:slug` -> [PublicOrganizationFeedbackPage.vue](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/pages/PublicOrganizationFeedbackPage.vue)

### Standard user routes

- `/user/dashboard` -> [user/DashboardPage.vue](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/pages/user/DashboardPage.vue)
- `/submit-complaint` -> [SubmitComplaintPage.vue](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/pages/SubmitComplaintPage.vue)
- `/track-complaint` -> [TrackComplaintPage.vue](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/pages/TrackComplaintPage.vue)
- `/notifications` -> [user/NotificationPage.vue](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/pages/user/NotificationPage.vue)
- `/feedback` -> [user/FeedbackPage.vue](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/pages/user/FeedbackPage.vue)
- `/testimonial` -> [user/TestimonialPage.vue](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/pages/user/TestimonialPage.vue)
- `/organizations` -> [user/OrganizationPage.vue](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/pages/user/OrganizationPage.vue)
  - shown only when the authenticated user belongs to an organization
- `/user/settings` -> [user/SettingsPage.vue](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/pages/user/SettingsPage.vue)

### Shared authenticated route

- `/change-password` -> [ChangePasswordPage.vue](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/pages/ChangePasswordPage.vue)

### Organization admin routes

- `/org-admin/dashboard` -> [orgAdmin/DashboardPage.vue](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/pages/orgAdmin/DashboardPage.vue)
- `/org-admin/users` -> [orgAdmin/UserManagementPage.vue](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/pages/orgAdmin/UserManagementPage.vue)
- `/org-admin/complaints` -> [orgAdmin/ComplaintsPage.vue](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/pages/orgAdmin/ComplaintsPage.vue)
- `/org-admin/complaints/:id` -> [orgAdmin/ComplaintDetailPage.vue](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/pages/orgAdmin/ComplaintDetailPage.vue)
- `/org-admin/departments` -> [orgAdmin/DepartmentManagementPage.vue](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/pages/orgAdmin/DepartmentManagementPage.vue)
- `/org-admin/assessments` -> [orgAdmin/AssessmentManagementPage.vue](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/pages/orgAdmin/AssessmentManagementPage.vue)
- `/org-admin/escalations` -> [orgAdmin/EscalationManagementPage.vue](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/pages/orgAdmin/EscalationManagementPage.vue)
- `/org-admin/notifications` -> [orgAdmin/NotificationManagementPage.vue](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/pages/orgAdmin/NotificationManagementPage.vue)
- `/org-admin/analytics` -> [orgAdmin/AnalyticsPage.vue](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/pages/orgAdmin/AnalyticsPage.vue)
- `/org-admin/status-logs` -> [admin/shared/AuditLogsPage.vue](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/pages/admin/shared/AuditLogsPage.vue)
- `/org-admin/organization` -> [user/OrganizationPage.vue](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/pages/user/OrganizationPage.vue)
- `/org-admin/public-feedback` -> [orgAdmin/PublicFeedbackManagementPage.vue](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/pages/orgAdmin/PublicFeedbackManagementPage.vue)
- `/org-admin/public-feedback/submissions/:id` -> [orgAdmin/PublicFeedbackSubmissionDetailPage.vue](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/pages/orgAdmin/PublicFeedbackSubmissionDetailPage.vue)
- `/org-admin/settings` -> [orgAdmin/SettingsPage.vue](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/pages/orgAdmin/SettingsPage.vue)

### Super admin routes

- `/admin/dashboard` -> [superAdmin/DashboardPage.vue](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/pages/superAdmin/DashboardPage.vue)
- `/admin/organizations` -> [superAdmin/OrganizationManagementPage.vue](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/pages/superAdmin/OrganizationManagementPage.vue)
- `/admin/organizations/:id` -> [superAdmin/OrganizationDetailPage.vue](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/pages/superAdmin/OrganizationDetailPage.vue)
- `/admin/triage` -> [superAdmin/TriageQueuePage.vue](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/pages/superAdmin/TriageQueuePage.vue)
- `/admin/reports` -> [superAdmin/ReportsPage.vue](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/pages/superAdmin/ReportsPage.vue)
- `/admin/settings` -> [superAdmin/SettingsPage.vue](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/pages/superAdmin/SettingsPage.vue)
- `/admin/audit-logs` -> [admin/shared/AuditLogsPage.vue](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/pages/admin/shared/AuditLogsPage.vue)
- `/admin/testimonials` -> [orgAdmin/TestimonialManagementPage.vue](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/pages/orgAdmin/TestimonialManagementPage.vue)

### Redirects and compatibility routes

The router also includes compatibility redirects such as:

- `/dashboard`
- `/team-dashboard`
- `/authority-dashboard`
- `/complaints`
- `/complaint`
- `/accessments`
- `/assessments`
- several admin and organization aliases

These help normalize older or alternate paths without duplicating pages.

## UI Purpose and User Flows

### Public experience

- Landing page uses a Swiper-based hero, marketing content, and public testimonials.
- About, features, and services pages explain the platform before sign-up.
- Contact page submits a contact form to the backend email endpoint.

### Authentication flow

- Account onboarding supports three primary entry methods:
  - direct registration
  - organization join-code registration
  - Google sign-in/sign-up
- Organization onboarding also supports QR-assisted join flow by sharing the organization join code URL as a QR code.
- Login supports email/password and optional Google sign-in.
- Email verification is handled through a dedicated verification page.
- Password reset is a two-step flow: request reset code, then submit code with new password.
- If the backend marks a user with `must_change_password`, the router sends them to `/change-password`.

### Complaint submission flow

- Users can create complaints through [SubmitComplaintPage.vue](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/pages/SubmitComplaintPage.vue).
- The form supports:
  - anonymous submission
  - organization-linked complaints for organization members
  - organization selection and routing
  - a triage option when the reporter does not know the correct organization
- The page fetches organization and department options from the backend.
- After submission, the user is redirected to complaint tracking using the generated tracking code.

### Complaint tracking flow

- [TrackComplaintPage.vue](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/pages/TrackComplaintPage.vue) looks up complaints by tracking code.
- It displays workflow progress, assignment information, response details, and printable tracking receipts.
- Authenticated users can open the live support chat modal for complaint conversations.

### Standard user workspace

- Dashboard summarizes complaint counts and recent submissions.
- Notifications page reads from the notification store and marks notifications as read.
- Feedback page lets users submit, edit, and delete complaint feedback.
- Testimonial page lets users submit testimonials after their experience.
- Organization page exposes organization join-code information when the user belongs to an organization.
- User settings page separates personal profile, security, notification preferences, and personal preferences from organization-level settings.

### Organization admin workspace

- Dashboard aggregates users, complaints, departments, escalations, and status logs.
- Complaints list and complaint detail pages support operational review.
- Complaint detail includes review updates and access to live support chat.
- User management supports create, update, delete, role changes, and assigning existing users.
- Departments, assessments, escalations, and notifications are managed through dedicated CRUD pages.
- Analytics page visualizes complaint status data.
- Public feedback management handles form title/description, field design, submission review, public URL, and QR access for the current organization.
- Organization settings separate organization profile, workflow defaults, org notification toggles, team access controls, and organization logo management from personal user settings.

### Super admin workspace

- Dashboard combines organization and platform-wide complaint analytics.
- Organization management handles organization creation, editing, and deletion.
- Organization detail exposes join code and regeneration actions.
- Organization detail exposes join code, join URL, and QR delivery options for organization onboarding.
- Triage queue routes anonymous complaints that are not yet assigned to an organization.
- Reports and settings pages expose analytics, policy controls, and audit data.
- Organization detail supports join-code review, self-signup control, and organization-level admin provisioning.

## Shared Components

Key shared components include:

- [AuthTopNav.vue](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/components/AuthTopNav.vue)
  - public navigation for landing and auth screens
- [SidebarNav.vue](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/components/SidebarNav.vue)
  - role-aware sidebar navigation for super admin, org admin, and standard users
- [AppFooter.vue](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/components/AppFooter.vue)
  - footer shown under public pages
- [AppToast.vue](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/components/AppToast.vue)
  - global toast surface driven by Pinia
- [GoogleAuthButton.vue](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/components/GoogleAuthButton.vue)
  - renders Google Identity Services button when a client ID is configured
- [LiveSupportModal.vue](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/components/LiveSupportModal.vue)
  - complaint message chat UI with polling, edit, and delete support
- [TestimonialsSection.vue](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/components/TestimonialsSection.vue)
  - loads and renders public testimonials
- [MobileDataCardList.vue](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/components/MobileDataCardList.vue)
  - responsive card list helper used in admin dashboards
- [AdminComplaintReviewForm.vue](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/components/AdminComplaintReviewForm.vue)
  - complaint review UI used in admin detail flow
- [OrganizationCreateForm.vue](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/components/OrganizationCreateForm.vue)
  - reusable organization create/edit form

### Dashboard visualization components

- [AnalyticsBarChart.vue](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/components/superAdmin/AnalyticsBarChart.vue)
- [AnalyticsLineChart.vue](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/components/superAdmin/AnalyticsLineChart.vue)
- [AnalyticsDonutChart.vue](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/components/superAdmin/AnalyticsDonutChart.vue)
- [PageHeader.vue](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/components/superAdmin/PageHeader.vue)

## State Management

Pinia stores live in [src/stores](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/stores).

### `session`

[session.js](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/stores/session.js)

Handles:

- JWT persistence in `localStorage`
- current user profile
- current organization name
- login, logout, register, Google login
- email verification support state
- password change and password reset flows
- super admin dashboard aggregate loading
- route-level auth helpers such as `isLoggedIn`, `isSuperAdmin`, `isOrgAdmin`, and `mustChangePassword`

### `notifications`

[notifications.js](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/stores/notifications.js)

Handles:

- loading user notifications
- unread and read filtering
- unread counts for the bell and sidebar
- mark-as-read actions
- lightweight caching with a 30-second freshness window

### `complaint`

[complaint.js](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/stores/complaint.js)

Handles:

- complaint list state
- complaint CRUD helpers
- loading and error state for complaint operations

### `uiToast`

[uiToast.js](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/stores/uiToast.js)

Handles:

- global success and error toast notifications

## Styling and UI System

- Tailwind CSS v4 is imported through [base.css](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/asset/base.css).
- The project mixes utility classes with custom design tokens and semantic app classes such as `app-shell-panel`, `app-card`, `app-btn-primary`, and `app-badge`.
- Public marketing pages use more custom section-level styling, while authenticated areas use a shared shell visual system.
- Font Awesome provides the navigation and action icon set.

## Backend API Integration

The frontend connects to the backend through [services/api.js](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/services/api.js).

### How requests work

- Axios instance base URL:
  - `VITE_API_BASE_URL`
  - fallback: `/api`
- `Authorization: Bearer <token>` is attached automatically unless `skipAuth` is set.
- JSON request headers are applied by default.
- `extractApiError()` converts backend responses into user-friendly messages.

### Local development integration

[vite.config.js](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/vite.config.js) proxies `/api` to:

```bash
http://localhost:5000
```

This means:

- frontend can run on Vite dev server
- backend can run on port `5000`
- API calls such as `/api/users/login` work locally without changing every request URL

### Backend endpoints actively consumed by the frontend

#### Authentication and user endpoints

- `POST /api/users/login`
- `POST /api/users/google-login`
- `POST /api/users/register`
- `POST /api/users/register-with-code`
- `POST /api/users/verify-email`
- `POST /api/users/resend-verification`
- `POST /api/users/forgot-password/request`
- `POST /api/users/forgot-password`
- `POST /api/users/change-password`
- `POST /api/users/change-email`
- `POST /api/users/logout`
- `GET /api/users/me`
- `GET /api/users`
- `POST /api/users`
- `PUT /api/users/:id`
- `PATCH /api/users/:id/role`
- `DELETE /api/users/:id`
- `POST /api/users/assign-existing`

#### Complaint workflow endpoints

- `GET /api/complaint`
- `POST /api/complaint`
- `PUT /api/complaint/:id`
- `DELETE /api/complaint/:id`
- `GET /api/complaint/:id`
- `GET /api/complaint/track/:trackingCode`
- `GET /api/complaint/unassigned`
- `PATCH /api/complaint/:id/assign-organization`

#### Public routing helpers

- `GET /api/public/organizations`
- `GET /api/public/organizations/join/:code`
- `GET /api/public/organizations/:organizationId/departments`

#### Organization and admin endpoints

- `GET /api/organization`
- `POST /api/organization`
- `PUT /api/organization/:id`
- `DELETE /api/organization/:id`
- `GET /api/organization/:id`
- `GET /api/organization/:id/join-code`
- `POST /api/organization/:id/join-code/regenerate`
- `PATCH /api/organization/:id/status`
- `PATCH /api/organization/:id/self-signup`
- `POST /api/organization/:id/admin`
- `GET /api/organization/global-stats`

#### Department, assessment, escalation, status, and notification endpoints

- `GET /api/department`
- `POST /api/department`
- `PUT /api/department/:id`
- `DELETE /api/department/:id`
- `GET /api/assessments`
- `POST /api/assessments`
- `PUT /api/assessments/:id`
- `DELETE /api/assessments/:id`
- `GET /api/escalations`
- `POST /api/escalations`
- `PUT /api/escalations/:id`
- `PATCH /api/escalations/:id/status`
- `DELETE /api/escalations/:id`
- `GET /api/status-logs`
- `GET /api/audit-logs`
- `GET /api/notification`
- `POST /api/notification`
- `PATCH /api/notification/:id/read`
- `DELETE /api/notification/:id`

#### Feedback, testimonials, messaging, and contact endpoints

- `GET /api/feedback`
- `POST /api/feedback`
- `PUT /api/feedback/:id`
- `DELETE /api/feedback/:id`
- `GET /api/testimonials/public`
- `GET /api/testimonials`
- `POST /api/testimonials`
- `PATCH /api/testimonials/:id/approve`
- `PATCH /api/testimonials/:id/reject`
- `DELETE /api/testimonials/:id`
- `GET /api/complaint-messages/:complaintId`
- `POST /api/complaint-messages/:complaintId`
- `PUT /api/complaint-messages/:complaintId/:messageId`
- `DELETE /api/complaint-messages/:complaintId/:messageId`
- `POST /api/email/contact`
- `GET /api/platform-settings`
- `PUT /api/platform-settings`
- `GET /api/feedback/forms/current`
- `POST /api/feedback/forms/current`
- `PUT /api/feedback/forms/current`
- `GET /api/feedback/forms/current/qr`
- `POST /api/feedback/forms/current/fields`
- `PUT /api/feedback/forms/current/fields/reorder`
- `PUT /api/feedback/forms/current/fields/:fieldId`
- `DELETE /api/feedback/forms/current/fields/:fieldId`
- `GET /api/feedback/submissions/current`
- `GET /api/feedback/submissions/current/:id`
- `GET /api/feedback/analytics/public/system`
- `GET /api/public/feedback/:slug`
- `POST /api/public/feedback/:slug/submit`
- `GET /api/settings/organization/current`
- `PUT /api/settings/organization/current`
- `GET /api/settings/user/current`
- `PUT /api/settings/user/current`

## Environment Variables

The frontend reads these Vite environment variables directly from code:

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

### Variable usage

- `VITE_API_BASE_URL`
  - base URL for Axios requests
  - local default is `/api`
- `VITE_API_URL`
  - used by the session store as the base path for user auth routes
  - expected default is `/users`
- `VITE_GOOGLE_CLIENT_ID`
  - enables the Google sign-in button on login and sign-up pages
- `VITE_SOCIAL_*`
  - populates social links used in auth/public UI

## Setup

### Prerequisites

- Node.js `^20.19.0 || >=22.12.0`
- npm
- running VoiceLink backend API for full functionality

### Install dependencies

```bash
cd frontend
npm install
```

### Create environment file

Example:

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

## Local Development

Start the frontend:

```bash
cd frontend
npm run dev
```

By default, Vite serves the app locally and proxies `/api` calls to the backend at `http://localhost:5000`.

For full local development:

1. Start the backend in the `backend/` directory.
2. Start the frontend in the `frontend/` directory.
3. Open the Vite development URL in your browser.

## Build

Create a production build:

```bash
cd frontend
npm run build
```

Run the automated test suite:

```bash
cd frontend
npm run test
```

Preview the production build locally:

```bash
npm run preview
```

## Deployment

### Netlify

This repository already includes [netlify.toml](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/netlify.toml) configured with:

- base directory: `frontend`
- build command: `npm run build`
- publish directory: `dist`
- SPA redirect: `/* -> /index.html`

For Netlify deployment:

1. Set the project base directory to `frontend`.
2. Add the required `VITE_*` environment variables.
3. Make sure `VITE_API_BASE_URL` points to the deployed backend API if the frontend and backend are hosted separately.

### Other static hosting providers

This app can also be deployed to:

- Vercel
- Render Static Site
- GitHub Pages with SPA fallback handling

In all cases, ensure:

- the built app serves `dist/`
- client-side routing falls back to `index.html`
- the frontend knows the correct backend API base URL

## Development Notes

- The app stores the JWT in `localStorage`.
- Route authorization is partly client-enforced by decoding the token payload in the router.
- Notification refresh is store-driven and optimized to avoid constant refetches.
- Several admin pages are highly coupled to backend response shapes, especially analytics, organization stats, and complaint workflow records.

## Known Issues

These are grounded in the current codebase:

- Backend route naming is inconsistent and the frontend reflects that. Some endpoints use singular resource names such as `/complaint`, `/department`, and `/notification`.
- Legacy `accessment` naming still appears in redirects and backend-aligned workflow terminology.
- [AuthorityDashboardPage.vue](/home/khaliphalah/Desktop/Digital-Complaint-Management-System-Group1/frontend/src/pages/orgAdmin/AuthorityDashboardPage.vue) exists in the codebase, but the router currently redirects authority-style paths to the main org-admin dashboard instead of mounting this page directly.
- The session store uses `VITE_API_URL` for user route paths while the Axios client separately uses `VITE_API_BASE_URL`. If either is changed incorrectly, authentication routes can break even when the base API URL is correct.
- The frontend assumes backend availability for most authenticated screens and does not include an offline mode or mock data layer.
