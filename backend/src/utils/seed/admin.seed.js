import bcrypt from "bcrypt";
import complaintDB from '../../model/connect.js';

const createAdmin = async () => {
    const hashedPassword = await bcrypt.hash("Admin@123", 10);

    await complaintDB.run(`
    INSERT INTO users (
      organization_id,
      full_name,
      email,
      password,
      role
    )
    VALUES (
      1,
      'Main Admin',
      'admin@org.com',
      '${hashedPassword}',
      'admin'
    )
  `);

    console.log("Admin created");
};

createAdmin();