import bcrypt from 'bcrypt';
import { sendError } from '../utils/response.js';

const BCRYPT_HASH_PREFIX = /^\$2[aby]\$\d{2}\$/;

export const passwordEncryption = async (req, res, next) => {
  const hashField = async (fieldName) => {
    const value = req.body?.[fieldName];
    if (!value) return;
    if (typeof value !== 'string') {
      throw new Error(`${fieldName} must be a string`);
    }
    if (BCRYPT_HASH_PREFIX.test(value)) {
      return;
    }
    req.body[fieldName] = await bcrypt.hash(value, 10);
  };

  try {
    await hashField('password');
    await hashField('new_password');
    return next();
  } catch (error) {
    return sendError(res, 500, 'Failed to process password', error.message);
  }
};
