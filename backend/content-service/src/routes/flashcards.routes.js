const express = require("express");
const router = express.Router();
const flashcardsController = require("../controllers/flashcards.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.post(
	"/generate",
	authMiddleware,
	flashcardsController.generateFlashcards
);
router.get("/decks", authMiddleware, flashcardsController.getDecks);
router.get("/deck/:id", authMiddleware, flashcardsController.getDeckById);
router.post("/deck", authMiddleware, flashcardsController.createDeck);
router.delete("/deck/:id", authMiddleware, flashcardsController.deleteDeck);
router.get("/", authMiddleware, flashcardsController.getAllFlashcards);
router.get("/:id", authMiddleware, flashcardsController.getFlashcardById);
router.put("/:id", authMiddleware, flashcardsController.updateFlashcard);
router.delete("/:id", authMiddleware, flashcardsController.deleteFlashcard);
router.post(
	"/:id/review",
	authMiddleware,
	flashcardsController.reviewFlashcard
);

module.exports = router;
