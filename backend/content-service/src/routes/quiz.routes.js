const express = require("express");
const router = express.Router();
const quizController = require("../controllers/quiz.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.post("/generate", authMiddleware, quizController.generateQuiz);
router.get("/", authMiddleware, quizController.getAllQuizzes);
router.get(
	"/sessions/history",
	authMiddleware,
	quizController.getSessionHistory
);
router.get("/:id", authMiddleware, quizController.getQuizById);
router.post("/:id/start", authMiddleware, quizController.startQuizSession);
router.post(
	"/:id/complete",
	authMiddleware,
	quizController.completeQuizSession
);
router.get("/:id/results", authMiddleware, quizController.getQuizResults);
router.get(
	"/:id/results/:sessionId",
	authMiddleware,
	quizController.getQuizResultsBySessionId
);
router.get(
	"/:id/explanation/:sessionId",
	authMiddleware,
	quizController.getQuizExplanation
);
router.post(
	'/:id/session/:sessionId/save-progress',
	authMiddleware,
	quizController.saveQuizProgress
);
router.delete("/:id", authMiddleware, quizController.deleteQuiz);

module.exports = router;
