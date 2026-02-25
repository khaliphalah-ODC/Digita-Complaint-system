import exppress from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import './src/model/connect.js';

// Organization Route
import { OrganizationRouter } from './src/routes/organization.route.js';
import { createOrganizationTable } from './src/controllers/organization.controller.js';

// Department Route
import { DepartmentRouter } from './src/routes/department.route.js';
import { createDepartmentTable } from './src/controllers/department.controller.js';


dotenv.config();

const app = exppress();


app.use(cors());
app.use(exppress.json());


app.get('/', (req, res) => {
    res.send('Digital Complaint Management System API');
});


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