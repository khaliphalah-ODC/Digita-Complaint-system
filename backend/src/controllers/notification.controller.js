import complainDB from '../model/notification.model.js';

import {notification, createNotificationTable, userNotice, complaintByID, deletenotification} from `../model/notification.model.js`;



 const notice = complainDB.run(notification, (err) => {
    if (err) {
        console.error('could not send it notification', err);
    } else {
        console.log('There is no notification');
    }
});

const createNoticeTable = (req, res) => {
     const {user_id, complaint_id, type, message, is_real, creat_at} = req.body;

    if(!complaint_id) return res.status(400).json({err: 'notice is not define'})

    complainDB.run(createNotificationTable, [user_id, complaint_id, type, message, is_real, creat_at], (err) => {
        if (err) {
            console.error('Could not register notification', err);
            res.status(500).send('Error sending notification');
        } else {
            console.log('Notification sent successfully');
            res.send('Notification sent');
        }
    });
}

 const getAllnotifications = (req, res) => {
     complainDB.all(userNotice, [], (err, rows) => {
        if (err) {
            console.error('Could not get notification', err);
            res.status(500).send('Error getting notification');
        } else {
            res.json(rows);
        }
    });
}

const getnotificationById = (req, res) => {
    const {complaintID} = req.params;
    shopdata.get(complaintByID, [complaintID], (err, rows) => {
        if (err) {
            console.error('Could not get notification', err);
            res.status(500).send('Error getting notification');
        } else {
            res.json(rows);
        }
    });
}

const deletecomplainById = (req, res) => {
    const {deletecomplaint} = req.params;
    shopdata.run(deletenotification, [deletecomplaint], function (err) {
        if (err) {
            console.error("Error", err.message);
            res.status(500).send("Error deleting notificaton");
        } else {
            console.log(`A notification has been deleted with the ID ${this.lastID}`);
            res.send(`notification has been deleted successfully`);
        }
    }); 
}

export {notice, createNoticeTable, getAllnotifications, getnotificationById, deletecomplainById};