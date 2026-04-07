const normalizeOptionText = (value) => String(value || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

export const parseFieldOptions = (optionsText) => normalizeOptionText(optionsText);

export const createFieldDraft = (field = {}) => ({
  label: field.label || '',
  field_key: field.field_key || '',
  field_type: field.field_type || 'short_text',
  placeholder: field.placeholder || '',
  help_text: field.help_text || '',
  is_required: Boolean(field.is_required),
  is_active: Boolean(field.is_active),
  optionsText: Array.isArray(field.options) ? field.options.join(', ') : ''
});

export const attachFieldDrafts = (fields = []) => fields.map((field) => ({
  ...field,
  _draft: createFieldDraft(field)
}));

export const reorderItemsByIds = (items = [], orderedIds = []) => {
  const lookup = new Map(items.map((item) => [Number(item.id), item]));
  return orderedIds.map((id) => lookup.get(Number(id))).filter(Boolean);
};

export const reorderItemsByDrag = (items = [], sourceId, targetId) => {
  const ordered = [...items];
  const sourceIndex = ordered.findIndex((item) => Number(item.id) === Number(sourceId));
  const targetIndex = ordered.findIndex((item) => Number(item.id) === Number(targetId));

  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
    return ordered;
  }

  const [moved] = ordered.splice(sourceIndex, 1);
  ordered.splice(targetIndex, 0, moved);
  return ordered;
};

export const buildPublishWorkflow = (form = {}) => {
  const checklist = Array.isArray(form.publish_checklist) ? form.publish_checklist : [];
  const completedCount = checklist.filter((item) => item.complete).length;
  const totalCount = checklist.length;

  return {
    state: form.publish_state || 'draft',
    label: form.publish_label || 'Draft',
    description: form.publish_description || 'Continue configuring the form before publishing it.',
    progressLabel: totalCount ? `${completedCount} / ${totalCount} publish checks complete` : 'No publish checks available yet',
    checklist
  };
};
