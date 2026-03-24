import jwt from 'jsonwebtoken';
import complaintDB from '../model/connect.js';
import { fetchUserByIdQuery } from '../model/user.model.js';
import { selectPlatformSettings } from '../model/platformSettings.model.js';

const getJwtSecret = () => process.env.JWT_SECRET_KEY || process.env.JWT_KEY || process.env.JWT_SECRET || 'evn';
const getJwtExpiresIn = () => process.env.JWT_EXPIRES_IN || '1d';

const getUserById = (userId) =>
  new Promise((resolve, reject) => {
    complaintDB.get(fetchUserByIdQuery, [userId], (err, row) => {
      if (err) return reject(err);
      return resolve(row || null);
    });
  });

const getPlatformSettings = () =>
  new Promise((resolve) => {
    complaintDB.get(selectPlatformSettings, [], (err, row) => {
      if (err) return resolve(null);
      return resolve(row || null);
    });
  });

const generateToken = async (userId) => {
  const JWT_SECRET = getJwtSecret();
  const settings = await getPlatformSettings();
  const ttlMinutes = Number(settings?.session_ttl_minutes || 0);
  const JWT_EXPIRES_IN = ttlMinutes > 0 ? `${ttlMinutes}m` : getJwtExpiresIn();

  if (!JWT_SECRET) {
    throw new Error('JWT secret is not defined');
  }

  const user = await getUserById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      organization_id: user.organization_id,
      must_change_password: Number(user.must_change_password || 0)
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

export default generateToken;
