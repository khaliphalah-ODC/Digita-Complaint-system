import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  faBars,
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
  faUserShield,
  faXmark
} from '@fortawesome/free-solid-svg-icons';
import { faFacebookF, faGoogle, faInstagram, faLinkedinIn, faXTwitter } from '@fortawesome/free-brands-svg-icons';

import App from './App.vue';
import router from './router';
import './asset/main.css';

library.add(
  faBell,
  faBars,
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
  faUserShield,
  faXmark,
  faXTwitter
);

const app = createApp(App);

app.component('FontAwesomeIcon', FontAwesomeIcon);
app.use(createPinia());
app.use(router);

app.mount('#app');
