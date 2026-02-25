import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import './src/model/connect.js';


// Import routes
import userRoutes from './src/routes/user.route.js';
import accessmentRoutes from './src/routes/accessment.route.js';
import escalationRoutes from './src/routes/escalation.route.js';
import statusLogRoutes from './src/routes/statusLog.route.js';
import  DepartmentRouter from './src/routes/department.route.js';
import OrganizationRouter from './src/routes/organization.route.js';


// Import organization and department routes and controllers
import { CreateUsersTable } from './src/controllers/user.controller.js';
import { CreateAccessmentsTable } from './src/controllers/accessment.controller.js';
import { CreateEscalationsTable } from './src/controllers/escalation.controller.js';
import { CreateStatusLogsTable } from './src/controllers/statusLog.controller.js';
import { createOrganizationTable } from './src/controllers/organization.controller.js';
import { createDepartmentTable } from './src/controllers/department.controller.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

//middleware
app.use(cors());
app.use(express.json());

// Basic route to test server
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


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
