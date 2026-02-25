import complainDB from "../model/connect.js";
import { Organization, insertOrganization, selectOrganizations, selectOrganizationById } from "../model/organization.model.js";


const createOrganizationTable = complainDB.run(Organization, (err) => {
    if (err) {
        console.error('Could not create table', err);
    } else {
        console.log('Table created or already exists');
    }
});


const createNewOrganization = (req, res) => {
    const { name, organization_type, email, phone, address, logo, status } = req.body;
    complainDB.run(insertOrganization, [name, organization_type, email, phone, address, logo, status], (err) => {
        if (err) {
            console.error('Could not insert organization', err);
            res.status(500).send('Error creating organization');
        } else {
            console.log('Organization inserted successfully');
            //res.send('Organization created successfully');
            res.json({ message: 'Organization created successfully', organization_type, name, email, phone, address, logo, status });
        }
    })
}


const getAllOrganization = (req, res) => {
    complainDB.all(selectOrganizations, [], (err, rows) => {
        if (err) {
            console.error('Could not fetch organizations', err);
            res.status(500).send('Error fetching organizations');
        } else {
            res.json(rows);
        }
    });
}

const getById = (req, res) => {
    const { id } = req.params;
    complainDB.get(selectOrganizationById, [id], (err, row) => {
        if (err) {
            console.error('Could not fetch organization', err);
            res.status(500).send('Error fetching organization');
        } else {
            res.json(row);
        }
    });
}


export { createOrganizationTable, createNewOrganization, getAllOrganization, getById };