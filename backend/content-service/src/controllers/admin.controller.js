const User = require("../../../auth-service/models/userModel");
const Note = require("../models/note.model");
const Flashcard = require("../models/flashcard.model");
const Quiz = require("../models/quiz.model");
const QuizSession = require("../models/quizSession.model");
const logger = require("../utils/logger");

exports.getUserReport = async (req, res) => {
    try {
        const userId = req.params.id;
        const notes = await Note.find({ userId });
        const flashcards = await Flashcard.find({ userId });
        const quizzes = await Quiz.find({ userId });
        const quizResults = await QuizSession.find({ userId, isCompleted: true });
        res.json({ notes, flashcards, quizzes, quizResults });
    } catch (error) {
        logger.error("Admin getUserReport error", { error: error.message });
        res.status(500).json({ message: "Server error fetching user report" });
    }
}; 