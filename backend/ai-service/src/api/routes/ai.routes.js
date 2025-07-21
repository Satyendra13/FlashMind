const express = require("express");
const router = express.Router();
const aiController = require("../../controllers/ai.controller");

router.post("/quiz", aiController.generateQuiz);
router.post("/quiz/explanation", aiController.generateExplanation);
router.post("/flashcards", aiController.generateFlashcards);
router.post("/notes", aiController.generateNoteFromImage);

module.exports = router;
