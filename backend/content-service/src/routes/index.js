const express = require("express");
const router = express.Router();
const noteRoutes = require("./notes.routes");
const flashcardRoutes = require("./flashcards.routes");
const quizRoutes = require("./quiz.routes");
const statsRoutes = require("./stats.routes");

router.use("/notes", noteRoutes);
router.use("/flashcards", flashcardRoutes);
router.use("/quizzes", quizRoutes);
router.use("/stats", statsRoutes);

module.exports = router;
