const rateLimit = require("express-rate-limit");
const logger = require("../utils/logger");

const rateLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 100,
	message: "Too many requests from this IP, please try again later.",
	handler: (req, res, next, options) => {
		logger.warn(
			`Rate limit exceeded for IP: ${req.ip}. Message: ${options.message}`
		);
		res.status(options.statusCode).send(options.message);
	},
});

module.exports = { rateLimiter };
