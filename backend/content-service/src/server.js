const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const config = require("./config");
const logger = require("./utils/logger");
const apiRoutes = require("./routes/index");

const app = express();

app.use(
	cors({
		origin: config.frontendUrl,
		credentials: true,
	})
);

app.use(express.json());

app.use((req, res, next) => {
	logger.info({ method: req.method, url: req.url, body: req.body });
	next();
});

mongoose
	.connect(config.mongodbUri, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	})
	.then(() => {
		logger.info("Content service connected to MongoDB");

		app.listen(config.port, () => {
			logger.info(`Content service running on port ${config.port}`);
		});
	})
	.catch((error) => {
		logger.error({ message: "MongoDB connection error", error: error.message });
	});

app.use("/", apiRoutes);

app.get("/health", (req, res) => {
	logger.info("Health check requested.");
	const dbState = mongoose.connection.readyState;
	const dbStatus = dbState === 1 ? "connected" : "disconnected";
	res
		.status(200)
		.json({ status: "OK", service: "content-service", database: dbStatus });
});
