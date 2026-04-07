import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

const mockListOrganizations = vi.fn();
const mockGlobalStats = vi.fn();

vi.mock('../services/api', () => ({
  API_BASE_URL: '/api',
  authApi: {},
  organizationsApi: {
    list: (...args) => mockListOrganizations(...args),
    getGlobalStats: (...args) => mockGlobalStats(...args)
  },
  request: vi.fn(),
  extractApiError: (error, fallback) => error?.message || fallback,
  transformAnalytics: (stats) => stats
}));

describe('session store dashboard loading', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    mockListOrganizations.mockReset();
    mockGlobalStats.mockReset();
  });

  it('resets dashboard stats for non-super-admin users', async () => {
    const { useSessionStore } = await import('./session.js');
    const store = useSessionStore();

    store.currentUser = { role: 'user' };
    await store.loadDashboardData();

    expect(store.dashboardStats.totalComplaints).toBe(0);
    expect(store.dashboardStats.complaintsByOrganization).toEqual([]);
  });

  it('loads dashboard stats for super admins', async () => {
    const { useSessionStore } = await import('./session.js');
    const store = useSessionStore();

    store.currentUser = { role: 'super_admin' };
    mockListOrganizations.mockResolvedValue([{ organization_id: 1, name: 'Org A' }]);
    mockGlobalStats.mockResolvedValue({
      totalOrganizations: 1,
      totalComplaints: 4,
      complaintsByOrganization: [{ organization_id: 1, label: 'Org A', value: 4 }],
      escalationStatusCounts: { pending: 1, in_progress: 0, resolved: 0, rejected: 0 },
      feedbackSummary: { total: 0, average: 0, byRating: {} },
      complaintMonthlyTrend: [],
      assessmentMonthlyTrend: []
    });

    await store.loadDashboardData();

    expect(store.dashboardStats.totalOrganizations).toBe(1);
    expect(store.dashboardStats.totalComplaints).toBe(4);
  });
});
