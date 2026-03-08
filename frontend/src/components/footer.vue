<script setup>
import { RouterLink } from 'vue-router';
</script>

<template>
  <footer class="bg-slate-50 border-t border-slate-200 text-slate-700">
    <div class="max-w-7xl mx-auto px-6 py-12 md:px-12 grid grid-cols-1 md:grid-cols-3 gap-10">

      <!-- About Section -->
      <div
        class="p-4 rounded-2xl transition-transform transform hover:-translate-y-1 hover:scale-105 hover:shadow-xl hover:shadow-orange-200"
      >
        <p class="text-2xl font-black text-slate-900">
          Complaint <span class="text-orange-500">MS</span>
        </p>
        <p class="text-sm text-slate-500 mt-2">
          Helping You Voice Your Concerns and Track Real Change.
        </p>
      </div>

      <!-- Quick Links -->
      <div
        class="p-4 rounded-2xl transition-transform transform hover:-translate-y-1 hover:scale-105 hover:shadow-xl hover:shadow-orange-200"
      >
        <h3 class="text-lg font-semibold text-slate-900 mb-3">Quick Links</h3>
        <ul class="space-y-2">
          <li>
            <a href="#top" class="hover:text-orange-500 transition-colors duration-300">
              Home
             </a>
          </li>
          <li>
            <RouterLink
              to="/signin"
              class="hover:text-orange-500 transition-colors duration-300"
            >Submit Complaint</RouterLink>
          </li>
          <li>
            <RouterLink
              to="/signin"
              class="hover:text-orange-500 transition-colors duration-300"
            >My Complaints</RouterLink>
          </li>
          <li>
            <RouterLink
              to="/organizations"
              class="hover:text-orange-500 transition-colors duration-300"
            >Organizations</RouterLink>
          </li>
        </ul>
      </div>

      <!-- Contact & Socials -->
      <div
        class="p-4 rounded-2xl transition-transform transform hover:-translate-y-1 hover:scale-105 hover:shadow-xl hover:shadow-orange-200"
      >
        <h3 class="text-lg font-semibold text-slate-900 mb-3">Contact Us</h3>
        <p class="text-sm text-slate-600">
          Email: 
          <a href="mailto:support@complaintms.com" class="hover:text-orange-500 transition-colors duration-300">
            support@complaintms.com
          </a>
        </p>
        <p class="text-sm text-slate-600">Phone: +231 77 000 0000</p>

        <div class="mt-4 flex space-x-4">
          <!-- Twitter -->
          <a href="#" class="text-slate-500 hover:text-orange-500 transition-transform transform hover:scale-125">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23 3a10.9 10.9 0 01-3.14 1.53A4.48 4.48 0 0022.4.36a9.07 9.07 0 01-2.88 1.1A4.52 4.52 0 0016.43 0c-2.5 0-4.5 2.04-4.5 4.55 0 .36.04.7.11 1.03A12.94 12.94 0 013 1.65a4.54 4.54 0 001.39 6.07A4.52 4.52 0 012.8 7v.05c0 2.21 1.57 4.06 3.65 4.48a4.52 4.52 0 01-2.04.08 4.52 4.52 0 004.21 3.14A9.06 9.06 0 010 19.54a12.77 12.77 0 006.95 2.03c8.34 0 12.9-6.89 12.9-12.87l-.01-.59A9.25 9.25 0 0023 3z"/>
            </svg>
          </a>
          <!-- Facebook -->
          <a href="#" class="text-slate-500 hover:text-orange-500 transition-transform transform hover:scale-125">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22 12a10 10 0 10-11.5 9.95v-7.05h-2.15v-2.9h2.15V9.45c0-2.13 1.27-3.3 3.22-3.3.93 0 1.9.16 1.9.16v2.1h-1.08c-1.06 0-1.39.66-1.39 1.33v1.62h2.37l-.38 2.9h-1.99v7.05A10 10 0 0022 12z"/>
            </svg>
          </a>
          <!-- Instagram -->
          <a href="#" class="text-slate-500 hover:text-orange-500 transition-transform transform hover:scale-125">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.2c3.2 0 3.584.012 4.85.07 1.17.056 1.96.24 2.415.402a4.918 4.918 0 011.77 1.03 4.918 4.918 0 011.03 1.77c.162.456.346 1.244.402 2.414.058 1.265.07 1.65.07 4.85s-.012 3.584-.07 4.85c-.056 1.17-.24 1.958-.402 2.415a4.918 4.918 0 01-1.03 1.77 4.918 4.918 0 01-1.77 1.03c-.456.162-1.244.346-2.415.402-1.265.058-1.65.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.056-1.958-.24-2.415-.402a4.918 4.918 0 01-1.77-1.03 4.918 4.918 0 01-1.03-1.77c-.162-.456-.346-1.244-.402-2.415C2.212 15.584 2.2 15.2 2.2 12s.012-3.584.07-4.85c.056-1.17.24-1.958.402-2.415a4.918 4.918 0 011.03-1.77 4.918 4.918 0 011.77-1.03c.456-.162 1.244-.346 2.415-.402C8.416 2.212 8.8 2.2 12 2.2zm0-2.2C8.735 0 8.332.013 7.052.072 5.772.131 4.768.333 4.013.575a6.946 6.946 0 00-2.57 1.056A6.946 6.946 0 00.387 4.2C.145 4.955-.057 5.959-.116 7.239-.175 8.519-.188 8.922-.188 12c0 3.078.013 3.481.072 4.761.059 1.28.261 2.284.503 3.039a6.946 6.946 0 001.056 2.57 6.946 6.946 0 002.57 1.056c.755.242 1.759.444 3.039.503C8.332 23.987 8.735 24 12 24s3.668-.013 4.948-.072c1.28-.059 2.284-.261 3.039-.503a6.946 6.946 0 002.57-1.056 6.946 6.946 0 001.056-2.57c.242-.755.444-1.759.503-3.039C23.987 15.668 24 15.265 24 12s-.013-3.668-.072-4.948c-.059-1.28-.261-2.284-.503-3.039a6.946 6.946 0 00-1.056-2.57 6.946 6.946 0 00-2.57-1.056C19.284.333 18.28.131 17 .072 15.72.013 15.317 0 12 0z"/>
              <path d="M12 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zm0 10.162a3.999 3.999 0 110-7.998 3.999 3.999 0 010 7.998z"/>
              <circle cx="18.406" cy="5.594" r="1.44"/>
            </svg>
          </a>
        </div>
      </div>

    </div>

    <!-- Bottom Note -->
    <div class="mt-10 border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
      &copy; 2026 Complaint MS. All Rights Reserved.
    </div>
  </footer>
</template>