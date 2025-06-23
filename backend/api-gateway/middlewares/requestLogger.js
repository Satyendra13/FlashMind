const logger = require("../utils/logger");

const requestLogger = (req, res, next) => {
	const start = Date.now();
	const { method, url, ip, headers } = req;
	const userAgent = headers["user-agent"];

	logger.info(`Request Start: ${method} ${url}`, {
		ip,
		userAgent,
	});

	res.on("finish", () => {
		const duration = Date.now() - start;
		const { statusCode } = res;
		logger.info(`Request End: ${method} ${url} ${statusCode} ${duration}ms`, {
			ip,
			userAgent,
			statusCode,
			duration,
		});
	});

	next();
};

module.exports = { requestLogger };
