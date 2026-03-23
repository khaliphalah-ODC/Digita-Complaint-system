import Joi from 'joi';

const passwordPolicy = Joi.string()
  .min(8)
  .max(64)
  .pattern(new RegExp('(?=.*[a-z])'))
  .pattern(new RegExp('(?=.*[A-Z])'))
  .pattern(new RegExp('(?=.*\\d)'))
  .pattern(new RegExp('(?=.*[@$!%*?&^#()[\\]{}\\-_=+])'))
  .messages({
    'string.pattern.base': 'Password must contain uppercase, lowercase, number and special character.'
  });

// Used for standard /register route
export const passwordOnlySchema = Joi.object({
  full_name: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  password: passwordPolicy.required(),
});

// Used for /join/register route — includes join_code
export const joinRegisterSchema = Joi.object({
  full_name: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  password: passwordPolicy.required(),
  join_code: Joi.string().min(3).required(),
  department_id: Joi.number().integer().optional().allow(null),
});

export const emailVerificationSchema = Joi.object({
  email: Joi.string().email().required(),
  token: Joi.string().uuid({ version: 'uuidv4' }).required()
});

export const emailOnlySchema = Joi.object({
  email: Joi.string().email().required()
});



export const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  token: Joi.string().uuid({ version: 'uuidv4' }).required(),
  new_password: passwordPolicy.required()
});

export const changePasswordSchema = Joi.object({
  current_password: Joi.string().required(),
  new_password: passwordPolicy.required()
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

export const userCreateSchema = Joi.object({
  full_name: Joi.string().trim().min(3).max(120).required(),
  email: Joi.string().email().required(),
  password: passwordPolicy.required(),
  status: Joi.string().valid('active', 'inactive').optional(),
  role: Joi.string().valid('user', 'org_admin').optional(),
  organization_id: Joi.number().integer().optional().allow(null),
  department_id: Joi.number().integer().optional().allow(null)
});