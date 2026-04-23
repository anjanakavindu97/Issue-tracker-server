import { check } from "express-validator";

export const Validations = {
    name: () => check('name').isString().isLength({max: 1000}).withMessage('Name field should not be more than 1000 chars long!'),
    phone: () => check('phone').not().isEmpty().withMessage('Phone Number is required!'),
    email: () => check('email').not().isEmpty().withMessage('Email is required!').isEmail().normalizeEmail({ gmail_remove_dots: false}).withMessage('Invalid email address!'),
    password: () => check('password').not().isEmpty().withMessage('Password is required!').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long!'),
}