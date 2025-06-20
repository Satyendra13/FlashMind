const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.STATS_PORT || 3010;

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Stats service connected to MongoDB');
}).catch((error) => {
    console.error('MongoDB connection error:', error);
});


const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};


const Note = mongoose.model('Note', new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId, title: String }, { timestamps: true, strict: false }));
const Flashcard = mongoose.model('Flashcard', new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId, frontContent: String }, { timestamps: true, strict: false }));
const Quiz = mongoose.model('Quiz', new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId, title: String }, { timestamps: true, strict: false }));
const QuizSession = mongoose.model('QuizSession', new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId, quizId: mongoose.Schema.Types.ObjectId, score: Number, completedAt: Date }, { timestamps: true, strict: false }));


app.get('/stats', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;

        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
        startOfWeek.setHours(0, 0, 0, 0);
        const startOfLastWeek = new Date(startOfWeek);
        startOfLastWeek.setDate(startOfWeek.getDate() - 7);
        const endOfLastWeek = new Date(startOfWeek);
        endOfLastWeek.setMilliseconds(-1);


        const countInRange = (Model, userId, start, end) =>
            Model.countDocuments({ userId, createdAt: { $gte: start, $lte: end } });

        const quizSessionsInRange = (userId, start, end) =>
            QuizSession.find({ userId, score: { $ne: null }, completedAt: { $gte: start, $lte: end } });

        // Current week
        const [
            totalNotes,
            totalFlashcards,
            totalQuizzes,
            completedQuizzes,
            avgScoreArr
        ] = await Promise.all([
            Note.countDocuments({ userId }),
            Flashcard.countDocuments({ userId }),
            Quiz.countDocuments({ userId }),
            QuizSession.countDocuments({ userId, score: { $ne: null } }),
            QuizSession.aggregate([
                { $match: { userId: new mongoose.Types.ObjectId(userId), score: { $ne: null } } },
                { $group: { _id: null, avgScore: { $avg: "$score" } } }
            ])
        ]);

        // This week and last week stats
        const [
            notesThisWeek, notesLastWeek,
            flashcardsThisWeek, flashcardsLastWeek,
            quizzesThisWeek, quizzesLastWeek,
            completedQuizzesThisWeek, completedQuizzesLastWeek,
            quizSessionsThisWeek, quizSessionsLastWeek
        ] = await Promise.all([
            countInRange(Note, userId, startOfWeek, now),
            countInRange(Note, userId, startOfLastWeek, endOfLastWeek),
            countInRange(Flashcard, userId, startOfWeek, now),
            countInRange(Flashcard, userId, startOfLastWeek, endOfLastWeek),
            countInRange(Quiz, userId, startOfWeek, now),
            countInRange(Quiz, userId, startOfLastWeek, endOfLastWeek),
            QuizSession.countDocuments({ userId, score: { $ne: null }, completedAt: { $gte: startOfWeek, $lte: now } }),
            QuizSession.countDocuments({ userId, score: { $ne: null }, completedAt: { $gte: startOfLastWeek, $lte: endOfLastWeek } }),
            quizSessionsInRange(userId, startOfWeek, now),
            quizSessionsInRange(userId, startOfLastWeek, endOfLastWeek)
        ]);

        // Average score trends
        const avgScoreThisWeek = quizSessionsThisWeek.length ? Math.round(quizSessionsThisWeek.reduce((sum, s) => sum + (s.score || 0), 0) / quizSessionsThisWeek.length) : 0;
        const avgScoreLastWeek = quizSessionsLastWeek.length ? Math.round(quizSessionsLastWeek.reduce((sum, s) => sum + (s.score || 0), 0) / quizSessionsLastWeek.length) : 0;

        // Helper for trend
        const calcTrend = (current, prev) => prev === 0 ? (current > 0 ? 100 : 0) : Math.round(((current - prev) / Math.max(prev, 1)) * 100);

        // Study streak: consecutive days with a completed quiz session
        const sessions = await QuizSession.find({ userId, score: { $ne: null } }).sort({ completedAt: -1 });
        let streak = 0;
        let prevDate = null;
        for (const session of sessions) {
            const date = session.completedAt ? session.completedAt.toISOString().slice(0, 10) : null;
            if (!date) continue;
            if (!prevDate) {
                prevDate = date;
                streak = 1;
            } else {
                const prev = new Date(prevDate);
                const curr = new Date(date);
                const diff = (prev - curr) / (1000 * 60 * 60 * 24);
                if (diff === 1) {
                    streak++;
                    prevDate = date;
                } else if (diff === 0) {
                    continue;
                } else {
                    break;
                }
            }
        }

        res.json({
            totalNotes,
            totalNotesTrend: calcTrend(notesThisWeek, notesLastWeek),
            totalFlashcards,
            totalFlashcardsTrend: calcTrend(flashcardsThisWeek, flashcardsLastWeek),
            totalQuizzes,
            totalQuizzesTrend: calcTrend(quizzesThisWeek, quizzesLastWeek),
            completedQuizzes,
            completedQuizzesTrend: calcTrend(completedQuizzesThisWeek, completedQuizzesLastWeek),
            averageScore: avgScoreArr[0]?.avgScore ? Math.round(avgScoreArr[0].avgScore) : 0,
            averageScoreTrend: calcTrend(avgScoreThisWeek, avgScoreLastWeek),
            studyStreak: streak
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ message: 'Failed to fetch stats' });
    }
});


app.get('/stats/recent-activity', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;

        const [notes, flashcards, sessions] = await Promise.all([
            Note.find({ userId }).sort({ createdAt: -1 }).limit(3),
            Flashcard.find({ userId }).sort({ createdAt: -1 }).limit(3),
            QuizSession.find({ userId, score: { $ne: null } }).sort({ completedAt: -1 }).limit(3)
        ]);

        const activities = [
            ...notes.map(n => ({ type: 'note', title: n.title || 'Note', time: n.createdAt })),
            ...flashcards.map(f => ({ type: 'flashcard', title: f.frontContent || 'Flashcard', time: f.createdAt })),
            ...sessions.map(s => ({ type: 'quiz', title: 'Completed a quiz', time: s.completedAt }))
        ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 7);

        const formatted = activities.map(a => ({ ...a, time: a.time ? new Date(a.time).toLocaleString() : '' }));
        res.json(formatted);
    } catch (error) {
        console.error('Recent activity error:', error);
        res.status(500).json({ message: 'Failed to fetch recent activity' });
    }
});


app.get('/stats/performance', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const today = new Date();
        const days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(today);
            d.setDate(today.getDate() - (6 - i));
            return d;
        });
        const performance = await Promise.all(days.map(async (date) => {
            const start = new Date(date);
            start.setHours(0, 0, 0, 0);
            const end = new Date(date);
            end.setHours(23, 59, 59, 999);
            const sessions = await QuizSession.find({ userId, score: { $ne: null }, completedAt: { $gte: start, $lte: end } });
            const score = sessions.length ? Math.round(sessions.reduce((sum, s) => sum + (s.score || 0), 0) / sessions.length) : 0;
            return { date: start.toLocaleDateString('en-US', { weekday: 'short' }), score };
        }));
        res.json(performance);
    } catch (error) {
        console.error('Performance error:', error);
        res.status(500).json({ message: 'Failed to fetch performance data' });
    }
});

app.listen(PORT, () => {
    console.log(`Stats service running on port ${PORT}`);
}); 