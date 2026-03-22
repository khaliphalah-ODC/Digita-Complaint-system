<script setup>
import { computed } from 'vue';
import { Bar } from 'vue-chartjs';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

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
  valueSuffix: {
    type: String,
    default: ''
  },
  compact: {
    type: Boolean,
    default: false
  },
  emptyMessage: {
    type: String,
    default: 'No meaningful data is available for this chart yet.'
  },
  theme: {
    type: String,
    default: 'light'
  }
});

const palette = ['#2563eb', '#3b82f6', '#60a5fa', '#0f172a', '#16a34a', '#f59e0b'];

const normalizedSeries = computed(() => {
  return (props.series || []).map((item, index) => ({
    label: item.label || `Item ${index + 1}`,
    value: Number(item.value || 0),
    tone: item.tone || palette[index % palette.length]
  }));
});

const hasMeaningfulData = computed(() => normalizedSeries.value.some((item) => item.value > 0));

const chartData = computed(() => ({
  labels: normalizedSeries.value.map((item) => item.label),
  datasets: [
    {
      label: props.title || 'Analytics',
      data: normalizedSeries.value.map((item) => item.value),
      backgroundColor: normalizedSeries.value.map((item) => item.tone),
      borderRadius: 8,
      borderSkipped: false,
      maxBarThickness: 40
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
      bodyColor: '#ffffff',
      callbacks: {
        label(context) {
          return `${context.parsed.y}${props.valueSuffix}`;
        }
      }
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      },
      ticks: {
        color: '#64748b',
        font: {
          size: 11,
          weight: '600'
        }
      }
    },
    y: {
      beginAtZero: true,
      grid: {
        color: '#e2e8f0'
      },
      ticks: {
        color: '#64748b',
        precision: 0
      }
    }
  }
}));
</script>

<template>
  <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <header class="mb-5">
      <p v-if="title" class="text-lg font-semibold text-slate-900">{{ title }}</p>
      <p v-if="subtitle" class="mt-1 text-sm text-slate-600">{{ subtitle }}</p>
    </header>

    <div v-if="normalizedSeries.length && hasMeaningfulData" class="space-y-4">
      <div class="rounded-xl border border-slate-200 bg-slate-50 p-4" :class="props.compact ? 'h-[170px]' : 'h-[220px]'">
        <Bar :data="chartData" :options="chartOptions" />
      </div>

      <div v-if="!props.compact" class="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div
          v-for="item in normalizedSeries"
          :key="`${item.label}-legend`"
          class="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
        >
          <div class="flex items-center gap-3">
            <span class="h-3 w-3 rounded-full" :style="{ backgroundColor: item.tone }" />
            <span class="text-sm font-medium text-slate-700">{{ item.label }}</span>
          </div>
          <span class="text-sm font-semibold text-slate-900">{{ item.value }}{{ valueSuffix }}</span>
        </div>
      </div>
    </div>

    <div v-else class="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
      {{ emptyMessage }}
    </div>
  </section>
</template>
