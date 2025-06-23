const express = require("express");
const router = express.Router();
const notesController = require("../controllers/notes.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.post(
	"/upload",
	authMiddleware,
	notesController.upload,
	notesController.uploadNote
);
router.post("/manual", authMiddleware, notesController.createManualNote);
router.get("/", authMiddleware, notesController.getAllNotes);
router.get("/file/:fileId", authMiddleware, notesController.downloadFile);
router.get("/:id", authMiddleware, notesController.getNoteById);
router.put("/:id", authMiddleware, notesController.updateNote);
router.delete("/:id", authMiddleware, notesController.deleteNote);

module.exports = router;
