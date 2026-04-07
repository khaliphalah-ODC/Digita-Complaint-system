export const buildComplaintPayload = ({
  form,
  sessionUser,
  hasOrganization,
  organizationSelectionRequired,
  namedComplaintNeedsLogin
}) => {
  if (namedComplaintNeedsLogin) {
    throw new Error('Sign in to submit a named complaint, or switch on anonymous mode.');
  }

  if (!form?.title?.trim() || !form?.complaint?.trim()) {
    throw new Error('Complaint title and description are required.');
  }

  if (organizationSelectionRequired) {
    throw new Error('Select the organization this complaint belongs to, or choose the triage option if you are not sure.');
  }

  return {
    title: form.title.trim(),
    complaint: form.complaint.trim(),
    category: form.category?.trim() || null,
    priority: form.priority,
    is_anonymous: Boolean(form.is_anonymous),
    anonymous_label: form.is_anonymous ? (form.anonymous_label?.trim() || 'Guest Citizen') : null,
    organization_id: hasOrganization
      ? Number(sessionUser.organization_id)
      : (form.unknown_organization ? null : Number(form.organization_id)),
    department_id: form.department_id ? Number(form.department_id) : null,
    unknown_organization: !hasOrganization && Boolean(form.unknown_organization)
  };
};
