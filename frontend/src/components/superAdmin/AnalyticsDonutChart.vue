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
  theme: {
    type: String,
    default: 'light'
  }
});

const palette = ['#1f4db7', '#4f8df7', '#7fb3ff', '#163462', '#245bcf', '#0f1f39'];

const normalizedSeries = computed(() => {
  return (props.series || []).map((item, index) => ({
    label: item.label || `Segment ${index + 1}`,
    value: Number(item.value || 0),
    tone: item.tone || palette[index % palette.length]
  }));
});

const total = computed(() => normalizedSeries.value.reduce((sum, item) => sum + item.value, 0));

const chartData = computed(() => ({
  labels: normalizedSeries.value.map((item) => item.label),
  datasets: [
    {
      data: normalizedSeries.value.map((item) => item.value),
      backgroundColor: normalizedSeries.value.map((item) => item.tone),
      borderWidth: 0,
      hoverOffset: 8
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
      backgroundColor: props.theme === 'dark' ? 'rgba(10, 28, 54, 0.96)' : '#0f172a',
      titleColor: '#ffffff',
      bodyColor: '#ffffff',
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
  <section :class="theme === 'dark' ? 'app-dark-panel rounded-[30px] p-5' : 'app-shell-panel rounded-[30px] p-5'">
    <header class="mb-5">
      <p v-if="title" :class="theme === 'dark' ? 'text-lg font-bold text-white' : 'text-lg font-bold text-slate-900'">{{ title }}</p>
      <p v-if="subtitle" :class="theme === 'dark' ? 'mt-1 text-sm text-white/58' : 'mt-1 text-sm text-slate-600'">{{ subtitle }}</p>
    </header>

    <div v-if="normalizedSeries.length" class="grid gap-5 lg:grid-cols-[220px,1fr] lg:items-center">
      <div class="relative mx-auto h-[220px] w-[220px]">
        <Doughnut :data="chartData" :options="chartOptions" />
        <div class="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div class="text-center">
            <p :class="theme === 'dark' ? 'text-[11px] font-semibold uppercase tracking-[0.25em] text-white/50' : 'text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500'">{{ centerLabel }}</p>
            <p :class="theme === 'dark' ? 'mt-1 text-3xl font-black text-white' : 'mt-1 text-3xl font-black text-slate-900'">{{ total }}</p>
          </div>
        </div>
      </div>

      <div class="grid gap-3">
        <article
          v-for="segment in normalizedSeries"
          :key="`${segment.label}-row`"
          :class="theme === 'dark' ? 'flex items-center justify-between rounded-[20px] border border-white/8 bg-white/[0.04] px-4 py-3' : 'app-ink-card flex items-center justify-between rounded-[20px] px-4 py-3'"
        >
          <div class="flex items-center gap-3">
            <span class="h-3 w-3 rounded-full" :style="{ backgroundColor: segment.tone }" />
            <div>
              <p :class="theme === 'dark' ? 'text-sm font-semibold text-white/84' : 'text-sm font-semibold text-slate-800'">{{ segment.label }}</p>
              <p :class="theme === 'dark' ? 'text-xs text-white/50' : 'text-xs text-slate-500'">
                {{ total > 0 ? ((segment.value / total) * 100).toFixed(1) : '0.0' }}% share
              </p>
            </div>
          </div>
          <p :class="theme === 'dark' ? 'text-lg font-black text-white' : 'text-lg font-black text-slate-900'">{{ segment.value }}</p>
        </article>
      </div>
    </div>

    <p v-else :class="theme === 'dark' ? 'text-sm text-white/60' : 'text-sm text-slate-500'">No analytics data available yet.</p>
  </section>
</template>
