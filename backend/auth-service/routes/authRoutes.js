const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const {
	registerValidator,
	loginValidator,
	forgotPasswordValidator,
	resetPasswordValidator,
} = require("../middlewares/validationMiddleware");
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/register", registerValidator, authController.register);
router.post("/login", loginValidator, authController.login);
router.get("/verify-email/:token", authController.verifyEmail);
router.post(
	"/forgot-password",
	forgotPasswordValidator,
	authController.forgotPassword
);
router.post(
	"/reset-password",
	resetPasswordValidator,
	authController.resetPassword
);
router.post("/logout", authMiddleware, authController.logout);

module.exports = router;
