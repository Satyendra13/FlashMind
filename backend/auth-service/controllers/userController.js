const User = require("../models/userModel");
const logger = require("../config/logger");

exports.getProfile = async (req, res) => {
	try {
		logger.info("Profile fetched", { userId: req.user._id });
		res.json({ user: req.user });
	} catch (error) {
		logger.error("Profile fetch error", {
			error: error.message,
			userId: req.user._id,
		});
		res.status(500).json({ message: "Server error fetching profile" });
	}
};

exports.updateProfile = async (req, res) => {
	try {
		const { firstName, lastName, email } = req.body;

		if (email !== req.user.email) {
			const existingUser = await User.findOne({ email });
			if (existingUser) {
				logger.warn("Profile update failed: email already in use", {
					userId: req.user._id,
					email,
				});
				return res.status(400).json({ message: "Email already in use" });
			}
		}

		const user = await User.findByIdAndUpdate(
			req.user._id,
			{ firstName, lastName, email },
			{ new: true, select: "-passwordHash" }
		);

		logger.info("Profile updated successfully", { userId: req.user._id });
		res.json({ user });
	} catch (error) {
		logger.error("Profile update error", {
			error: error.message,
			userId: req.user._id,
		});
		res.status(500).json({ message: "Server error updating profile" });
	}
};

exports.changePassword = async (req, res) => {
	try {
		const { currentPassword, newPassword, confirmPassword } = req.body;

		if (newPassword !== confirmPassword) {
			return res.status(400).json({ message: "New passwords do not match" });
		}

		const user = await User.findById(req.user._id);
		const isMatch = await user.comparePassword(currentPassword);

		if (!isMatch) {
			logger.warn("Password change failed: incorrect current password", {
				userId: req.user._id,
			});
			return res.status(400).json({ message: "Current password is incorrect" });
		}

		user.passwordHash = newPassword;
		await user.save();
		logger.info("Password changed successfully", { userId: req.user._id });

		res.json({ message: "Password changed successfully" });
	} catch (error) {
		logger.error("Change password error", {
			error: error.message,
			userId: req.user._id,
		});
		res.status(500).json({ message: "Server error changing password" });
	}
};

// Admin: Get all users
exports.getAllUsers = async (req, res) => {
	try {
		const users = await User.find({}, "-passwordHash");
		res.json(users);
	} catch (error) {
		res.status(500).json({ message: "Server error fetching users" });
	}
};

// Admin: Get a single user by ID
exports.getUserById = async (req, res) => {
	try {
		const user = await User.findById(req.params.id, "-passwordHash");
		if (!user) return res.status(404).json({ message: "User not found" });
		res.json(user);
	} catch (error) {
		res.status(500).json({ message: "Server error fetching user" });
	}
};
