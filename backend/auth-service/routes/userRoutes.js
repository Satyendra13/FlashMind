const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");
const {
	updateProfileValidator,
	changePasswordValidator,
} = require("../middlewares/validationMiddleware");

router.use(authMiddleware);

router.get("/profile", userController.getProfile);
router.put("/profile", updateProfileValidator, userController.updateProfile);
router.put(
	"/change-password",
	changePasswordValidator,
	userController.changePassword
);
router.get("/admin/users", adminMiddleware, userController.getAllUsers);
router.get("/admin/users/:id", adminMiddleware, userController.getUserById);

module.exports = router;
