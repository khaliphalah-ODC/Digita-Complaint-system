import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
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
import complaintMessageRoutes from './src/routes/complaintMessage.route.js';
import testimonialRoutes from './src/routes/testimonial.route.js';
import verifyToken from './src/middleware/verifyToken.js';
import { getPublicOrganizationOptions } from './src/controllers/organization.controller.js';
import { getPublicDepartmentsByOrganization } from './src/controllers/department.controller.js';

//imported table if not exist
import {
  CreateUsersTable,
  CreateRevokedTokensTable,
  CreatePasswordResetTokensTable
} from './src/controllers/user.controller.js';
import { CreateAuditLogsTable } from './src/controllers/audit.controller.js';
import { CreateAccessmentsTable } from './src/controllers/accessment.controller.js';
import { CreateEscalationsTable } from './src/controllers/escalation.controller.js';
import { CreateStatusLogsTable } from './src/controllers/statusLog.controller.js';
import { CreateOrganizationTable } from './src/controllers/organization.controller.js';
import { CreateDepartmentTable } from './src/controllers/department.controller.js';
import { CreateComplaintTable } from './src/controllers/complaint.controller.js';
import { CreateFeedbackTable } from './src/controllers/feedback.controller.js';
import { CreateNotificationsTable } from './src/controllers/notification.controller.js';
import { CreateComplaintMessagesTable } from './src/controllers/complaintMessage.controller.js';
import { CreateTestimonialsTable } from './src/controllers/testimonial.controller.js';

//app
const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));


app.use('/api/users', userRoutes);
app.use('/api/accessments', verifyToken, accessmentRoutes);
app.use('/api/escalations', verifyToken, escalationRoutes);
app.use('/api/status-logs', verifyToken, statusLogRoutes);
app.use('/api/feedback', verifyToken, feedbackRoutes);
app.use('/api/organization', verifyToken, OrganizationRouter);
app.use('/api/organizations', verifyToken, OrganizationRouter);
app.use('/api/department', verifyToken, DepartmentRouter);
app.use('/api/notification', verifyToken, notificationRoutes);
app.use('/api/complaint', complaintRoutes);
app.use('/api/complaint-messages', verifyToken, complaintMessageRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.get('/api/public/organizations', getPublicOrganizationOptions);
app.get('/api/public/organizations/:organizationId/departments', getPublicDepartmentsByOrganization);


app.get('/', (req, res) => {
  res.send('Digital Complaint Management System API');
});

let didInitializeDatabase = false;
let activeServer = null;

export const initializeDatabase = () => {
  if (didInitializeDatabase) {
    return;
  }

  didInitializeDatabase = true;
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
  CreateComplaintMessagesTable();
  CreatePasswordResetTokensTable();
  CreateAuditLogsTable();
  CreateTestimonialsTable();

};

initializeDatabase();

export const startServer = (port = process.env.PORT || 5000) => {
  if (activeServer?.listening) {
    return activeServer;
  }

  activeServer = app.listen(port, () => {
    const listeningPort = activeServer?.address?.()?.port || port;
    console.log(`Server is running on port ${listeningPort}`);
  });

  activeServer.once('close', () => {
    activeServer = null;
  });

  return activeServer;
};

const currentFilePath = fileURLToPath(import.meta.url);
const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === currentFilePath;

if (isDirectRun) {
  startServer();
}

export default app;
