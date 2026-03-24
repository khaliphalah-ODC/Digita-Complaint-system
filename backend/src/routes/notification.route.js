// notification.route routes: maps API endpoints to controller handlers.
import express from 'express';
import {
  createNotification,
  deleteNotification,
  getAllNotifications,
  markNotificationAsRead
} from '../controllers/notification.controller.js';

const router = express.Router();

router.post('/', createNotification);
router.get('/', getAllNotifications);
router.patch('/:id/read', markNotificationAsRead);
router.delete('/:id', deleteNotification);

export default router;
