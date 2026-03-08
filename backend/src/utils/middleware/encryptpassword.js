import bcrypt from 'bcrypt';

export async function encryptPassword(password) {
    const salt = await bcrypt.genSalt(10);
    const hashedpassword = await bcrypt.hash(password, salt);
    return {
        password: hashedpassword
    };

}