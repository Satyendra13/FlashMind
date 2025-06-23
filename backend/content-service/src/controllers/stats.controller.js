const mongoose = require("mongoose");
const Note = require("../models/note.model");
const Flashcard = require("../models/flashcard.model");
const Quiz = require("../models/quiz.model");
const QuizSession = require("../models/quizSession.model");
const logger = require("../utils/logger");

const getDashboardStats = async (req, res) => {
	try {
		const userId = req.userId;
		logger.info(`Fetching dashboard stats for user: ${userId}`);

		const now = new Date();
		const startOfWeek = new Date(now);
		startOfWeek.setDate(now.getDate() - now.getDay());
		startOfWeek.setHours(0, 0, 0, 0);
		const startOfLastWeek = new Date(startOfWeek);
		startOfLastWeek.setDate(startOfWeek.getDate() - 7);
		const endOfLastWeek = new Date(startOfWeek);
		endOfLastWeek.setMilliseconds(-1);

		const countInRange = (Model, userId, start, end) =>
			Model.countDocuments({ userId, createdAt: { $gte: start, $lte: end } });

		const quizSessionsInRange = (userId, start, end) =>
			QuizSession.find({
				userId,
				score: { $ne: null },
				completedAt: { $gte: start, $lte: end },
			});

		const [
			totalNotes,
			totalFlashcards,
			totalQuizzes,
			completedQuizzes,
			avgScoreArr,
		] = await Promise.all([
			Note.countDocuments({ userId }),
			Flashcard.countDocuments({ userId }),
			Quiz.countDocuments({ userId }),
			QuizSession.countDocuments({ userId, score: { $ne: null } }),
			QuizSession.aggregate([
				{
					$match: {
						userId: new mongoose.Types.ObjectId(userId),
						score: { $ne: null },
					},
				},
				{ $group: { _id: null, avgScore: { $avg: "$score" } } },
			]),
		]);

		const [
			notesThisWeek,
			notesLastWeek,
			flashcardsThisWeek,
			flashcardsLastWeek,
			quizzesThisWeek,
			quizzesLastWeek,
			completedQuizzesThisWeek,
			completedQuizzesLastWeek,
			quizSessionsThisWeek,
			quizSessionsLastWeek,
		] = await Promise.all([
			countInRange(Note, userId, startOfWeek, now),
			countInRange(Note, userId, startOfLastWeek, endOfLastWeek),
			countInRange(Flashcard, userId, startOfWeek, now),
			countInRange(Flashcard, userId, startOfLastWeek, endOfLastWeek),
			countInRange(Quiz, userId, startOfWeek, now),
			countInRange(Quiz, userId, startOfLastWeek, endOfLastWeek),
			QuizSession.countDocuments({
				userId,
				score: { $ne: null },
				completedAt: { $gte: startOfWeek, $lte: now },
			}),
			QuizSession.countDocuments({
				userId,
				score: { $ne: null },
				completedAt: { $gte: startOfLastWeek, $lte: endOfLastWeek },
			}),
			quizSessionsInRange(userId, startOfWeek, now),
			quizSessionsInRange(userId, startOfLastWeek, endOfLastWeek),
		]);

		const avgScoreThisWeek = quizSessionsThisWeek.length
			? Math.round(
					quizSessionsThisWeek.reduce((sum, s) => sum + (s.score || 0), 0) /
						quizSessionsThisWeek.length
			  )
			: 0;
		const avgScoreLastWeek = quizSessionsLastWeek.length
			? Math.round(
					quizSessionsLastWeek.reduce((sum, s) => sum + (s.score || 0), 0) /
						quizSessionsLastWeek.length
			  )
			: 0;

		const calcTrend = (current, prev) =>
			prev === 0
				? current > 0
					? 100
					: 0
				: Math.round(((current - prev) / Math.max(prev, 1)) * 100);

		const sessions = await QuizSession.find({
			userId,
			score: { $ne: null },
		}).sort({ completedAt: -1 });
		let streak = 0;
		let prevDate = null;

		if (sessions.length > 0 && sessions[0].completedAt) {
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			const mostRecentSessionDate = new Date(sessions[0].completedAt);
			mostRecentSessionDate.setHours(0, 0, 0, 0);

			const dayBeforeToday = new Date(today);
			dayBeforeToday.setDate(today.getDate() - 1);

			if (
				mostRecentSessionDate.getTime() === today.getTime() ||
				mostRecentSessionDate.getTime() === dayBeforeToday.getTime()
			) {
				streak = 1;
				prevDate = mostRecentSessionDate;

				const uniqueDates = [
					...new Set(
						sessions
							.map((s) =>
								s.completedAt
									? new Date(s.completedAt).toISOString().slice(0, 10)
									: null
							)
							.filter(Boolean)
					),
				];

				for (let i = 1; i < uniqueDates.length; i++) {
					const prev = new Date(uniqueDates[i - 1]);
					const curr = new Date(uniqueDates[i]);
					const diff = Math.round((prev - curr) / (1000 * 60 * 60 * 24));

					if (diff === 1) {
						streak++;
					} else {
						break;
					}
				}
			}
		}

		logger.info(`Successfully fetched dashboard stats for user: ${userId}`);
		res.json({
			totalNotes,
			totalNotesTrend: calcTrend(notesThisWeek, notesLastWeek),
			totalFlashcards,
			totalFlashcardsTrend: calcTrend(flashcardsThisWeek, flashcardsLastWeek),
			totalQuizzes,
			totalQuizzesTrend: calcTrend(quizzesThisWeek, quizzesLastWeek),
			completedQuizzes,
			completedQuizzesTrend: calcTrend(
				completedQuizzesThisWeek,
				completedQuizzesLastWeek
			),
			averageScore: avgScoreArr[0]?.avgScore
				? Math.round(avgScoreArr[0].avgScore)
				: 0,
			averageScoreTrend: calcTrend(avgScoreThisWeek, avgScoreLastWeek),
			studyStreak: streak,
		});
	} catch (error) {
		logger.error({
			message: `Failed to fetch stats for user: ${req.userId}`,
			error: error.message,
		});
		res.status(500).json({ message: "Failed to fetch stats" });
	}
};

const getRecentActivity = async (req, res) => {
	try {
		const userId = req.userId;
		logger.info(`Fetching recent activity for user: ${userId}`);

		const [notes, flashcards, sessions] = await Promise.all([
			Note.find({ userId }).sort({ createdAt: -1 }).limit(5),
			Flashcard.find({ userId }).sort({ createdAt: -1 }).limit(5),
			QuizSession.find({ userId, score: { $ne: null } })
				.sort({ completedAt: -1 })
				.limit(5)
				.populate("quizId", "title"),
		]);

		const activities = [
			...notes.map((n) => ({
				type: "note",
				title: n.title || "Note",
				id: n._id,
				time: n.createdAt,
			})),
			...flashcards.map((f) => ({
				type: "flashcard",
				title: f.frontContent || "Flashcard",
				id: f.deckId,
				time: f.createdAt,
			})),
			...sessions.map((s) => ({
				type: "quiz",
				title: s.quizId ? `Completed "${s.quizId.title}"` : "Completed a quiz",
				id: s.quizId ? s.quizId._id : null,
				time: s.completedAt,
			})),
		]
			.sort((a, b) => new Date(b.time) - new Date(a.time))
			.slice(0, 7);

		logger.info(`Successfully fetched recent activity for user: ${userId}`);
		res.json(activities);
	} catch (error) {
		logger.error({
			message: `Failed to fetch recent activity for user: ${req.userId}`,
			error: error.message,
		});
		res.status(500).json({ message: "Failed to fetch recent activity" });
	}
};

const getPerformanceData = async (req, res) => {
	try {
		const userId = req.userId;
		logger.info(`Fetching performance data for user: ${userId}`);

		const today = new Date();
		const days = Array.from({ length: 7 }, (_, i) => {
			const d = new Date(today);
			d.setDate(today.getDate() - (6 - i));
			return d;
		});

		const performance = await Promise.all(
			days.map(async (date) => {
				const start = new Date(date);
				start.setHours(0, 0, 0, 0);
				const end = new Date(date);
				end.setHours(23, 59, 59, 999);
				const sessions = await QuizSession.find({
					userId,
					score: { $ne: null },
					completedAt: { $gte: start, $lte: end },
				});
				const score = sessions.length
					? Math.round(
							sessions.reduce((sum, s) => sum + (s.score || 0), 0) /
								sessions.length
					  )
					: 0;
				return {
					date: start.toLocaleDateString("en-US", { weekday: "short" }),
					score,
				};
			})
		);

		logger.info(`Successfully fetched performance data for user: ${userId}`);
		res.json(performance);
	} catch (error) {
		logger.error({
			message: `Failed to fetch performance data for user: ${req.userId}`,
			error: error.message,
		});
		res.status(500).json({ message: "Failed to fetch performance data" });
	}
};

module.exports = {
	getDashboardStats,
	getRecentActivity,
	getPerformanceData,
};
