import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  faBell,
  faBuilding,
  faChartLine,
  faCircleInfo,
  faClipboardList,
  faComments,
  faEye,
  faEyeSlash,
  faEnvelope,
  faFileCircleCheck,
  faFileLines,
  faFloppyDisk,
  faGaugeHigh,
  faGear,
  faHouse,
  faPenToSquare,
  faRightFromBracket,
  faRightToBracket,
  faSitemap,
  faTrashCan,
  faTriangleExclamation,
  faUserPlus,
  faUsers,
  faXmark
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
  faCircleInfo,
  faClipboardList,
  faComments,
  faEye,
  faEyeSlash,
  faEnvelope,
  faFacebookF,
  faFileCircleCheck,
  faFileLines,
  faFloppyDisk,
  faGaugeHigh,
  faGear,
  faGoogle,
  faHouse,
  faInstagram,
  faLinkedinIn,
  faPenToSquare,
  faRightFromBracket,
  faRightToBracket,
  faSitemap,
  faTrashCan,
  faTriangleExclamation,
  faUserPlus,
  faUsers,
  faXmark,
  faXTwitter
);

const app = createApp(App);

app.component('FontAwesomeIcon', FontAwesomeIcon);
app.use(createPinia());
app.use(router);

app.mount('#app');
