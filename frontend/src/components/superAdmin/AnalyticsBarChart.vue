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
  theme: {
    type: String,
    default: 'light'
  }
});

const palette = ['#1f4db7', '#4f8df7', '#7fb3ff', '#163462', '#245bcf', '#0f1f39'];

const normalizedSeries = computed(() => {
  return (props.series || []).map((item, index) => ({
    label: item.label || `Item ${index + 1}`,
    value: Number(item.value || 0),
    tone: item.tone || palette[index % palette.length]
  }));
});

const chartData = computed(() => ({
  labels: normalizedSeries.value.map((item) => item.label),
  datasets: [
    {
      label: props.title || 'Analytics',
      data: normalizedSeries.value.map((item) => item.value),
      backgroundColor: normalizedSeries.value.map((item) => item.tone),
      borderRadius: 14,
      borderSkipped: false,
      maxBarThickness: 44
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
      backgroundColor: props.theme === 'dark' ? 'rgba(10, 28, 54, 0.96)' : '#0f172a',
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
        color: props.theme === 'dark' ? '#d7e7ff' : '#475569',
        font: {
          size: 11,
          weight: '600'
        }
      }
    },
    y: {
      beginAtZero: true,
      grid: {
        color: props.theme === 'dark' ? 'rgba(215,231,255,0.12)' : '#e2e8f0'
      },
      ticks: {
        color: props.theme === 'dark' ? '#aac7f3' : '#64748b',
        precision: 0
      }
    }
  }
}));
</script>

<template>
  <section :class="theme === 'dark' ? 'app-dark-panel rounded-[30px] p-5' : 'app-shell-panel rounded-[30px] p-5'">
    <header class="mb-5">
      <p v-if="title" :class="theme === 'dark' ? 'text-lg font-bold text-white' : 'text-lg font-bold text-slate-900'">{{ title }}</p>
      <p v-if="subtitle" :class="theme === 'dark' ? 'mt-1 text-sm text-white/58' : 'mt-1 text-sm text-slate-600'">{{ subtitle }}</p>
    </header>

    <div v-if="normalizedSeries.length" class="space-y-4">
      <div :class="theme === 'dark' ? 'h-[300px] rounded-[24px] bg-white/[0.03] p-4' : 'h-[300px] rounded-[24px] bg-slate-50 p-4'">
        <Bar :data="chartData" :options="chartOptions" />
      </div>

      <div class="grid grid-cols-1 gap-2 md:grid-cols-2">
        <div
          v-for="item in normalizedSeries"
          :key="`${item.label}-legend`"
          :class="theme === 'dark' ? 'flex items-center justify-between rounded-[20px] border border-white/8 bg-white/[0.04] px-4 py-3' : 'app-ink-card flex items-center justify-between rounded-[20px] px-4 py-3'"
        >
          <div class="flex items-center gap-3">
            <span class="h-3 w-3 rounded-full" :style="{ backgroundColor: item.tone }" />
            <span :class="theme === 'dark' ? 'text-sm font-semibold text-white/82' : 'text-sm font-semibold text-slate-700'">{{ item.label }}</span>
          </div>
          <span :class="theme === 'dark' ? 'text-sm font-black text-white' : 'text-sm font-black text-slate-900'">{{ item.value }}{{ valueSuffix }}</span>
        </div>
      </div>
    </div>

    <p v-else :class="theme === 'dark' ? 'text-sm text-white/60' : 'text-sm text-slate-500'">No analytics data available yet.</p>
  </section>
</template>
