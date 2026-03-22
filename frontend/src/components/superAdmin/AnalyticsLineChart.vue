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
  <section class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
    <header class="mb-3">
      <p v-if="title" class="text-sm font-semibold text-slate-900">{{ title }}</p>
      <p v-if="subtitle" class="mt-0.5 text-xs text-slate-500">{{ subtitle }}</p>
    </header>

    <div v-if="normalizedSeries.length && hasMeaningfulData">
      <div :class="compact ? 'h-[150px]' : 'h-[190px]'">
        <Line :data="chartData" :options="chartOptions" />
      </div>

      <div v-if="!compact" class="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
        <article
          v-for="point in normalizedSeries"
          :key="`${point.label}-metric`"
          class="rounded-lg border border-slate-200 bg-white px-2.5 py-2"
        >
          <p class="text-[11px] text-slate-500">{{ point.label }}</p>
          <p class="mt-1 text-sm font-semibold text-slate-900">{{ point.value }}</p>
        </article>
      </div>
    </div>

    <div
      v-else
      class="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-5 text-xs text-slate-500"
    >
      {{ emptyMessage }}
    </div>
  </section>
</template>