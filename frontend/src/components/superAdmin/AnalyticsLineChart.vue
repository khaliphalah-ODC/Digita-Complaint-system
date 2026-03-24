<script setup>
import { computed } from 'vue';
import { Line } from 'vue-chartjs';
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

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
  lineColor: {
    type: String,
    default: '#2563eb'
  },
  compact: {
    type: Boolean,
    default: false
  },
  emptyMessage: {
    type: String,
    default: 'No meaningful data is available for this chart yet.'
  }
});

const normalizedSeries = computed(() => {
  return (props.series || []).map((item, index) => ({
    label: item.label || `Point ${index + 1}`,
    value: Number(item.value || 0)
  }));
});

const hasMeaningfulData = computed(() =>
  normalizedSeries.value.some((item) => item.value > 0)
);

const chartData = computed(() => ({
  labels: normalizedSeries.value.map((item) => item.label),
  datasets: [
    {
      label: props.title || 'Trend',
      data: normalizedSeries.value.map((item) => item.value),
      borderColor: props.lineColor,
      backgroundColor: `${props.lineColor}14`,
      fill: true,
      tension: 0.35,
      pointRadius: 2.5,
      pointHoverRadius: 4,
      pointBorderWidth: 2,
      pointBackgroundColor: '#ffffff',
      pointBorderColor: props.lineColor
    }
  ]
}));

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      backgroundColor: '#0f172a',
      titleColor: '#ffffff',
      bodyColor: '#e2e8f0',
      displayColors: false
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      },
      border: {
        display: false
      },
      ticks: {
        color: '#64748b',
        font: {
          size: 10,
          weight: '500'
        }
      }
    },
    y: {
      beginAtZero: true,
      border: {
        display: false
      },
      grid: {
        color: '#e2e8f0'
      },
      ticks: {
        color: '#64748b',
        precision: 0,
        font: {
          size: 10
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

    <div v-if="normalizedSeries.length && hasMeaningfulData">
      <div class="app-chart-stage" :class="compact ? 'h-[175px]' : 'h-[220px]'">
        <Line :data="chartData" :options="chartOptions" />
      </div>

      <div v-if="!compact" class="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
        <article
          v-for="point in normalizedSeries"
          :key="`${point.label}-metric`"
          class="app-metric-tile px-3 py-2.5"
        >
          <p class="text-[11px] text-[var(--app-muted-color)]">{{ point.label }}</p>
          <p class="mt-1 text-sm font-semibold text-[var(--app-title-color)]">{{ point.value }}</p>
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
