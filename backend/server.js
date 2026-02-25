import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import './src/model/connect.js';

import userRoutes from './src/routes/user.route.js';
import accessmentRoutes from './src/routes/accessment.route.js';


import { CreateUsersTable } from './src/controllers/user.controller.js';
import { CreateAccessmentsTable } from './src/controllers/accessment.controller.js';

// Organization Route
import { OrganizationRouter } from './src/routes/organization.route.js';
import { createOrganizationTable } from './src/controllers/organization.controller.js';

// Department Route
import { DepartmentRouter } from './src/routes/department.route.js';
import { createDepartmentTable } from './src/controllers/department.controller.js';

import { ComplaintRouter } from './src/routes/complaint.route.js';
import { createComplaintTable } from './src/controllers/complaint.controller.js';





dotenv.config();

const app = express();


app.use(cors());
app.use(express.json());



app.get('/', (req, res) => {
    res.send('Digital Complaint Management System API');
});

app.use('/api/users', userRoutes);
app.use('/api/accessments', accessmentRoutes);

CreateUsersTable();
CreateAccessmentsTable();


const PORT = process.env.PORT || 5000;

// Organization Route
createOrganizationTable;
app.use("/api/organization", OrganizationRouter);

createComplaintTable;
app.use("/api/complaint", ComplaintRouter);

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