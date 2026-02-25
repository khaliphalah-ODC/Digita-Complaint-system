import router from 'express';
import { createNewComplaint, getAllComplaint } from '../controllers/complaint.controller.js';

const ComplaintRouter = router();

ComplaintRouter.route('/')
    .get(getAllComplaint)
    .post(createNewComplaint)

export { ComplaintRouter };