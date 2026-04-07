<script setup>
import EmptyState from './EmptyState.vue';
import LoadingSpinner from './LoadingSpinner.vue';

const props = defineProps({
  columns: {
    type: Array,
    default: () => []
  },
  rows: {
    type: Array,
    default: () => []
  },
  rowKey: {
    type: String,
    default: 'id'
  },
  loading: {
    type: Boolean,
    default: false
  },
  loadingText: {
    type: String,
    default: 'Loading data...'
  },
  emptyTitle: {
    type: String,
    default: 'No results found'
  },
  emptyDescription: {
    type: String,
    default: ''
  },
  page: {
    type: Number,
    default: 1
  },
  totalPages: {
    type: Number,
    default: 1
  },
  totalItems: {
    type: Number,
    default: 0
  },
  visibleCount: {
    type: Number,
    default: 0
  },
  paginationLabel: {
    type: String,
    default: 'items'
  },
  tableClass: {
    type: String,
    default: 'app-table app-table-responsive min-w-full'
  },
  shellClass: {
    type: String,
    default: 'app-table-shell overflow-x-auto'
  },
  footerClass: {
    type: String,
    default: 'mt-3 flex flex-col gap-2 text-xs text-[var(--app-muted-color)] sm:flex-row sm:items-center sm:justify-between'
  },
  pagerButtonClass: {
    type: String,
    default: 'app-btn-secondary min-h-[34px] px-3 py-1 text-xs disabled:opacity-50'
  }
});

const emit = defineEmits(['update:page']);

const updatePage = (nextPage) => {
  emit('update:page', Math.min(Math.max(1, nextPage), props.totalPages));
};
</script>

<template>
  <LoadingSpinner v-if="props.loading" :label="props.loadingText" />
  <EmptyState
    v-else-if="props.rows.length === 0"
    :title="props.emptyTitle"
    :description="props.emptyDescription"
  />
  <div v-else>
    <div class="hidden md:block" :class="props.shellClass">
      <table :class="props.tableClass">
        <thead>
          <tr>
            <th v-for="column in props.columns" :key="column.key">{{ column.label }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in props.rows" :key="row[props.rowKey]">
            <td v-for="column in props.columns" :key="column.key" :data-label="column.label" :data-actions="column.key === 'actions' ? 'true' : null">
              <slot :name="`cell-${column.key}`" :row="row">
                {{ row[column.key] ?? 'N/A' }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="props.totalItems > 0" :class="props.footerClass">
      <p>Showing {{ props.visibleCount }} of {{ props.totalItems }} {{ props.paginationLabel }}</p>
      <div class="flex items-center gap-2">
        <button :class="props.pagerButtonClass" :disabled="props.page <= 1" @click="updatePage(props.page - 1)">Prev</button>
        <span>Page {{ props.page }} / {{ props.totalPages }}</span>
        <button :class="props.pagerButtonClass" :disabled="props.page >= props.totalPages" @click="updatePage(props.page + 1)">Next</button>
      </div>
    </div>
  </div>
</template>
