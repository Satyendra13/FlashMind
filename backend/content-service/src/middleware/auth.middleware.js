const jwt = require("jsonwebtoken");
const config = require("../config");
const logger = require("../utils/logger");

const authMiddleware = async (req, res, next) => {
	try {
		const token = req.header("Authorization")?.replace("Bearer ", "");
		if (!token) {
			logger.warn("Authorization denied: No token provided.");
			return res
				.status(401)
				.json({ message: "No token, authorization denied" });
		}

		const decoded = jwt.verify(token, config.jwtSecret);
		req.userId = decoded.userId;
		logger.info(`Authenticated user: ${req.userId}`);
		next();
	} catch (error) {
		logger.error({ message: "Token validation failed", error: error.message });
		res.status(401).json({ message: "Token is not valid" });
	}
};

module.exports = authMiddleware;
