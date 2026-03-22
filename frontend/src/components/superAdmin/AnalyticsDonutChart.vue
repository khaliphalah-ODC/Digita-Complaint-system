<script setup>
import { computed } from 'vue';
import { Doughnut } from 'vue-chartjs';
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  subtitle: {
    type: String,
    default: ''
  },
  series: {
    type: Array,
    default: () => []
  },
  centerLabel: {
    type: String,
    default: 'Total'
  },
  emptyMessage: {
    type: String,
    default: 'No meaningful data is available for this chart yet.'
  }
});

const palette = ['#2563eb', '#3b82f6', '#60a5fa', '#0f172a', '#16a34a', '#f59e0b'];

const normalizedSeries = computed(() => {
  return (props.series || []).map((item, index) => ({
    label: item.label || `Segment ${index + 1}`,
    value: Number(item.value || 0),
    tone: item.tone || palette[index % palette.length]
  }));
});

const total = computed(() => normalizedSeries.value.reduce((sum, item) => sum + item.value, 0));
const hasMeaningfulData = computed(() => total.value > 0);

const chartData = computed(() => ({
  labels: normalizedSeries.value.map((item) => item.label),
  datasets: [
    {
      data: normalizedSeries.value.map((item) => item.value),
      backgroundColor: normalizedSeries.value.map((item) => item.tone),
      borderWidth: 0,
      hoverOffset: 4
    }
  ]
}));

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: '72%',
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      backgroundColor: '#0f172a',
      titleColor: '#ffffff',
      bodyColor: '#ffffff',
      displayColors: false,
      callbacks: {
        label(context) {
          const value = Number(context.raw || 0);
          const percent = total.value > 0 ? ((value / total.value) * 100).toFixed(1) : '0.0';
          return `${context.label}: ${value} (${percent}%)`;
        }
      }
    }
  }
}));
</script>

<template>
  <section class="app-chart-card">
    <header class="mb-3">
      <p v-if="title" class="text-base font-semibold text-[var(--app-title-color)]">{{ title }}</p>
      <p v-if="subtitle" class="mt-1 text-sm text-[var(--app-muted-color)]">{{ subtitle }}</p>
    </header>

    <div
      v-if="normalizedSeries.length && hasMeaningfulData"
      class="app-chart-stage grid gap-4 lg:grid-cols-[170px,1fr] lg:items-center"
    >
      <div class="relative mx-auto h-[150px] w-[150px]">
        <Doughnut :data="chartData" :options="chartOptions" />
        <div class="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div class="text-center">
            <p class="text-[11px] font-medium text-[var(--app-muted-color)]">{{ centerLabel }}</p>
            <p class="mt-1 text-xl font-semibold text-[var(--app-title-color)]">{{ total }}</p>
          </div>
        </div>
      </div>

      <div class="grid gap-2">
        <article
          v-for="segment in normalizedSeries"
          :key="`${segment.label}-row`"
          class="app-metric-tile flex items-center justify-between px-3 py-2.5"
        >
          <div class="flex items-center gap-2.5">
            <span class="h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: segment.tone }" />
            <div>
              <p class="text-sm text-[var(--app-text-color)]">{{ segment.label }}</p>
              <p class="text-[11px] text-[var(--app-muted-color)]">
                {{ total > 0 ? ((segment.value / total) * 100).toFixed(1) : '0.0' }}%
              </p>
            </div>
          </div>
          <p class="text-sm font-semibold text-[var(--app-title-color)]">{{ segment.value }}</p>
        </article>
      </div>
    </div>

    <div
      v-else
      class="app-empty-state text-xs"
    >
      {{ emptyMessage }}
    </div>
  </section>
</template>
