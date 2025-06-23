const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const logger = require("../config/logger");
const {
	sendVerificationEmail,
	sendPasswordResetEmail,
} = require("../services/emailService");

const generateToken = (userId) => {
	return jwt.sign({ userId }, process.env.JWT_SECRET || "your-secret-key", {
		expiresIn: "7d",
	});
};

exports.register = async (req, res) => {
	try {
		const { firstName, lastName, email, password, confirmPassword } = req.body;

		if (password !== confirmPassword) {
			return res.status(400).json({ message: "Passwords do not match" });
		}

		const existingUser = await User.findOne({ email });
		if (existingUser) {
			logger.warn("Registration attempt with existing email", { email });
			return res
				.status(400)
				.json({ message: "User already exists with this email" });
		}

		const emailVerificationToken = crypto.randomBytes(32).toString("hex");

		const user = new User({
			firstName,
			lastName,
			email,
			passwordHash: password,
			emailVerificationToken,
		});

		await user.save();
		logger.info("User registered successfully", { userId: user._id, email });

		await sendVerificationEmail(email, emailVerificationToken);

		res.status(201).json({
			message:
				"User registered successfully. Please check your email to verify your account.",
			user: {
				id: user._id,
				firstName: user.firstName,
				lastName: user.lastName,
				email: user.email,
			},
		});
	} catch (error) {
		logger.error("Registration error", { error: error.message });
		res.status(500).json({ message: "Server error during registration" });
	}
};

exports.login = async (req, res) => {
	try {
		const { email, password } = req.body;

		const user = await User.findOne({ email });
		if (!user) {
			logger.warn("Login attempt for non-existent user", { email });
			return res.status(400).json({ message: "Invalid credentials" });
		}

		if (!user.emailVerified) {
			logger.warn("Login attempt with unverified email", { email });
			return res
				.status(400)
				.json({ message: "Please verify your email before logging in" });
		}

		const isMatch = await user.comparePassword(password);
		if (!isMatch) {
			logger.warn("Login attempt with incorrect password", { email });
			return res.status(400).json({ message: "Invalid credentials" });
		}

		user.lastLogin = new Date();
		await user.save();

		const token = generateToken(user._id);

		logger.info("User logged in successfully", { userId: user._id, email });

		res.json({
			token,
			user: {
				id: user._id,
				firstName: user.firstName,
				lastName: user.lastName,
				email: user.email,
				emailVerified: user.emailVerified,
			},
		});
	} catch (error) {
		logger.error("Login error", { error: error.message });
		res.status(500).json({ message: "Server error during login" });
	}
};

exports.verifyEmail = async (req, res) => {
	try {
		const { token } = req.params;

		const user = await User.findOne({ emailVerificationToken: token });
		if (!user) {
			logger.warn("Email verification attempt with invalid token", { token });
			return res
				.status(400)
				.json({ message: "Invalid or expired verification token" });
		}

		user.emailVerified = true;
		user.emailVerificationToken = undefined;
		await user.save();
		logger.info("Email verified successfully", {
			userId: user._id,
			email: user.email,
		});

		res.json({ message: "Email verified successfully" });
	} catch (error) {
		logger.error("Email verification error", { error: error.message });
		res.status(500).json({ message: "Server error during email verification" });
	}
};

exports.forgotPassword = async (req, res) => {
	try {
		const { email } = req.body;
		const user = await User.findOne({ email });
		if (!user) {
			logger.warn("Forgot password request for non-existent user", { email });
			return res
				.status(400)
				.json({ message: "No user found with this email address" });
		}

		const resetToken = crypto.randomBytes(32).toString("hex");
		user.passwordResetToken = resetToken;
		user.passwordResetExpires = Date.now() + 3600000;
		await user.save();
		logger.info("Password reset token generated", { userId: user._id, email });

		await sendPasswordResetEmail(email, resetToken);

		res.json({ message: "Password reset link sent to your email" });
	} catch (error) {
		logger.error("Forgot password error", { error: error.message });
		res
			.status(500)
			.json({ message: "Server error during password reset request" });
	}
};

exports.resetPassword = async (req, res) => {
	try {
		const { token, newPassword, confirmPassword } = req.body;

		if (newPassword !== confirmPassword) {
			return res.status(400).json({ message: "Passwords do not match" });
		}

		const user = await User.findOne({
			passwordResetToken: token,
			passwordResetExpires: { $gt: Date.now() },
		});

		if (!user) {
			logger.warn("Password reset attempt with invalid or expired token", {
				token,
			});
			return res
				.status(400)
				.json({ message: "Invalid or expired reset token" });
		}

		user.passwordHash = newPassword;
		user.passwordResetToken = undefined;
		user.passwordResetExpires = undefined;
		await user.save();
		logger.info("Password reset successful", {
			userId: user._id,
			email: user.email,
		});

		res.json({ message: "Password reset successful" });
	} catch (error) {
		logger.error("Reset password error", { error: error.message });
		res.status(500).json({ message: "Server error during password reset" });
	}
};

exports.logout = async (req, res) => {
	try {
		logger.info("User logged out successfully", { userId: req.user._id });
		res.json({ message: "Logged out successfully" });
	} catch (error) {
		logger.error("Logout error", {
			error: error.message,
			userId: req.user._id,
		});
		res.status(500).json({ message: "Server error during logout" });
	}
};
