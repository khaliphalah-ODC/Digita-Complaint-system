import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

const mockCreate = vi.fn();
const mockList = vi.fn();

vi.mock('../services/api.js', () => ({
  complaintsApi: {
    create: (...args) => mockCreate(...args),
    list: (...args) => mockList(...args)
  },
  extractApiError: (error, fallback) => error?.message || fallback
}));

describe('complaint store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockCreate.mockReset();
    mockList.mockReset();
  });

  it('creates a complaint and prepends it to the store', async () => {
    const { useComplaintStore } = await import('./complaint.js');
    const store = useComplaintStore();

    mockCreate.mockResolvedValue({
      id: 1,
      title: 'Broken pipe',
      complaint: 'Water leak'
    });

    const created = await store.createComplaint({
      title: 'Broken pipe',
      complaint: 'Water leak'
    });

    expect(created.id).toBe(1);
    expect(store.complaints[0].title).toBe('Broken pipe');
  });
});
