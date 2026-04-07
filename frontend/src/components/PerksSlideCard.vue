<script setup>
defineProps({
  slide: {
    type: Object,
    required: true
  }
});
</script>

<template>
  <article class="role-value-card">
    <div class="role-value-image-wrap">
      <img
        :src="slide.image"
        :alt="slide.title"
        class="role-value-image"
      >
    </div>
    <div class="role-value-content">
      <h3 class="role-value-title">{{ slide.title }}</h3>
      <ul class="role-value-list">
        <li
          v-for="item in slide.bullets"
          :key="item"
          class="role-value-item"
        >
          <span class="role-value-check">✓</span>
          <span>{{ item }}</span>
        </li>
      </ul>
    </div>
  </article>
</template>

<style scoped>
.role-value-card {
  display: grid;
  gap: 1.35rem;
  position: relative;
  z-index: 2;
  width: min(100%, 17.9rem);
  margin-left: auto;
  margin-right: auto;
  min-height: auto;
  border-radius: 1.5rem;
  border: 1px solid rgba(15, 36, 68, 0.1);
  background: #fff;
  padding: 1.2rem;
  box-shadow: 0 14px 32px rgba(15, 36, 68, 0.08);
  transition: opacity 0.2s ease, transform 0.2s ease;
  align-items: start;
  transform: scale(0.96);
  transform-origin: center top;
}

.role-value-image-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 10.8rem;
  border-radius: 1.2rem;
  overflow: hidden;
  background: #f6f6f6;
  min-height: 10.8rem;
  max-height: 10.8rem;
  flex-shrink: 0;
}

.role-value-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  transform: scale(0.9);
}

.role-value-content {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 1.05rem;
  width: 100%;
  min-height: auto;
  padding: 0.1rem 0 0;
}

.role-value-title {
  font-size: 1.8rem;
  font-weight: 900;
  color: #1b1b1b;
  line-height: 0.96;
  letter-spacing: -0.04em;
  text-align: center;
}

.role-value-list {
  display: grid;
  gap: 0.82rem;
  color: #677487;
  font-size: 0.95rem;
  line-height: 1.3;
}

.role-value-item {
  display: flex;
  gap: 0.72rem;
  align-items: flex-start;
}

.role-value-check {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.45rem;
  height: 1.45rem;
  margin-top: 0.02rem;
  border-radius: 9999px;
  color: #1b3b6f;
  font-size: 0.98rem;
  font-weight: 800;
}

@media (min-width: 900px) {
  .role-value-card {
    width: 100%;
    gap: clamp(1.7rem, 2.4vw, 2.8rem);
    min-height: 540px;
    padding: clamp(1.45rem, 2.3vw, 2.35rem);
    grid-template-columns: minmax(0, 450px) minmax(0, 1fr);
    align-items: center;
    transform: scale(0.94);
  }

  .role-value-image-wrap {
    align-self: center;
    height: 410px;
    min-height: 410px;
    max-height: 410px;
  }

  .role-value-content {
    justify-content: center;
    gap: 1.25rem;
    max-width: 30rem;
    min-height: 410px;
    padding: 0.2rem 0.25rem 0.2rem 0;
  }

  .role-value-title {
    font-size: clamp(2.15rem, 3.2vw, 3.2rem);
    text-align: left;
  }

  .role-value-list {
    gap: 0.92rem;
    font-size: clamp(0.95rem, 1.1vw, 1.02rem);
    line-height: 1.22;
  }

  .role-value-item {
    gap: 0.9rem;
  }
}

@media (max-width: 640px) {
  .role-value-card {
    width: min(100%, 17.7rem);
    padding: 1.15rem 1rem 1.2rem;
    transform: scale(0.95);
  }

  .role-value-image-wrap {
    height: 10.4rem;
    min-height: 10.4rem;
    max-height: 10.4rem;
  }

  .role-value-title {
    font-size: 1.68rem;
  }

  .role-value-list {
    font-size: 0.92rem;
  }
}

@media (max-width: 768px) {
  .role-value-content {
    padding-top: 0.15rem;
    min-height: auto;
  }

  .role-value-list {
    line-height: 1.42;
  }
}
</style>
