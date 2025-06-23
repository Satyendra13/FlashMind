const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");
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

module.exports = router;
