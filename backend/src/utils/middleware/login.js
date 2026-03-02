
import bcrypt from 'bcrypt';
import complaintDB from "../../model/connect.js";

export const login = (req, res) => {
    const { email, password } = req.body;

    complaintDB.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
        if (err) {
            console.error('Could not fetch user', err);
            return res.status(500).json({ message: 'Error fetching user' });
        }

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const valid = bcrypt.compareSync(password, user.password);
        if (!valid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        res.status(200).json({
            message: 'Login successful',
        });
    });
};
