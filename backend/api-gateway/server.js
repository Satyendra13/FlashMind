const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const config = require("./config");
const logger = require("./utils/logger");
const mainRouter = require("./routes");
const { rateLimiter } = require("./middlewares/rateLimiter");
const { requestLogger } = require("./middlewares/requestLogger");

const app = express();

app.use(
	cors({
		origin: config.FRONTEND_URL,
		credentials: true,
		methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
	})
);

app.options("*", cors({
	origin: config.FRONTEND_URL,
	credentials: true,
}));

app.use(requestLogger);
app.use(helmet());
app.use(rateLimiter);

// IMPORTANT: Do NOT use express.json() or express.urlencoded() before proxy routes to avoid interfering with file uploads.
// app.use(express.json({ limit: "500mb" }));
// app.use(express.urlencoded({ extended: true, limit: "500mb" }));

app.use("/", mainRouter);

app.listen(config.PORT, () => {
	logger.info(`API Gateway running on port ${config.PORT}`);
});

module.exports = app;
