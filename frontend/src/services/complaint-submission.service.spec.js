import { describe, expect, it } from 'vitest';
import { buildComplaintPayload } from './complaint-submission.service.js';

describe('buildComplaintPayload', () => {
  it('builds an organization-linked complaint payload', () => {
    const payload = buildComplaintPayload({
      form: {
        title: ' Broken pipe ',
        complaint: ' Water is leaking ',
        category: 'Infrastructure',
        priority: 'urgent',
        is_anonymous: false,
        anonymous_label: '',
        organization_id: '5',
        department_id: '3',
        unknown_organization: false
      },
      sessionUser: { organization_id: 5 },
      hasOrganization: true,
      organizationSelectionRequired: false,
      namedComplaintNeedsLogin: false
    });

    expect(payload).toEqual({
      title: 'Broken pipe',
      complaint: 'Water is leaking',
      category: 'Infrastructure',
      priority: 'urgent',
      is_anonymous: false,
      anonymous_label: null,
      organization_id: 5,
      department_id: 3,
      unknown_organization: false
    });
  });

  it('builds an anonymous triage complaint payload', () => {
    const payload = buildComplaintPayload({
      form: {
        title: 'Noise issue',
        complaint: 'Loud generator all night',
        category: '',
        priority: 'medium',
        is_anonymous: true,
        anonymous_label: '',
        organization_id: '',
        department_id: '',
        unknown_organization: true
      },
      sessionUser: {},
      hasOrganization: false,
      organizationSelectionRequired: false,
      namedComplaintNeedsLogin: false
    });

    expect(payload.organization_id).toBeNull();
    expect(payload.department_id).toBeNull();
    expect(payload.anonymous_label).toBe('Guest Citizen');
    expect(payload.unknown_organization).toBe(true);
  });

  it('throws when organization selection is required', () => {
    expect(() => buildComplaintPayload({
      form: { title: 'Test', complaint: 'Body' },
      sessionUser: {},
      hasOrganization: false,
      organizationSelectionRequired: true,
      namedComplaintNeedsLogin: false
    })).toThrow(/Select the organization/i);
  });
});
