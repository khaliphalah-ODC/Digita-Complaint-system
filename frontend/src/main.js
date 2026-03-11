import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  faBell,
  faBuilding,
  faChartLine,
  faClipboardList,
  faComments,
  faEye,
  faEyeSlash,
  faEnvelope,
  faFileCircleCheck,
  faFileLines,
  faGaugeHigh,
  faGear,
  faHouse,
  faRightFromBracket,
  faRightToBracket,
  faSitemap,
  faTriangleExclamation,
  faUserPlus,
  faUsers
} from '@fortawesome/free-solid-svg-icons';
import { faFacebookF, faGoogle, faInstagram, faLinkedinIn, faXTwitter } from '@fortawesome/free-brands-svg-icons';

<<<<<<< HEAD

import App from './App.vue'
import router from './router'
=======
import App from './App.vue';
import router from './router';
>>>>>>> 4629cccb5b1cbfdf7b7c17327b20994a0d85fe9e
import './asset/main.css';
import '@fortawesome/fontawesome-free/css/all.min.css'

library.add(
  faBell,
  faBuilding,
  faChartLine,
  faClipboardList,
  faComments,
  faEye,
  faEyeSlash,
  faEnvelope,
  faFacebookF,
  faFileCircleCheck,
  faFileLines,
  faGaugeHigh,
  faGear,
  faGoogle,
  faHouse,
  faInstagram,
  faLinkedinIn,
  faRightFromBracket,
  faRightToBracket,
  faSitemap,
  faTriangleExclamation,
  faUserPlus,
  faUsers,
  faXTwitter
);

const app = createApp(App);

app.component('FontAwesomeIcon', FontAwesomeIcon);
app.use(createPinia());
app.use(router);

app.mount('#app');
