const express = require("express");
const router = express.Router();
const aiController = require("../../controllers/ai.controller");

router.post("/quiz", aiController.generateQuiz);
router.post("/flashcards", aiController.generateFlashcards);

module.exports = router;
