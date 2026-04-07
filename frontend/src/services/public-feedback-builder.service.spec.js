import { describe, expect, it } from 'vitest';
import {
  attachFieldDrafts,
  buildPublishWorkflow,
  parseFieldOptions,
  reorderItemsByDrag
} from './public-feedback-builder.service.js';

describe('public-feedback-builder.service', () => {
  it('parses comma-separated field options cleanly', () => {
    expect(parseFieldOptions(' Yes, No , Maybe ,, ')).toEqual(['Yes', 'No', 'Maybe']);
  });

  it('attaches editable drafts to form fields', () => {
    const fields = attachFieldDrafts([
      {
        id: 1,
        label: 'Department',
        field_key: 'department',
        field_type: 'select',
        options: ['Billing', 'Support']
      }
    ]);

    expect(fields[0]._draft).toEqual(expect.objectContaining({
      label: 'Department',
      field_key: 'department',
      field_type: 'select',
      optionsText: 'Billing, Support'
    }));
  });

  it('reorders fields from drag-and-drop ids', () => {
    const rows = [
      { id: 1, label: 'A' },
      { id: 2, label: 'B' },
      { id: 3, label: 'C' }
    ];

    expect(reorderItemsByDrag(rows, 1, 3).map((item) => item.id)).toEqual([2, 3, 1]);
  });

  it('builds a publish workflow summary from backend metadata', () => {
    const workflow = buildPublishWorkflow({
      publish_state: 'published',
      publish_label: 'Published',
      publish_description: 'The form is live.',
      publish_checklist: [
        { key: 'public', label: 'Public link enabled', complete: true },
        { key: 'active', label: 'Accepting submissions', complete: true },
        { key: 'prompt', label: 'Includes a rating or feedback prompt', complete: false }
      ]
    });

    expect(workflow.label).toBe('Published');
    expect(workflow.progressLabel).toBe('2 / 3 publish checks complete');
    expect(workflow.checklist).toHaveLength(3);
  });
});
