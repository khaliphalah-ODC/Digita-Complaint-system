import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import './src/model/connect.js';


// Import routes
import userRoutes from './src/routes/user.route.js';
import accessmentRoutes from './src/routes/accessment.route.js';
import { CreateUsersTable } from './src/controllers/user.controller.js';
import { CreateAccessmentsTable } from './src/controllers/accessment.controller.js';
import { CreateEscalationsTable } from './src/controllers/escalation.controller.js';
import { CreateStatusLogsTable } from './src/controllers/statusLog.controller.js';
import { createOrganizationTable } from './src/controllers/organization.controller.js';
import { createDepartmentTable } from './src/controllers/department.controller.js';

import { ComplaintRouter } from './src/routes/complaint.route.js';
import { createComplaintTable } from './src/controllers/complaint.controller.js';





//Notification Route
import {notificationRouter} from './src/routes/notification.route.js';
import {notice} from './src/controllers/notification.controller.js';


import StatusLogRouter from './src/routes/statusLog.route.js';

dotenv.config();

// Initialize Express app
const app = express();

//middleware
app.use(cors());
app.use(express.json());

app.use('/api', StatusLogRouter);

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Digital Complaint Management System API');
});


// Use routes for different endpoints
app.use('/api/users', userRoutes);
app.use('/api/accessments', accessmentRoutes);
app.use('/api/escalations', escalationRoutes);
app.use('/api/status-logs', statusLogRoutes);
app.use("/api/organization", OrganizationRouter);
app.use("/api/department", DepartmentRouter);


// Create tables if they don't exist
CreateUsersTable();
CreateAccessmentsTable();
CreateEscalationsTable();
CreateStatusLogsTable();
createOrganizationTable
createDepartmentTable

// Set the port from environment variable or default to 5000
const PORT = process.env.PORT || 5000;

// Organization Route
createOrganizationTable;
app.use("/api/organization", OrganizationRouter);

// Department Route
createDepartmentTable;
app.use("/api/department", DepartmentRouter);


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


// import userRoutes from './src/routes/user.route.js';
// import accessmentRoutes from './src/routes/accessment.route.js';
// import { CreateUsersTable } from './src/controllers/user.controller.js';
// import { CreateAccessmentsTable } from './src/controllers/accessment.controller.js';
// // Organization Route
// import { OrganizationRouter } from './src/routes/organization.route.js';
// import { createOrganizationTable } from './src/controllers/organization.controller.js';
// // Department Route
// import { DepartmentRouter } from './src/routes/department.route.js';
// import { createDepartmentTable } from './src/controllers/department.controller.js';
// // Status Log Route
// import StatusLogRouter from './src/routes/statusLog.route.js';

// dotenv.config();
// const app = express();

// app.use('/api', StatusLogRouter);
// app.use(cors());
// app.use(express.json());