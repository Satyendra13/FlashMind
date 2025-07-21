const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const authMiddleware = require("../middleware/auth.middleware");
const adminMiddleware = require("../middleware/admin.middleware");

router.get(
    "/users/:id/report",
    authMiddleware,
    adminMiddleware,
    adminController.getUserReport
);

module.exports = router; 