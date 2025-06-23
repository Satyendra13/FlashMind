const express = require("express");
const cors = require("cors");
const config = require("./config");
const logger = require("./utils/logger");
const aiRoutes = require("./api/routes/ai.routes");

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

app.use("/api/ai", aiRoutes);

app.get("/health", (req, res) => {
	logger.info("Health check requested.");
	res.status(200).json({ status: "OK", service: "ai-service" });
});

app.listen(config.port, () => {
	logger.info(`AI service running on port ${config.port}`);
});
