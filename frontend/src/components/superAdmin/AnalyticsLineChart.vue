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
    default: '#1d4ed8'
  },
  theme: {
    type: String,
    default: 'light'
  }
});

const normalizedSeries = computed(() => {
  return (props.series || []).map((item, index) => ({
    label: item.label || `Point ${index + 1}`,
    value: Number(item.value || 0)
  }));
});

const chartData = computed(() => ({
  labels: normalizedSeries.value.map((item) => item.label),
  datasets: [
    {
      label: props.title || 'Trend',
      data: normalizedSeries.value.map((item) => item.value),
      borderColor: props.lineColor,
      backgroundColor: `${props.lineColor}22`,
      fill: true,
      tension: 0.35,
      pointRadius: 4,
      pointHoverRadius: 6,
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
        <Line :data="chartData" :options="chartOptions" />
      </div>

      <div class="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
        <article
          v-for="point in normalizedSeries"
          :key="`${point.label}-metric`"
          :class="theme === 'dark' ? 'rounded-[18px] border border-white/8 bg-white/[0.04] px-3 py-3' : 'app-ink-card rounded-[18px] px-3 py-3'"
        >
          <p :class="theme === 'dark' ? 'text-[11px] font-semibold uppercase tracking-[0.2em] text-white/48' : 'text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500'">{{ point.label }}</p>
          <p :class="theme === 'dark' ? 'mt-2 text-xl font-black text-white' : 'mt-2 text-xl font-black text-slate-900'">{{ point.value }}</p>
        </article>
      </div>
    </div>

    <p v-else :class="theme === 'dark' ? 'text-sm text-white/60' : 'text-sm text-slate-500'">No analytics data available yet.</p>
  </section>
</template>
