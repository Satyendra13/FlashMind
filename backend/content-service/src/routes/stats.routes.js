const express = require("express");
const router = express.Router();
const statsController = require("../controllers/stats.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.get("/", authMiddleware, statsController.getDashboardStats);
router.get(
	"/recent-activity",
	authMiddleware,
	statsController.getRecentActivity
);
router.get("/performance", authMiddleware, statsController.getPerformanceData);

module.exports = router;
