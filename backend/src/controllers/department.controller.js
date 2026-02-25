import complainDB from "../model/connect.js";
import { Department, insertDepartment, selectDepartments, selectDepartmentById } from "../model/department.model.js";

const createDepartmentTable = complainDB.run(Department, (err) => {
    if (err) {
        console.error('Could not create table', err);
    } else {
        console.log('Table created or already exists');
    }
});


const createNewDepartment = (req, res) => {
    const { organization_id, name, description, accessment_id } = req.body;
    complainDB.run(insertDepartment, [organization_id, name, description, accessment_id], (err) => {
        if (err) {
            console.error('Could not insert department', err);
            res.status(500).send('Error creating department');
        } else {
            console.log('Department inserted successfully');
            res.send('Department created successfully');
        }
    })
}


const getAllDepartment = (req, res) => {
    complainDB.all(selectDepartments, [], (err, rows) => {
        if (err) {
            console.error('Could not fetch departments', err);
            res.status(500).send('Error fetching departments');
        } else {
            res.json(rows);
        }
    });
}

const getById = (req, res) => {
    const { id } = req.params;
    complainDB.get(selectDepartmentById, [id], (err, row) => {
        if (err) {
            console.error('Could not fetch organization', err);
            res.status(500).send('Error fetching organization');
        } else {
            res.json(row);
        }
    });
}

export { createDepartmentTable, createNewDepartment, getAllDepartment, getById };