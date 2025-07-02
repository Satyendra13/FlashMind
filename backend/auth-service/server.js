const express = require("express");
const cors = require("cors");
require("dotenv").config();

const logger = require("./config/logger");
const connectDB = require("./config/database");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();

app.use(
	cors({
		origin: process.env.FRONTEND_URL,
		credentials: true,
	})
);
app.use(express.json());

app.use((req, res, next) => {
	logger.info(`${req.method} ${req.originalUrl}`);
	next();
});

app.use("/", authRoutes);
app.use("/", userRoutes);

app.use((err, req, res, next) => {
	logger.error(err.stack);
	res.status(500).send("Something broke!");
});

const PORT = process.env.AUTH_PORT;

connectDB()
	.then(() => {
		app.listen(PORT, () => {
			logger.info(`Auth service running on port ${PORT}`);
		});
	})
	.catch((err) => {
		logger.error(err.stack);
	});
