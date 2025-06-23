const { body, validationResult } = require("express-validator");

const handleValidationErrors = (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ message: errors.array()[0].msg });
	}
	next();
};

const registerValidator = [
	body("firstName")
		.trim()
		.isLength({ min: 1 })
		.withMessage("First name is required"),
	body("lastName")
		.trim()
		.isLength({ min: 1 })
		.withMessage("Last name is required"),
	body("email").isEmail().withMessage("Please provide a valid email"),
	body("password")
		.isLength({ min: 8 })
		.withMessage("Password must be at least 8 characters long"),
	handleValidationErrors,
];

const loginValidator = [
	body("email").isEmail().withMessage("Please provide a valid email"),
	body("password").exists().withMessage("Password is required"),
	handleValidationErrors,
];

const forgotPasswordValidator = [
	body("email").isEmail().withMessage("Please provide a valid email"),
	handleValidationErrors,
];

const resetPasswordValidator = [
	body("token").exists().withMessage("Reset token is required"),
	body("newPassword")
		.isLength({ min: 8 })
		.withMessage("Password must be at least 8 characters long"),
	handleValidationErrors,
];

const updateProfileValidator = [
	body("firstName")
		.trim()
		.isLength({ min: 1 })
		.withMessage("First name is required"),
	body("lastName")
		.trim()
		.isLength({ min: 1 })
		.withMessage("Last name is required"),
	body("email").isEmail().withMessage("Please provide a valid email"),
	handleValidationErrors,
];

const changePasswordValidator = [
	body("currentPassword").exists().withMessage("Current password is required"),
	body("newPassword")
		.isLength({ min: 8 })
		.withMessage("New password must be at least 8 characters long"),
	handleValidationErrors,
];

module.exports = {
	registerValidator,
	loginValidator,
	forgotPasswordValidator,
	resetPasswordValidator,
	updateProfileValidator,
	changePasswordValidator,
};
