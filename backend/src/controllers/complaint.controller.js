import complainDB from "../model/connect.js";
import { Complaint, insertComplaint, selectComplaint, selectComplaintById } from "../model/complaint.model.js";

const createComplaintTable = complainDB.run(Complaint, (err) => {
    if (err) {
        console.error('Could not create table', err);
    } else {
        console.log('Table created or already exists');
    }
});


const createNewComplaint = (req, res) => {
    const { complaint } = req.body;
    complainDB.run(insertComplaint, [complaint], (err) => {
        if (err) {
            console.error('Could not insert complaint', err);
            res.status(500).send('Error creating complaint');
        } else {
            console.log('Complaint inserted successfully');
            res.send('Complaint created successfully');
        }
    })
}


const getAllComplaint = (req, res) => {
    complainDB.all(selectComplaint, [], (err, rows) => {
        if (err) {
            console.error('Could not fetch complaints', err);
            res.status(500).send('Error fetching complaints');
        } else {
            res.json(rows);
        }
    });
}

const getById = (req, res) => {
    const { id } = req.params;
    complainDB.get(selectComplaintById, [id], (err, row) => {
        if (err) {
            console.error('Could not fetch complaint', err);
            res.status(500).send('Error fetching complaint');
        } else {
            res.json(row);
        }
    });
}

export { createComplaintTable, createNewComplaint, getAllComplaint, getById };