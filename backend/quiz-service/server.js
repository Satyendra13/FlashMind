const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = process.env.QUIZ_PORT || 3004;

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'your-gemini-api-key');

const quizSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  sourceType: { type: String, enum: ['note', 'deck'], required: true },
  sourceId: { type: mongoose.Schema.Types.ObjectId, required: true },
  quizType: {
    type: String,
    enum: ['multiple_choice', 'true_false', 'fill_blank', 'mixed'],
    default: 'multiple_choice'
  },
  totalQuestions: {
    type: Number,
    default: 0,
  },
  questions: [{
    question: { type: String, required: true },
    options: [String],
    correctAnswer: { type: String, required: true },
    explanation: String
  }],
  timeLimit: { type: Number, default: 15 }
}, { timestamps: true });

const quizSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  answers: [{
    questionIndex: Number,
    userAnswer: String,
    isCorrect: Boolean,
    timeSpent: Number
  }],
  score: Number,
  totalQuestions: Number,
  correctAnswers: Number,
  timeTaken: Number,
  completedAt: Date
}, { timestamps: true });

const noteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true }
}, { timestamps: true });

const flashcardDeckSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: String
}, { timestamps: true });

const flashcardSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  deckId: { type: mongoose.Schema.Types.ObjectId, ref: 'FlashcardDeck' },
  frontContent: { type: String, required: true },
  backContent: { type: String, required: true }
}, { timestamps: true });

const Quiz = mongoose.model('Quiz', quizSchema);
const QuizSession = mongoose.model('QuizSession', quizSessionSchema);
const Note = mongoose.model('Note', noteSchema);
const FlashcardDeck = mongoose.model('FlashcardDeck', flashcardDeckSchema);
const Flashcard = mongoose.model('Flashcard', flashcardSchema);

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

const generateQuizWithAI = async (content, options) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    let prompt = `
      Create ${options.numberOfQuestions} quiz questions from the following content.
      Quiz Type: ${options.quizType}
      
      Content: ${content}
      
      Please return a JSON array where each question has the following structure:
    `;

    if (options.quizType === 'multiple_choice') {
      prompt += `
      {
        "question": "The question text",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": "The correct option",
        "explanation": "Brief explanation of why this is correct"
      }
      `;
    } else if (options.quizType === 'true_false') {
      prompt += `
      {
        "question": "The statement to evaluate",
        "options": ["True", "False"],
        "correctAnswer": "True" or "False",
        "explanation": "Brief explanation"
      }
      `;
    } else if (options.quizType === 'fill_blank') {
      prompt += `
      {
        "question": "The question with [BLANK] where the answer should go",
        "options": [],
        "correctAnswer": "The word or phrase that fills the blank",
        "explanation": "Brief explanation"
      }
      `;
    }

    prompt += `
      Make sure questions are educational, clear, and test understanding of the content.
      Return only the JSON array, no additional text.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Remove Markdown code block if present
    text = text.replace(/```json|```/g, '').trim();

    try {
      const questions = JSON.parse(text);
      return Array.isArray(questions) ? questions : [];
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return [];
    }
  } catch (error) {
    console.error('AI generation error:', error);
    return [];
  }
};

app.post('/generate', authMiddleware, async (req, res) => {
  try {
    const {
      source,
      sourceId,
      quizType = 'multiple_choice',
      numberOfQuestions = 10,
      timeLimit = 15
    } = req.body;

    if (!source || !sourceId) {
      return res.status(400).json({ message: 'Source type and ID are required' });
    }

    let content = '';
    let title = '';

    if (source === 'note') {
      const note = await Note.findOne({ _id: sourceId, userId: req.userId });
      if (!note) {
        return res.status(404).json({ message: 'Note not found' });
      }
      content = note.content;
      title = `Quiz: ${note.title}`;
    } else if (source === 'deck') {
      const deck = await FlashcardDeck.findOne({ _id: sourceId, userId: req.userId });
      if (!deck) {
        return res.status(404).json({ message: 'Deck not found' });
      }

      const flashcards = await Flashcard.find({ deckId: sourceId });
      content = flashcards.map(card => `Q: ${card.frontContent}\nA: ${card.backContent}`).join('\n\n');
      title = `Quiz: ${deck.name}`;
    }

    if (!content) {
      return res.status(400).json({ message: 'No content found to generate quiz from' });
    }

    const aiQuestions = await generateQuizWithAI(content, {
      numberOfQuestions,
      quizType
    });

    if (aiQuestions.length === 0) {
      const fallbackQuestions = [{
        question: `What is the main topic covered in this ${source}?`,
        options: quizType === 'multiple_choice' ? ['Topic A', 'Topic B', 'Topic C', 'Topic D'] :
          quizType === 'true_false' ? ['True', 'False'] : [],
        correctAnswer: quizType === 'multiple_choice' ? 'Topic A' :
          quizType === 'true_false' ? 'True' : 'Main topic',
        explanation: 'This question tests basic understanding of the content.'
      }];
      aiQuestions.push(...fallbackQuestions);
    }

    const quiz = new Quiz({
      userId: req.userId,
      title,
      sourceType: source,
      sourceId,
      quizType,
      totalQuestions: aiQuestions.length,
      questions: aiQuestions,
      timeLimit
    });

    await quiz.save();

    res.status(201).json({
      message: 'Quiz generated successfully',
      quiz: quiz
    });
  } catch (error) {
    console.error('Quiz generation error:', error);
    res.status(500).json({ message: 'Server error generating quiz' });
  }
});

app.get('/', authMiddleware, async (req, res) => {
  try {
    const quizzes = await Quiz.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .select('-questions');

    res.json(quizzes);
  } catch (error) {
    console.error('Quizzes fetch error:', error);
    res.status(500).json({ message: 'Server error fetching quizzes' });
  }
});

app.get('/:id', authMiddleware, async (req, res) => {
  try {
    const quiz = await Quiz.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    res.json(quiz);
  } catch (error) {
    console.error('Quiz fetch error:', error);
    res.status(500).json({ message: 'Server error fetching quiz' });
  }
});

app.post('/:id/start', authMiddleware, async (req, res) => {
  try {
    const quiz = await Quiz.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const session = new QuizSession({
      userId: req.userId,
      quizId: quiz._id,
      answers: [],
      totalQuestions: quiz.questions.length
    });

    await session.save();

    res.json({
      message: 'Quiz session started',
      sessionId: session._id,
      quiz: quiz
    });
  } catch (error) {
    console.error('Quiz start error:', error);
    res.status(500).json({ message: 'Server error starting quiz' });
  }
});

app.post('/:id/complete', authMiddleware, async (req, res) => {
  try {
    const { answers, sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ message: 'Session ID is required' });
    }

    const quiz = await Quiz.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const session = await QuizSession.findOne({
      _id: sessionId,
      quizId: quiz._id,
      userId: req.userId
    });

    if (!session) {
      return res.status(404).json({ message: 'Quiz session not found' });
    }

    let correctAnswers = 0;
    const processedAnswers = [];

    quiz.questions.forEach((question, index) => {
      const userAnswer = answers[index] || '';
      const isCorrect = userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();

      if (isCorrect) {
        correctAnswers++;
      }

      processedAnswers.push({
        questionIndex: index,
        userAnswer,
        isCorrect,
        timeSpent: 0
      });
    });

    const score = Math.round((correctAnswers / quiz.questions.length) * 100);

    session.answers = processedAnswers;
    session.score = score;
    session.totalQuestions = quiz.questions.length;
    session.correctAnswers = correctAnswers;
    session.timeTaken = quiz.timeLimit * 60;
    session.completedAt = new Date();
    await session.save();

    res.json({
      message: 'Quiz completed successfully',
      sessionId: session._id,
      score,
      correctAnswers,
      totalQuestions: quiz.questions.length,
      timeTaken: quiz.timeLimit * 60
    });
  } catch (error) {
    console.error('Quiz completion error:', error);
    res.status(500).json({ message: 'Server error completing quiz' });
  }
});

app.get('/:id/results', authMiddleware, async (req, res) => {
  try {
    const sessions = await QuizSession.find({
      quizId: req.params.id,
      userId: req.userId
    }).sort({ completedAt: -1 });

    if (sessions.length === 0) {
      return res.status(404).json({ message: 'No quiz results found' });
    }

    res.json(sessions);
  } catch (error) {
    console.error('Quiz results fetch error:', error);
    res.status(500).json({ message: 'Server error fetching quiz results' });
  }
});

app.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const quiz = await Quiz.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    await QuizSession.deleteMany({ quizId: req.params.id });

    res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    console.error('Quiz deletion error:', error);
    res.status(500).json({ message: 'Server error deleting quiz' });
  }
});

app.get('/sessions/history', authMiddleware, async (req, res) => {
  try {
    const sessions = await QuizSession.find({ userId: req.userId })
      .populate('quizId', 'title')
      .sort({ completedAt: -1 })
      .limit(20);

    res.json(sessions);
  } catch (error) {
    console.error('Quiz history fetch error:', error);
    res.status(500).json({ message: 'Server error fetching quiz history' });
  }
});

app.listen(PORT, () => {
  console.log(`Quiz service running on port ${PORT}`);
});