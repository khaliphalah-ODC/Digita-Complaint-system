import router from 'express';

import {notice, createNoticeTable, getAllnotifications, getnotificationById, deletecomplainById} from '../controllers/notification.controller.js';

const notificationRouter = router();

notificationRouter.route('/')
.get(getAllnotifications)
.post(createNoticeTable)

notificationRouter.route('/:notificationId')
.get(getnotificationById)
.delete(deletecomplainById)

export default notificationRouter;