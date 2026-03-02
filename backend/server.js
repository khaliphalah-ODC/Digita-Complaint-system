import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import './src/model/connect.js';

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
import { authenticateToken } from './src/middleware/auth.middleware.js';

//imported table if not exist
import { CreateUsersTable, CreateRevokedTokensTable } from './src/controllers/user.controller.js';
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
app.use('/api/users', userRoutes);
app.use('/api/accessments', authenticateToken, accessmentRoutes);
app.use('/api/escalations', authenticateToken, escalationRoutes);
app.use('/api/status-logs', authenticateToken, statusLogRoutes);
app.use('/api/feedback', authenticateToken, feedbackRoutes);
app.use('/api/organization', authenticateToken, OrganizationRouter);
app.use('/api/department', authenticateToken, DepartmentRouter);
app.use('/api/notification', authenticateToken, notificationRoutes);
app.use('/api/complaint', complaintRoutes);
app.get('/', (req, res) => {
  res.send('Digital Complaint Management System API');
});

//table creation

CreateUsersTable();
CreateRevokedTokensTable();
CreateAccessmentsTable();
CreateEscalationsTable();
CreateStatusLogsTable();
CreateFeedbackTable();
CreateNotificationsTable();
CreateOrganizationTable();
CreateDepartmentTable();
CreateComplaintTable();

//env port
const PORT = process.env.PORT || 5000;

//start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
