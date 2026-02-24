import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import './src/model/connect.js';
import StatusLogRouter from './src/routes/statusLog.route.js';

dotenv.config();

const app = express();
app.use('/api', StatusLogRouter);

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Digital Complaint Management System API');
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});