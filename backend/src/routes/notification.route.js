import router from 'express';

import {notice, createNoticeTable, getAllnotifications, getnotificationById, deletecomplainById} from '../controllers/notification.controller.js';

const notificationRoute = router();

noticeRouter.route('/')
.get(getAllnotifications)
.post(createNoticeTable)

noticeRouter.route('/:notificationId')
.get(getnotificationById)
.delete(deletecomplainById)

export default noticeRouter;