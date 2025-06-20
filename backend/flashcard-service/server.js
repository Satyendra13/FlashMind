const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = process.env.FLASHCARD_PORT || 3003;

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

const flashcardDeckSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: String,
  tags: [String],
  cardCount: { type: Number, default: 0 }
}, { timestamps: true });

const flashcardSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  noteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Note' },
  deckId: { type: mongoose.Schema.Types.ObjectId, ref: 'FlashcardDeck' },
  frontContent: { type: String, required: true },
  backContent: { type: String, required: true },
  cardType: { type: String, enum: ['basic', 'cloze', 'multiple_choice'], default: 'basic' },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  reviewCount: { type: Number, default: 0 },
  correctCount: { type: Number, default: 0 },
  lastReviewed: Date,
  nextReview: Date
}, { timestamps: true });

const noteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  folder: { type: String, default: 'General' }
}, { timestamps: true });

const FlashcardDeck = mongoose.model('FlashcardDeck', flashcardDeckSchema);
const Flashcard = mongoose.model('Flashcard', flashcardSchema);
const Note = mongoose.model('Note', noteSchema);

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

const generateFlashcardsWithAI = async (content, options) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `
      Create ${options.numberOfCards} flashcards from the following content.
      Difficulty: ${options.difficulty}
      Card Type: ${options.cardType}
      
      Content: ${content}
      
      Please return a JSON array where each flashcard has the following structure:
      {
        "frontContent": "Question or prompt",
        "backContent": "Answer or explanation",
        "difficulty": "${options.difficulty}"
      }
      
      Make sure the flashcards are educational, clear, and appropriate for the difficulty level.
      For basic cards, use question-answer format.
      For cloze cards, use fill-in-the-blank format with [BLANK] placeholder.
      For multiple choice, include the question and correct answer.
      
      Return only the JSON array, no additional text.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Remove Markdown code block if present
    text = text.replace(/```json|```/g, '').trim();

    let flashcards;
    try {
      flashcards = JSON.parse(text);
      return Array.isArray(flashcards) ? flashcards : [];
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
    const { noteId, numberOfCards = 10, difficulty = 'medium', cardType = 'basic' } = req.body;

    if (!noteId) {
      return res.status(400).json({ message: 'Note ID is required' });
    }

    const note = await Note.findOne({ _id: noteId, userId: req.userId });
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    let deck = await FlashcardDeck.findOne({
      userId: req.userId,
      name: `${note.title} - Flashcards`
    });

    if (!deck) {
      deck = new FlashcardDeck({
        userId: req.userId,
        name: `${note.title} - Flashcards`,
        description: `AI-generated flashcards from ${note.title}`,
        tags: [note.folder]
      });
      await deck.save();
    }

    const aiFlashcards = await generateFlashcardsWithAI(note.content, {
      numberOfCards,
      difficulty,
      cardType
    });

    if (aiFlashcards.length === 0) {
      const fallbackFlashcards = [
        {
          frontContent: `What is the main topic of "${note.title}"?`,
          backContent: note.content.substring(0, 200) + '...',
          difficulty: difficulty
        }
      ];
      aiFlashcards.push(...fallbackFlashcards);
    }

    const flashcards = [];
    for (const aiCard of aiFlashcards) {
      const flashcard = new Flashcard({
        userId: req.userId,
        noteId: noteId,
        deckId: deck._id,
        frontContent: aiCard.frontContent,
        backContent: aiCard.backContent,
        cardType: cardType,
        difficulty: aiCard.difficulty || difficulty,
        nextReview: new Date()
      });

      await flashcard.save();
      flashcards.push(flashcard);
    }

    deck.cardCount = await Flashcard.countDocuments({ deckId: deck._id });
    await deck.save();

    res.status(201).json({
      message: 'Flashcards generated successfully',
      deck: deck,
      flashcards: flashcards
    });
  } catch (error) {
    console.error('Flashcard generation error:', error);
    res.status(500).json({ message: 'Server error generating flashcards' });
  }
});

app.get('/decks', authMiddleware, async (req, res) => {
  try {
    const decks = await FlashcardDeck.find({ userId: req.userId })
      .sort({ createdAt: -1 });

    res.json(decks);
  } catch (error) {
    console.error('Decks fetch error:', error);
    res.status(500).json({ message: 'Server error fetching decks' });
  }
});

app.get('/', authMiddleware, async (req, res) => {
  try {
    const { deckId } = req.query;

    const query = { userId: req.userId };
    if (deckId) {
      query.deckId = deckId;
    }

    const flashcards = await Flashcard.find(query)
      .populate('deckId', 'name')
      .sort({ createdAt: -1 });

    res.json(flashcards);
  } catch (error) {
    console.error('Flashcards fetch error:', error);
    res.status(500).json({ message: 'Server error fetching flashcards' });
  }
});

app.get('/:id', authMiddleware, async (req, res) => {
  try {
    const flashcard = await Flashcard.findOne({
      _id: req.params.id,
      userId: req.userId
    }).populate('deckId', 'name');

    if (!flashcard) {
      return res.status(404).json({ message: 'Flashcard not found' });
    }

    res.json(flashcard);
  } catch (error) {
    console.error('Flashcard fetch error:', error);
    res.status(500).json({ message: 'Server error fetching flashcard' });
  }
});

app.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { frontContent, backContent, difficulty } = req.body;

    const flashcard = await Flashcard.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { frontContent, backContent, difficulty },
      { new: true }
    );

    if (!flashcard) {
      return res.status(404).json({ message: 'Flashcard not found' });
    }

    res.json({
      message: 'Flashcard updated successfully',
      flashcard: flashcard
    });
  } catch (error) {
    console.error('Flashcard update error:', error);
    res.status(500).json({ message: 'Server error updating flashcard' });
  }
});

app.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const flashcard = await Flashcard.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!flashcard) {
      return res.status(404).json({ message: 'Flashcard not found' });
    }

    if (flashcard.deckId) {
      const deck = await FlashcardDeck.findById(flashcard.deckId);
      if (deck) {
        deck.cardCount = await Flashcard.countDocuments({ deckId: deck._id });
        await deck.save();
      }
    }

    res.json({ message: 'Flashcard deleted successfully' });
  } catch (error) {
    console.error('Flashcard deletion error:', error);
    res.status(500).json({ message: 'Server error deleting flashcard' });
  }
});

app.post('/:id/review', authMiddleware, async (req, res) => {
  try {
    const { isCorrect } = req.body;

    const flashcard = await Flashcard.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!flashcard) {
      return res.status(404).json({ message: 'Flashcard not found' });
    }

    flashcard.reviewCount += 1;
    if (isCorrect) {
      flashcard.correctCount += 1;
    }
    flashcard.lastReviewed = new Date();

    const accuracy = flashcard.correctCount / flashcard.reviewCount;
    let nextReviewDays = 1;

    if (accuracy >= 0.8) {
      nextReviewDays = Math.min(flashcard.reviewCount * 2, 30);
    } else if (accuracy >= 0.6) {
      nextReviewDays = Math.min(flashcard.reviewCount, 7);
    }

    flashcard.nextReview = new Date(Date.now() + nextReviewDays * 24 * 60 * 60 * 1000);
    await flashcard.save();

    res.json({
      message: 'Review recorded successfully',
      flashcard: flashcard
    });
  } catch (error) {
    console.error('Review recording error:', error);
    res.status(500).json({ message: 'Server error recording review' });
  }
});

app.post('/deck', authMiddleware, async (req, res) => {
  try {
    const { name, description, tags = [] } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Deck name is required' });
    }

    const deck = new FlashcardDeck({
      userId: req.userId,
      name,
      description,
      tags
    });

    await deck.save();

    res.status(201).json({
      message: 'Deck created successfully',
      deck: deck
    });
  } catch (error) {
    console.error('Deck creation error:', error);
    res.status(500).json({ message: 'Server error creating deck' });
  }
});

app.delete('/deck/:id', authMiddleware, async (req, res) => {
  try {
    const deck = await FlashcardDeck.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!deck) {
      return res.status(404).json({ message: 'Deck not found' });
    }

    await Flashcard.deleteMany({ deckId: req.params.id });

    res.json({ message: 'Deck and all associated flashcards deleted successfully' });
  } catch (error) {
    console.error('Deck deletion error:', error);
    res.status(500).json({ message: 'Server error deleting deck' });
  }
});

app.listen(PORT, () => {
  console.log(`Flashcard service running on port ${PORT}`);
});