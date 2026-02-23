import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import './src/model/connect.js';
import userRoutes from './src/routes/user.route.js';
import accessmentRoutes from './src/routes/accessment.route.js';
import { CreateUsersTable } from './src/controllers/user.controller.js';
import { CreateAccessmentsTable } from './src/controllers/accessment.controller.js';

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

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
