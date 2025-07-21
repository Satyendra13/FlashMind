const proxy = require("express-http-proxy");
const config = require("../config");

const authProxy = proxy(config.AUTH_SERVICE_URL, {
	proxyReqPathResolver: (req) =>
		req.originalUrl.replace(/^\/api\/auth/, "") || "/",
});

const contentProxy = proxy(config.CONTENT_SERVICE_URL, {
	proxyReqPathResolver: (req) =>
		req.originalUrl.replace(/^\/api\/content/, "") || "/",
	limit: '100mb'
});

module.exports = {
	authProxy,
	contentProxy,
};
