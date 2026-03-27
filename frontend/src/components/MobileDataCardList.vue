<script setup>
const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },
  fields: {
    type: Array,
    default: () => []
  },
  keyField: {
    type: String,
    default: 'id'
  }
});

const resolveValue = (item, field) => {
  if (typeof field?.value === 'function') {
    return field.value(item);
  }

  if (field?.key && item && Object.hasOwn(item, field.key)) {
    return item[field.key];
  }

  return '';
};

const rowKey = (item, index) => item?.[props.keyField] ?? item?.id ?? index;
</script>

<template>
  <div class="space-y-3 md:hidden">
    <article
      v-for="(item, index) in items"
      :key="rowKey(item, index)"
      class="mobile-data-card app-card rounded-[22px] px-4 py-4 shadow-[var(--app-shadow-xs)]"
    >
      <div class="space-y-3">
        <div
          v-for="field in fields"
          :key="field.key || field.label"
          class="mobile-data-card__field"
        >
          <p class="mobile-data-card__label text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[var(--app-muted-color)]">
            {{ field.label }}
          </p>
          <div class="min-w-0 text-sm text-[var(--app-text-color)]">
            <slot
              :name="`field-${field.key}`"
              :item="item"
              :value="resolveValue(item, field)"
            >
              <p class="break-words font-medium text-[var(--app-title-color)]">
                {{ resolveValue(item, field) || 'N/A' }}
              </p>
            </slot>
          </div>
        </div>
      </div>

      <div v-if="$slots.actions" class="mobile-data-card__actions mt-4 border-t border-[var(--app-line)] pt-4">
        <slot name="actions" :item="item" />
      </div>
    </article>
  </div>
</template>

<style scoped>
.mobile-data-card__field {
  display: grid;
  grid-template-columns: minmax(5.9rem, 6.7rem) minmax(0, 1fr);
  align-items: start;
  gap: 0.75rem;
}

.mobile-data-card__actions :deep(button),
.mobile-data-card__actions :deep(a) {
  min-height: 2.5rem;
}

@media (max-width: 480px) {
  .mobile-data-card__field {
    grid-template-columns: minmax(0, 1fr);
    gap: 0.28rem;
  }

  .mobile-data-card__label {
    margin-bottom: 0.1rem;
  }

  .mobile-data-card__actions :deep(.flex) {
    flex-direction: column;
    align-items: stretch;
  }

  .mobile-data-card__actions :deep(button),
  .mobile-data-card__actions :deep(a) {
    width: 100%;
    justify-content: center;
  }
}
</style>
