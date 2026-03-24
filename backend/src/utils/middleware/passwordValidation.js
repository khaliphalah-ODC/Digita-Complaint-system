import Joi from 'joi';
import complaintDB from '../../model/connect.js';
import { selectPlatformSettings } from '../../model/platformSettings.model.js';

const getPlatformSettings = () =>
  new Promise((resolve) => {
    complaintDB.get(selectPlatformSettings, [], (err, row) => {
      if (err) return resolve(null);
      return resolve(row || null);
    });
  });

const buildPasswordPolicy = (minLength = 8) => Joi.string()
  .min(minLength)
  .max(64)
  .pattern(new RegExp('(?=.*[a-z])'))
  .pattern(new RegExp('(?=.*[A-Z])'))
  .pattern(new RegExp('(?=.*\\d)'))
  .pattern(new RegExp('(?=.*[@$!%*?&^#()[\\]{}\\-_=+])'))
  .messages({
    'string.pattern.base': 'Password must contain uppercase, lowercase, number and special character.'
  });

const buildPasswordOnlySchema = (minLength) => Joi.object({
  password: buildPasswordPolicy(minLength).required()
});

export const emailVerificationSchema = Joi.object({
  email: Joi.string().email().required(),
  token: Joi.string().uuid({ version: 'uuidv4' }).required()
});

export const emailOnlySchema = Joi.object({
  email: Joi.string().email().required()
});

export const changeEmailSchema = Joi.object({
  new_email: Joi.string().email().required(),
  current_password: Joi.string().required()
});



const buildResetPasswordSchema = (minLength) => Joi.object({
  email: Joi.string().email().required(),
  code: Joi.string().pattern(/^\d{6}$/).required().messages({
    'string.pattern.base': 'Reset code must be a 6-digit number.'
  }),
  new_password: buildPasswordPolicy(minLength).required()
});

const buildChangePasswordSchema = (minLength) => Joi.object({
  current_password: Joi.string().required(),
  new_password: buildPasswordPolicy(minLength).required()
});

export const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    next();
  };
};

export const validateWithPlatformSettings = (schemaFactory) => {
  return async (req, res, next) => {
    const settings = await getPlatformSettings();
    const minLength = Number(settings?.password_min_length || 8);
    const schema = schemaFactory(minLength);
    const { error } = schema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    next();
  };
};

export const userCreateSchemaFactory = (minLength) => Joi.object({
  full_name: Joi.string().trim().min(3).max(120).required(),
  email: Joi.string().email().required(),
  password: buildPasswordPolicy(minLength).required(),
  status: Joi.string().valid('active', 'inactive').optional(),
  role: Joi.string().valid('user', 'org_admin').optional(),
  organization_id: Joi.number().integer().optional().allow(null),
  department_id: Joi.number().integer().optional().allow(null)
});

export const registerWithJoinCodeSchemaFactory = (minLength) => Joi.object({
  full_name: Joi.string().trim().min(3).max(120).required(),
  email: Joi.string().email().required(),
  password: buildPasswordPolicy(minLength).required(),
  join_code: Joi.string().trim().min(4).max(64).required(),
  department_id: Joi.number().integer().optional().allow(null)
});

export const passwordOnlySchemaFactory = buildPasswordOnlySchema;
export const resetPasswordSchemaFactory = buildResetPasswordSchema;
export const changePasswordSchemaFactory = buildChangePasswordSchema;
