import Joi from "joi";

export const registerSchema = Joi.object({
    organization_id: Joi.number().required(),

    full_name: Joi.string()
        .min(3)
        .max(100)
        .required(),

    email: Joi.string()
        .email()
        .required(),

    password: Joi.string()
        .min(8)
        .max(20)
        .pattern(new RegExp("(?=.*[a-z])")) // lowercase
        .pattern(new RegExp("(?=.*[A-Z])")) // uppercase
        .pattern(new RegExp("(?=.*\\d)"))   // number
        .pattern(new RegExp("(?=.*[@$!%*?&^#()[\\]{}\\-_=+])")) // symbol
        .required()
        .messages({
            "string.pattern.base":
                "Password must contain uppercase, lowercase, number and special character.",
        }),
});

export const validate = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }

        next();
    };
};