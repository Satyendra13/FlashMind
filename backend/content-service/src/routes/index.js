const express = require("express");
const router = express.Router();
const notesRoutes = require("./notes.routes");
const flashcardsRoutes = require("./flashcards.routes");
const quizRoutes = require("./quiz.routes");
const statsRoutes = require("./stats.routes");
const adminRoutes = require("./admin.routes");

router.use("/notes", notesRoutes);
router.use("/flashcards", flashcardsRoutes);
router.use("/quizzes", quizRoutes);
router.use("/stats", statsRoutes);
router.use("/admin", adminRoutes);

module.exports = router;
