import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import './src/model/connect.js';
import { authKey } from './src/utils/middleware/authkey.js';

// Import routes and controllers
import userRoutes from './src/routes/user.route.js';
import accessmentRoutes from './src/routes/accessment.route.js';
import escalationRoutes from './src/routes/escalation.route.js';
import statusLogRoutes from './src/routes/statusLog.route.js';
import feedbackRoutes from './src/routes/feedback.route.js';
import OrganizationRouter from './src/routes/organization.route.js';
import DepartmentRouter from './src/routes/department.route.js';
import notificationRoutes from './src/routes/notification.route.js';
import complaintRoutes from './src/routes/complaint.route.js';

//imported table if not exist
import { CreateUsersTable } from './src/controllers/user.controller.js';
import { CreateAccessmentsTable } from './src/controllers/accessment.controller.js';
import { CreateEscalationsTable } from './src/controllers/escalation.controller.js';
import { CreateStatusLogsTable } from './src/controllers/statusLog.controller.js';
import { CreateOrganizationTable } from './src/controllers/organization.controller.js';
import { CreateDepartmentTable } from './src/controllers/department.controller.js';
import { CreateComplaintTable } from './src/controllers/complaint.controller.js';
import { CreateFeedbackTable } from './src/controllers/feedback.controller.js';
import { CreateNotificationsTable } from './src/controllers/notification.controller.js';

//env
dotenv.config();

//app
const app = express();
app.use(cors());
app.use(express.json());

//route
app.use('/api/users', authKey, userRoutes);
app.use('/api/accessments', authKey, accessmentRoutes);
app.use('/api/escalations', authKey, escalationRoutes);
app.use('/api/status-logs', authKey, statusLogRoutes);
app.use('/api/feedback', authKey, feedbackRoutes);
app.use('/api/organization', authKey, OrganizationRouter);
app.use('/api/department', authKey, DepartmentRouter);
app.use('/api/notification', authKey, notificationRoutes);
app.use('/api/complaint', authKey, complaintRoutes);
app.get('/', (req, res) => {
  res.send('Digital Complaint Management System API');
});
CreateUsersTable();
CreateAccessmentsTable();
CreateEscalationsTable();
CreateStatusLogsTable();
CreateFeedbackTable();
CreateNotificationsTable();
CreateOrganizationTable();
CreateDepartmentTable();
CreateComplaintTable();


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
