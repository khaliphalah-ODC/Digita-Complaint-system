<script setup>
import { ref, onMounted } from 'vue';
import { Swiper, SwiperSlide } from 'swiper/vue';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import { testimonialsApi } from '../services/api';

const testimonials = ref([]);
const loadingTestimonials = ref(true);
const testimonialModules = [Autoplay, Pagination];
const avatarColors = ['#f97316', '#059669', '#7c3aed', '#0284c7', '#dc2626', '#d97706'];

const avatarColor = (i) => avatarColors[i % avatarColors.length];

onMounted(async () => {
  try {
    const rows = await testimonialsApi.listPublic() || [];
    testimonials.value = rows.slice(0, 6);
  } catch (error) {
    console.error('Failed to load testimonials:', error);
  } finally {
    loadingTestimonials.value = false;
  }
});
</script>

<template>
  <section class="testi-section">
    <div class="app-container app-shell-gutter py-18 lg:py-24">
      <div class="mx-auto mb-14 max-w-3xl text-center">
        <p class="section-kicker">Testimonials</p>
        <h2 class="section-title">Trusted by people who want a clearer process</h2>
        <p class="section-intro">
          Real feedback from people using the platform to report issues and follow progress with more confidence.
        </p>
      </div>

      <div v-if="loadingTestimonials" class="flex justify-center py-10">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500"></div>
      </div>

      <div v-else-if="testimonials.length === 0" class="testimonial-empty py-10 text-center">
        <p class="text-sm text-slate-500">No testimonials yet.</p>
        <p class="mt-1 text-sm text-slate-400">Log in and share your experience to be the first.</p>
      </div>

      <Swiper
        v-else
        class="testimonial-swiper"
        :modules="testimonialModules"
        :slides-per-view="1"
        :space-between="24"
        :loop="testimonials.length > 3"
        :autoplay="{ delay: 5000, disableOnInteraction: false }"
        :pagination="{ clickable: true }"
        :breakpoints="{
          640: { slidesPerView: 2 },
          1280: { slidesPerView: 3 }
        }"
      >
        <SwiperSlide
          v-for="(item, index) in testimonials"
          :key="item.id"
          class="testimonial-slide"
        >
          <article class="testimonial-card">
            <div class="stars">
              <span
                v-for="n in 5"
                :key="n"
                :style="{ color: n <= item.rating ? '#f59e0b' : '#e2e8f0' }"
              >★</span>
            </div>
            <p class="mt-4 text-sm leading-7 text-slate-600 italic">"{{ item.message }}"</p>
            <div class="mt-6 flex items-center gap-3">
              <div class="avatar" :style="{ background: avatarColor(index) }">
                {{ item.display_name ? item.display_name.charAt(0).toUpperCase() : 'U' }}
              </div>
              <div>
                <p class="text-sm font-bold text-[#0f2444]">{{ item.display_name || 'Anonymous' }}</p>
                <p class="text-xs text-slate-400">{{ item.role_label || 'System User' }}</p>
              </div>
            </div>
          </article>
        </SwiperSlide>
      </Swiper>
    </div>
  </section>
</template>

<style scoped>
.testi-section {
  width: 100%;
  background: linear-gradient(to bottom, #ffffff 0%, #f8fafc 100%);
}

.section-kicker {
  display: block;
  font-size: 0.85rem;
  font-weight: 700;
  font-family: 'Times New Roman', Times, serif;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: #f97316;
}

.section-title {
  margin-top: 0.5rem;
  font-family: 'Times New Roman', Times, serif;
  font-size: clamp(2rem, 4vw, 2.75rem);
  font-weight: 900;
  color: #0f2444;
  line-height: 1.08;
  text-wrap: balance;
}

.section-intro {
  margin-top: 1rem;
  color: #5f6f86;
  font-size: 1rem;
  line-height: 1.75;
}

.testimonial-empty {
  border: 1px solid rgba(15, 36, 68, 0.08);
  border-radius: 1.1rem;
  background: rgba(255, 255, 255, 0.72);
}

.testimonial-swiper {
  padding-bottom: 3rem;
}

.testimonial-slide {
  height: auto;
}

.testimonial-card {
  height: 100%;
  background: white;
  border: 1px solid rgba(15, 36, 68, 0.07);
  border-radius: 1.1rem;
  padding: 1.75rem;
  box-shadow: 0 8px 26px rgba(15, 36, 68, 0.05);
  transition: all 0.25s;
}

.testimonial-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 14px 40px rgba(15, 36, 68, 0.1);
}

.stars {
  font-size: 0.9rem;
  letter-spacing: 0.1em;
  color: #f59e0b;
}

.avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 9999px;
  font-size: 0.85rem;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

:deep(.testimonial-swiper .swiper-pagination) {
  bottom: 0;
}

:deep(.testimonial-swiper .swiper-pagination-bullet) {
  width: 0.58rem;
  height: 0.58rem;
  background: rgba(15, 36, 68, 0.18);
  opacity: 1;
}

:deep(.testimonial-swiper .swiper-pagination-bullet-active) {
  background: #f97316;
}
</style>
