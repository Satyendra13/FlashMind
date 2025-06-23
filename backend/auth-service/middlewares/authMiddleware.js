const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const logger = require("../config/logger");

const authMiddleware = async (req, res, next) => {
	try {
		const token = req.header("Authorization")?.replace("Bearer ", "");

		if (!token) {
			logger.warn("Authorization denied: No token provided", { ip: req.ip });
			return res
				.status(401)
				.json({ message: "No token, authorization denied" });
		}

		const decoded = jwt.verify(
			token,
			process.env.JWT_SECRET || "your-secret-key"
		);
		const user = await User.findById(decoded.userId).select("-passwordHash");

		if (!user) {
			logger.warn("Authorization denied: Invalid token, user not found", {
				userId: decoded.userId,
			});
			return res.status(401).json({ message: "Token is not valid" });
		}

		req.user = user;
		next();
	} catch (error) {
		logger.error("Authorization error: Invalid token", {
			error: error.message,
		});
		res.status(401).json({ message: "Token is not valid" });
	}
};

module.exports = authMiddleware;
