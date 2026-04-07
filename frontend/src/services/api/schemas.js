import { z } from 'zod';

const nullableString = z.string().nullable().optional();
const nullableNumber = z.number().nullable().optional();

export const complaintSchema = z.object({
  id: z.number().optional(),
  title: z.string().default(''),
  complaint: z.string().default(''),
  category: nullableString,
  priority: z.string().default('medium'),
  status: z.string().default('submitted'),
  tracking_code: nullableString,
  created_at: nullableString,
  updated_at: nullableString,
  reviewed_at: nullableString,
  assigned_to: nullableNumber,
  assigned_name: nullableString,
  assigned_email: nullableString,
  organization_id: nullableNumber,
  organization_name: nullableString,
  department_id: nullableNumber,
  department_name: nullableString,
  user_id: nullableNumber,
  user_full_name: nullableString,
  user_email: nullableString,
  is_anonymous: z.union([z.boolean(), z.number()]).optional(),
  anonymous_label: nullableString,
  admin_response: nullableString
}).passthrough();

export const organizationSchema = z.object({
  organization_id: z.number().optional(),
  name: z.string().default('Unnamed organization'),
  organization_type: nullableString,
  email: nullableString,
  phone: nullableString,
  address: nullableString,
  logo: nullableString,
  status: z.string().default('inactive'),
  complaints_count: z.number().optional(),
  organization_admin: z.object({
    id: z.number().optional(),
    full_name: nullableString,
    email: nullableString
  }).partial().nullable().optional()
}).passthrough();

export const analyticsSeriesItemSchema = z.object({
  label: z.string(),
  value: z.number(),
  tone: nullableString
}).passthrough();

export const analyticsSchema = z.object({
  totalOrganizations: z.number().default(0),
  activeOrganizations: z.number().default(0),
  suspendedOrganizations: z.number().default(0),
  unassignedAnonymousComplaints: z.number().default(0),
  totalComplaints: z.number().default(0),
  submittedComplaints: z.number().default(0),
  inReviewComplaints: z.number().default(0),
  resolvedComplaints: z.number().default(0),
  closedComplaints: z.number().default(0),
  complaintsByOrganization: z.array(analyticsSeriesItemSchema).default([]),
  escalationStatusCounts: z.object({
    pending: z.number().default(0),
    in_progress: z.number().default(0),
    resolved: z.number().default(0),
    rejected: z.number().default(0)
  }).default({ pending: 0, in_progress: 0, resolved: 0, rejected: 0 }),
  feedbackSummary: z.object({
    total: z.number().default(0),
    average: z.number().default(0),
    byRating: z.record(z.string(), z.number()).default({})
  }).default({ total: 0, average: 0, byRating: {} }),
  complaintMonthlyTrend: z.array(analyticsSeriesItemSchema).default([]),
  assessmentMonthlyTrend: z.array(analyticsSeriesItemSchema).default([])
}).passthrough();

export const departmentSchema = z.object({
  id: z.number().optional(),
  organization_id: nullableNumber,
  name: z.string().default('Unnamed department'),
  description: nullableString,
  assessment_id: nullableNumber,
  created_at: nullableString,
  updated_at: nullableString
}).passthrough();

export const escalationSchema = z.object({
  id: z.number().optional(),
  assessment_id: nullableNumber,
  escalated_by: nullableNumber,
  assigned_to: nullableNumber,
  escalation_level: z.string().default('level_1'),
  reason: nullableString,
  notes: nullableString,
  status: z.string().default('pending'),
  resolved_at: nullableString,
  created_at: nullableString,
  updated_at: nullableString
}).passthrough();

export const statusLogSchema = z.object({
  id: z.number().optional(),
  assessment_id: nullableNumber,
  changed_by: nullableString,
  old_status: nullableString,
  new_status: nullableString,
  notes: nullableString,
  created_at: nullableString
}).passthrough();

export const notificationSchema = z.object({
  id: z.number().optional(),
  user_id: nullableNumber,
  complaint_id: nullableNumber,
  type: z.string().default('notification'),
  message: z.string().default(''),
  is_read: z.union([z.boolean(), z.number()]).optional(),
  created_at: nullableString,
  updated_at: nullableString
}).passthrough();

export const feedbackSchema = z.object({
  id: z.number().optional(),
  complaint_id: nullableNumber,
  rating: nullableNumber,
  comment: nullableString,
  created_at: nullableString,
  updated_at: nullableString
}).passthrough();

export const publicFeedbackFieldSchema = z.object({
  id: z.number().optional(),
  form_id: nullableNumber,
  key: z.string().optional(),
  field_key: z.string().optional(),
  label: z.string(),
  type: z.string().optional(),
  field_type: z.string().optional(),
  required: z.union([z.boolean(), z.number()]).optional(),
  is_required: z.union([z.boolean(), z.number()]).optional(),
  enabled: z.union([z.boolean(), z.number()]).optional(),
  is_active: z.union([z.boolean(), z.number()]).optional(),
  placeholder: nullableString,
  help_text: nullableString,
  options: z.array(z.string()).optional()
}).passthrough();

export const publicFeedbackFormSchema = z.object({
  id: z.number().optional(),
  organization_id: nullableNumber,
  organization_name: nullableString,
  organization_slug: nullableString,
  title: z.string().default('Organization Feedback'),
  description: nullableString,
  is_public: z.union([z.boolean(), z.number()]).optional(),
  is_active: z.union([z.boolean(), z.number()]).optional(),
  allow_anonymous: z.union([z.boolean(), z.number()]).optional(),
  version: z.number().optional(),
  publish_state: nullableString,
  publish_label: nullableString,
  publish_description: nullableString,
  publish_checklist: z.array(z.object({
    key: z.string(),
    label: z.string(),
    complete: z.boolean().optional()
  }).passthrough()).default([]),
  legacy_migration: z.object({
    state: nullableString,
    label: nullableString,
    description: nullableString,
    organization_had_legacy_records: z.boolean().optional(),
    active_legacy_tables: z.boolean().optional(),
    archived_legacy_tables: z.boolean().optional(),
    retained_records: z.object({
      active_forms: z.number().optional(),
      active_submissions: z.number().optional(),
      archived_forms: z.number().optional(),
      archived_submissions: z.number().optional()
    }).partial().optional()
  }).partial().nullable().optional(),
  public_url: nullableString,
  public_qr_url: nullableString,
  fields: z.array(publicFeedbackFieldSchema).default([]),
  created_at: nullableString,
  updated_at: nullableString
}).passthrough();

export const publicFeedbackSubmissionSchema = z.object({
  id: z.number().optional(),
  organization_id: nullableNumber,
  organization_name: nullableString,
  form_id: nullableNumber,
  form_title: nullableString,
  is_anonymous: z.union([z.boolean(), z.number()]).optional(),
  respondent_phone: nullableString,
  respondent_name: nullableString,
  respondent_email: nullableString,
  rating: nullableNumber,
  message_summary: nullableString,
  responses: z.record(z.string(), z.any()).optional(),
  created_at: nullableString
}).passthrough();

export const publicFeedbackSubmissionListSchema = z.object({
  items: z.array(publicFeedbackSubmissionSchema).default([]),
  pagination: z.object({
    page: z.number().default(1),
    page_size: z.number().default(10),
    total_items: z.number().default(0),
    total_pages: z.number().default(1)
  }).default({
    page: 1,
    page_size: 10,
    total_items: 0,
    total_pages: 1
  }),
  filters: z.object({
    search: nullableString,
    anonymous: nullableString,
    rating: nullableNumber
  }).default({
    search: '',
    anonymous: 'all',
    rating: 0
  })
}).passthrough();

export const publicFeedbackAnalyticsSchema = z.object({
  total_submissions: z.number().default(0),
  average_rating: z.number().default(0),
  anonymous_submissions: z.number().default(0),
  by_organization: z.array(z.object({
    organization_id: nullableNumber,
    name: z.string().default('Organization'),
    submissions_count: z.number().default(0),
    average_rating: z.number().default(0)
  }).passthrough()).default([]),
  monthly_trend: z.array(z.object({
    month_key: z.string(),
    count: z.number().default(0)
  }).passthrough()).default([])
}).passthrough();

export const organizationSettingsSchema = z.object({
  organization: z.object({
    organization_id: nullableNumber,
    name: z.string().default(''),
    organization_type: nullableString,
    email: nullableString,
    phone: nullableString,
    address: nullableString,
    logo: nullableString,
    description: nullableString,
    status: nullableString,
    self_signup_enabled: z.boolean().optional(),
    public_feedback_slug: nullableString
  }).passthrough(),
  workflow: z.object({
    anonymous_complaints_enabled: z.boolean().optional(),
    default_department_id: nullableNumber,
    auto_route_to_department: z.boolean().optional(),
    escalation_threshold_hours: z.number().default(72),
    response_sla_hours: z.number().default(48)
  }).passthrough(),
  public_feedback: z.object({
    description: nullableString,
    public_url: nullableString,
    form_title: nullableString,
    form_description: nullableString,
    form_active: z.boolean().optional(),
    form_public: z.boolean().optional()
  }).passthrough(),
  notifications: z.object({
    notify_on_new_complaints: z.boolean().optional(),
    notify_on_public_feedback: z.boolean().optional(),
    notify_on_escalations: z.boolean().optional()
  }).passthrough(),
  access_controls: z.object({
    allow_org_admin_user_management: z.boolean().optional()
  }).passthrough(),
  departments: z.array(z.object({
    id: z.number(),
    name: z.string()
  }).passthrough()).default([])
}).passthrough();

export const userSettingsSchema = z.object({
  profile: z.object({
    id: nullableNumber,
    full_name: z.string().default(''),
    email: nullableString,
    role: nullableString,
    organization_id: nullableNumber,
    phone: nullableString,
    profile_image: nullableString
  }).passthrough(),
  notifications: z.object({
    notify_email_updates: z.boolean().optional(),
    notify_status_updates: z.boolean().optional(),
    notify_public_feedback: z.boolean().optional()
  }).passthrough(),
  preferences: z.object({
    anonymity_preference: z.boolean().optional()
  }).passthrough()
}).passthrough();
