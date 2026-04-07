import { describe, expect, it } from 'vitest';
import { transformAnalytics, transformComplaint, transformOrganization } from './adapters.js';

describe('api adapters', () => {
  it('normalizes complaint records', () => {
    const complaint = transformComplaint({
      id: '7',
      title: 'Street light out',
      complaint: 'Main road is dark',
      priority: 'URGENT',
      status: 'IN_REVIEW',
      is_anonymous: 1
    });

    expect(complaint.id).toBe(7);
    expect(complaint.priority).toBe('urgent');
    expect(complaint.status).toBe('in_review');
    expect(complaint.is_anonymous).toBe(true);
  });

  it('normalizes organizations and admin info', () => {
    const organization = transformOrganization({
      organization_id: '2',
      name: 'Water Corp',
      status: 'ACTIVE',
      organization_admin: {
        id: '4',
        full_name: 'Admin User',
        email: 'admin@example.com'
      }
    });

    expect(organization.organization_id).toBe(2);
    expect(organization.status).toBe('active');
    expect(organization.organization_admin.id).toBe(4);
  });

  it('normalizes analytics stats', () => {
    const stats = transformAnalytics({
      totalOrganizations: '3',
      totalComplaints: '12',
      complaintsByOrganization: [{ organization_id: 1, name: 'Org A', complaints: '4' }]
    });

    expect(stats.totalOrganizations).toBe(3);
    expect(stats.totalComplaints).toBe(12);
    expect(stats.complaintsByOrganization[0]).toMatchObject({ label: 'Org A', value: 4 });
  });
});
