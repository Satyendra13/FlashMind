import React, { useState, useEffect } from "react";
import {
	Container,
	Row,
	Col,
	Card,
	Button,
	Form,
	Modal,
	Badge,
	ProgressBar,
	Alert,
} from "react-bootstrap";
import axios from "axios";
import toast from "react-hot-toast";
import {
	Brain,
	Plus,
	Play,
	Edit,
	Trash2,
	RefreshCw,
	BookOpen,
	Zap,
	Target,
	Award,
	Clock,
	CheckCircle,
	XCircle,
	RotateCcw,
} from "lucide-react";

const Flashcards = () => {
	const [flashcards, setFlashcards] = useState([]);
	const [decks, setDecks] = useState([]);
	const [notes, setNotes] = useState([]);
	const [loading, setLoading] = useState(true);
	const [showGenerateModal, setShowGenerateModal] = useState(false);
	const [showStudyModal, setShowStudyModal] = useState(false);
	const [showCreateDeckModal, setShowCreateDeckModal] = useState(false);
	const [showEditCardModal, setShowEditCardModal] = useState(false);
	const [currentDeck, setCurrentDeck] = useState(null);
	const [currentCardIndex, setCurrentCardIndex] = useState(0);
	const [flippedCard, setFlippedCard] = useState(false);
	const [selectedCard, setSelectedCard] = useState(null);
	const [studySession, setStudySession] = useState({
		totalCards: 0,
		completedCards: 0,
		correctAnswers: 0,
		startTime: null,
	});
	const [generateOptions, setGenerateOptions] = useState({
		noteId: "",
		numberOfCards: 10,
		difficulty: "medium",
		cardType: "basic",
	});
	const [newDeck, setNewDeck] = useState({
		name: "",
		description: "",
		tags: [],
	});
	const [editCard, setEditCard] = useState({
		frontContent: "",
		backContent: "",
		difficulty: "medium",
	});

	useEffect(() => {
		fetchData();
	}, []);

	const fetchData = async () => {
		try {
			const [flashcardsRes, decksRes, notesRes] = await Promise.all([
				axios.get("/flashcards", {
					headers: {
						Authorization: `Bearer ${localStorage.getItem("token")}`,
					},
				}),
				axios.get("/flashcards/decks", {
					headers: {
						Authorization: `Bearer ${localStorage.getItem("token")}`,
					},
				}),
				axios.get("/notes", {
					headers: {
						Authorization: `Bearer ${localStorage.getItem("token")}`,
					},
				}),
			]);

			setFlashcards(flashcardsRes.data);
			setDecks(decksRes.data);
			setNotes(notesRes.data.notes || []);
		} catch (error) {
			console.error("Error fetching data:", error);
			toast.error("Failed to fetch data");
		} finally {
			setLoading(false);
		}
	};

	const generateFlashcards = async () => {
		try {
			if (!generateOptions.noteId) {
				toast.error("Please select a note");
				return;
			}

			const response = await axios.post(
				"/flashcards/generate",
				generateOptions,
				{
					headers: {
						Authorization: `Bearer ${localStorage.getItem("token")}`,
					},
				}
			);

			toast.success(`Generated ${response.data.flashcards.length} flashcards!`);
			fetchData();
			setShowGenerateModal(false);
			setGenerateOptions({
				noteId: "",
				numberOfCards: 10,
				difficulty: "medium",
				cardType: "basic",
			});
		} catch (error) {
			console.error("Generate flashcards error:", error);
			toast.error("Failed to generate flashcards");
		}
	};

	const createDeck = async () => {
		try {
			if (!newDeck.name.trim()) {
				toast.error("Deck name is required");
				return;
			}

			await axios.post("/flashcards/deck", newDeck, {
				headers: {
					Authorization: `Bearer ${localStorage.getItem("token")}`,
				},
			});

			toast.success("Deck created successfully!");
			fetchData();
			setShowCreateDeckModal(false);
			setNewDeck({
				name: "",
				description: "",
				tags: [],
			});
		} catch (error) {
			console.error("Create deck error:", error);
			toast.error("Failed to create deck");
		}
	};

	const deleteDeck = async (deckId) => {
		if (
			window.confirm(
				"Are you sure you want to delete this deck and all its cards?"
			)
		) {
			try {
				await axios.delete(`/flashcards/deck/${deckId}`, {
					headers: {
						Authorization: `Bearer ${localStorage.getItem("token")}`,
					},
				});

				toast.success("Deck deleted successfully!");
				fetchData();
			} catch (error) {
				console.error("Delete deck error:", error);
				toast.error("Failed to delete deck");
			}
		}
	};

	const startStudySession = (deck) => {
		const deckCards = flashcards.filter(
			(card) => card.deckId?._id === deck._id
		);
		if (deckCards.length === 0) {
			toast.error("No flashcards found in this deck");
			return;
		}

		setCurrentDeck(deck);
		setCurrentCardIndex(0);
		setFlippedCard(false);
		setStudySession({
			totalCards: deckCards.length,
			completedCards: 0,
			correctAnswers: 0,
			startTime: new Date(),
		});
		setShowStudyModal(true);
	};

	const handleCardResponse = async (isCorrect) => {
		const deckCards = flashcards.filter(
			(card) => card.deckId?._id === currentDeck._id
		);
		const currentCard = deckCards[currentCardIndex];

		// Record the review
		try {
			await axios.post(
				`/flashcards/${currentCard._id}/review`,
				{
					isCorrect,
				},
				{
					headers: {
						Authorization: `Bearer ${localStorage.getItem("token")}`,
					},
				}
			);
		} catch (error) {
			console.error("Error recording review:", error);
		}

		setStudySession((prev) => ({
			...prev,
			completedCards: prev.completedCards + 1,
			correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
		}));

		if (currentCardIndex < deckCards.length - 1) {
			setCurrentCardIndex(currentCardIndex + 1);
			setFlippedCard(false);
		} else {
			const accuracy = Math.round(
				((studySession.correctAnswers + (isCorrect ? 1 : 0)) /
					deckCards.length) *
					100
			);
			const timeSpent = Math.round(
				(new Date() - studySession.startTime) / 1000 / 60
			);
			toast.success(
				`Study session complete! Accuracy: ${accuracy}% in ${timeSpent} minutes`
			);
			setShowStudyModal(false);
			fetchData(); // Refresh to get updated review data
		}
	};

	const editCardHandler = (card) => {
		setSelectedCard(card);
		setEditCard({
			frontContent: card.frontContent,
			backContent: card.backContent,
			difficulty: card.difficulty,
		});
		setShowEditCardModal(true);
	};

	const updateCard = async () => {
		try {
			if (!editCard.frontContent.trim() || !editCard.backContent.trim()) {
				toast.error("Front and back content are required");
				return;
			}

			await axios.put(`/flashcards/${selectedCard._id}`, editCard, {
				headers: {
					Authorization: `Bearer ${localStorage.getItem("token")}`,
				},
			});

			toast.success("Card updated successfully!");
			fetchData();
			setShowEditCardModal(false);
			setSelectedCard(null);
		} catch (error) {
			console.error("Update card error:", error);
			toast.error("Failed to update card");
		}
	};

	const deleteCard = async (cardId) => {
		if (window.confirm("Are you sure you want to delete this card?")) {
			try {
				await axios.delete(`/flashcards/${cardId}`, {
					headers: {
						Authorization: `Bearer ${localStorage.getItem("token")}`,
					},
				});

				toast.success("Card deleted successfully!");
				fetchData();
			} catch (error) {
				console.error("Delete card error:", error);
				toast.error("Failed to delete card");
			}
		}
	};

	const FlashcardComponent = ({ card, flipped, onFlip }) => (
		<div className={`flashcard ${flipped ? "flipped" : ""}`} onClick={onFlip}>
			<div className="flashcard-inner">
				<div className="flashcard-front">
					<div className="d-flex justify-content-between align-items-start mb-3">
						<Badge bg="primary">Front</Badge>
						<DifficultyBadge difficulty={card.difficulty} />
					</div>
					<div className="d-flex align-items-center justify-content-center h-100">
						<h5 className="mb-0 text-center">{card.frontContent}</h5>
					</div>
				</div>
				<div className="flashcard-back">
					<div className="d-flex justify-content-between align-items-start mb-3">
						<Badge bg="light" text="dark">
							Back
						</Badge>
						<small className="text-light">Click to flip</small>
					</div>
					<div className="d-flex align-items-center justify-content-center h-100">
						<h5 className="mb-0 text-center">{card.backContent}</h5>
					</div>
				</div>
			</div>
		</div>
	);

	const DifficultyBadge = ({ difficulty }) => {
		const colors = {
			easy: "success",
			medium: "warning",
			hard: "danger",
		};
		return <Badge bg={colors[difficulty]}>{difficulty}</Badge>;
	};

	if (loading) {
		return (
			<div className="d-flex justify-content-center align-items-center min-vh-100">
				<div className="spinner-border text-primary" role="status">
					<span className="visually-hidden">Loading...</span>
				</div>
			</div>
		);
	}

	const deckCards = currentDeck
		? flashcards.filter((card) => card.deckId?._id === currentDeck._id)
		: [];
	const currentCard = deckCards[currentCardIndex];

	// Calculate statistics
	const totalCards = flashcards.length;
	const totalDecks = decks.length;
	const averageAccuracy =
		flashcards.length > 0
			? Math.round(
					flashcards.reduce((acc, card) => {
						const accuracy =
							card.reviewCount > 0
								? (card.correctCount / card.reviewCount) * 100
								: 0;
						return acc + accuracy;
					}, 0) / flashcards.length
			  )
			: 0;

	return (
		<Container fluid className="py-4">
			<Row className="mb-4">
				<Col md={8}>
					<h1 className="fw-bold mb-1">Flashcards</h1>
					<p className="text-muted mb-0">
						Create and study with AI-generated flashcards
					</p>
				</Col>
				<Col md={4} className="text-md-end">
					<Button
						variant="outline-primary"
						className="me-2"
						onClick={() => setShowCreateDeckModal(true)}
					>
						<div className="d-flex justify-content-between align-items-center">
							<Plus size={16} className="me-2" />
							<span>Create Deck</span>
						</div>
					</Button>
					<Button variant="primary" onClick={() => setShowGenerateModal(true)}>
						<div className="d-flex justify-content-between align-items-center">
							<Zap size={16} className="me-2" />
							<span>Generate Cards</span>
						</div>
					</Button>
				</Col>
			</Row>

			<Row className="g-4 mb-5">
				<Col md={3}>
					<Card className="text-center border-0 shadow-sm">
						<Card.Body>
							<div className="rounded-circle bg-primary bg-opacity-10 p-3 mx-auto mb-3 d-inline-flex">
								<Brain className="text-primary" size={24} />
							</div>
							<h3 className="fw-bold">{totalCards}</h3>
							<p className="text-muted mb-0">Total Cards</p>
						</Card.Body>
					</Card>
				</Col>
				<Col md={3}>
					<Card className="text-center border-0 shadow-sm">
						<Card.Body>
							<div className="rounded-circle bg-success bg-opacity-10 p-3 mx-auto mb-3 d-inline-flex">
								<BookOpen className="text-success" size={24} />
							</div>
							<h3 className="fw-bold">{totalDecks}</h3>
							<p className="text-muted mb-0">Study Decks</p>
						</Card.Body>
					</Card>
				</Col>
				<Col md={3}>
					<Card className="text-center border-0 shadow-sm">
						<Card.Body>
							<div className="rounded-circle bg-warning bg-opacity-10 p-3 mx-auto mb-3 d-inline-flex">
								<Target className="text-warning" size={24} />
							</div>
							<h3 className="fw-bold">{averageAccuracy}%</h3>
							<p className="text-muted mb-0">Average Accuracy</p>
						</Card.Body>
					</Card>
				</Col>
				<Col md={3}>
					<Card className="text-center border-0 shadow-sm">
						<Card.Body>
							<div className="rounded-circle bg-info bg-opacity-10 p-3 mx-auto mb-3 d-inline-flex">
								<Award className="text-info" size={24} />
							</div>
							<h3 className="fw-bold">7</h3>
							<p className="text-muted mb-0">Day Streak</p>
						</Card.Body>
					</Card>
				</Col>
			</Row>

			<Row className="mb-4">
				<Col>
					<h3 className="fw-bold mb-3">Study Decks</h3>
				</Col>
			</Row>

			{decks.length > 0 ? (
				<Row className="g-4">
					{decks.map((deck) => {
						const deckFlashcards = flashcards.filter(
							(card) => card.deckId?._id === deck._id
						);
						return (
							<Col key={deck._id} md={6} lg={4}>
								<Card className="h-100 border-0 shadow-sm hover-lift">
									<Card.Body className="d-flex flex-column">
										<div className="d-flex justify-content-between align-items-start mb-3">
											<h5 className="fw-bold mb-0">{deck.name}</h5>
											<Badge bg="secondary">
												{deckFlashcards.length} cards
											</Badge>
										</div>

										<p className="text-muted mb-3">{deck.description}</p>

										{deck.tags && deck.tags.length > 0 && (
											<div className="mb-3">
												{deck.tags.map((tag, index) => (
													<Badge
														key={index}
														bg="light"
														text="dark"
														className="me-1"
													>
														{tag}
													</Badge>
												))}
											</div>
										)}

										<div className="d-flex justify-content-between align-items-center mb-3">
											<small className="text-muted">
												Created {new Date(deck.createdAt).toLocaleDateString()}
											</small>
										</div>

										<div className="flex-grow-1"></div>

										<div className="d-flex gap-2">
											<Button
												variant="primary"
												size="sm"
												onClick={() => startStudySession(deck)}
												disabled={deckFlashcards.length === 0}
												className="flex-grow-1"
											>
												<div className="d-flex justify-content-center align-items-center">
													<Play size={12} className="me-1" />
													<span>Study</span>
												</div>
											</Button>
											<Button
												variant="outline-danger"
												size="sm"
												onClick={() => deleteDeck(deck._id)}
											>
												<Trash2 size={12} />
											</Button>
										</div>
									</Card.Body>
								</Card>
							</Col>
						);
					})}
				</Row>
			) : (
				<div className="text-center py-5">
					<Brain size={64} className="text-muted mb-3" />
					<h4 className="text-muted mb-2">No flashcard decks yet</h4>
					<p className="text-muted mb-4">
						Generate your first set of flashcards from your notes using AI.
					</p>
					<Button variant="primary" onClick={() => setShowGenerateModal(true)}>
						<div className="d-flex justify-content-between align-items-center">
							<Zap size={16} className="me-2" />
							<span>Generate Your First Deck</span>
						</div>
					</Button>
				</div>
			)}

			{/* Individual Cards Section */}
			{flashcards.length > 0 && (
				<>
					<Row className="mb-4 mt-5">
						<Col>
							<h3 className="fw-bold mb-3">All Cards</h3>
						</Col>
					</Row>
					<Row className="g-4">
						{flashcards.map((card) => (
							<Col key={card._id} md={6} lg={4}>
								<Card className="h-100 border-0 shadow-sm">
									<Card.Body>
										<div className="d-flex justify-content-between align-items-start mb-2">
											<Badge bg="light" text="dark">
												{card.deckId?.name || "No Deck"}
											</Badge>
											<DifficultyBadge difficulty={card.difficulty} />
										</div>
										<h6 className="fw-bold mb-2">{card.frontContent}</h6>
										<p className="text-muted small mb-3">{card.backContent}</p>

										{card.reviewCount > 0 && (
											<div className="mb-3">
												<small className="text-muted">
													Accuracy:{" "}
													{Math.round(
														(card.correctCount / card.reviewCount) * 100
													)}
													% ({card.correctCount}/{card.reviewCount})
												</small>
											</div>
										)}

										<div className="d-flex gap-2">
											<Button
												variant="outline-primary"
												size="sm"
												onClick={() => editCardHandler(card)}
											>
												<Edit size={12} />
											</Button>
											<Button
												variant="outline-danger"
												size="sm"
												onClick={() => deleteCard(card._id)}
											>
												<Trash2 size={12} />
											</Button>
										</div>
									</Card.Body>
								</Card>
							</Col>
						))}
					</Row>
				</>
			)}

			{/* Generate Flashcards Modal */}
			<Modal
				show={showGenerateModal}
				onHide={() => setShowGenerateModal(false)}
			>
				<Modal.Header closeButton>
					<Modal.Title>Generate Flashcards</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<Form>
						<Form.Group className="mb-3">
							<Form.Label>Select Note</Form.Label>
							<Form.Select
								value={generateOptions.noteId}
								onChange={(e) =>
									setGenerateOptions({
										...generateOptions,
										noteId: e.target.value,
									})
								}
								required
							>
								<option value="">Choose a note...</option>
								{notes.length > 0 &&
									notes.map((note) => (
										<option key={note._id} value={note._id}>
											{note.title}
										</option>
									))}
							</Form.Select>
						</Form.Group>

						<Form.Group className="mb-3">
							<Form.Label>Number of Cards</Form.Label>
							<Form.Select
								value={generateOptions.numberOfCards}
								onChange={(e) =>
									setGenerateOptions({
										...generateOptions,
										numberOfCards: parseInt(e.target.value),
									})
								}
							>
								<option value={5}>5 cards</option>
								<option value={10}>10 cards</option>
								<option value={15}>15 cards</option>
								<option value={20}>20 cards</option>
							</Form.Select>
						</Form.Group>

						<Form.Group className="mb-3">
							<Form.Label>Difficulty Level</Form.Label>
							<Form.Select
								value={generateOptions.difficulty}
								onChange={(e) =>
									setGenerateOptions({
										...generateOptions,
										difficulty: e.target.value,
									})
								}
							>
								<option value="easy">Easy</option>
								<option value="medium">Medium</option>
								<option value="hard">Hard</option>
							</Form.Select>
						</Form.Group>

						<Form.Group className="mb-3">
							<Form.Label>Card Type</Form.Label>
							<Form.Select
								value={generateOptions.cardType}
								onChange={(e) =>
									setGenerateOptions({
										...generateOptions,
										cardType: e.target.value,
									})
								}
							>
								<option value="basic">Basic (Question/Answer)</option>
								<option value="cloze">Cloze (Fill in the blank)</option>
								<option value="multiple_choice">Multiple Choice</option>
							</Form.Select>
						</Form.Group>
					</Form>
				</Modal.Body>
				<Modal.Footer>
					<Button
						variant="secondary"
						onClick={() => setShowGenerateModal(false)}
					>
						Cancel
					</Button>
					<Button
						variant="primary"
						onClick={generateFlashcards}
						disabled={!generateOptions.noteId}
					>
						<div className="d-flex justify-content-between align-items-center">
							<Zap size={16} className="me-2" />
							<span>Generate Cards</span>
						</div>
					</Button>
				</Modal.Footer>
			</Modal>

			{/* Create Deck Modal */}
			<Modal
				show={showCreateDeckModal}
				onHide={() => setShowCreateDeckModal(false)}
			>
				<Modal.Header closeButton>
					<Modal.Title>Create New Deck</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<Form>
						<Form.Group className="mb-3">
							<Form.Label>Deck Name</Form.Label>
							<Form.Control
								type="text"
								value={newDeck.name}
								onChange={(e) =>
									setNewDeck({ ...newDeck, name: e.target.value })
								}
								placeholder="Enter deck name"
							/>
						</Form.Group>
						<Form.Group className="mb-3">
							<Form.Label>Description</Form.Label>
							<Form.Control
								as="textarea"
								rows={3}
								value={newDeck.description}
								onChange={(e) =>
									setNewDeck({ ...newDeck, description: e.target.value })
								}
								placeholder="Enter deck description"
							/>
						</Form.Group>
					</Form>
				</Modal.Body>
				<Modal.Footer>
					<Button
						variant="secondary"
						onClick={() => setShowCreateDeckModal(false)}
					>
						Cancel
					</Button>
					<Button variant="primary" onClick={createDeck}>
						<div className="d-flex justify-content-between align-items-center">
							<Plus size={16} className="me-2" />
							<span>Create Deck</span>
						</div>
					</Button>
				</Modal.Footer>
			</Modal>

			{/* Edit Card Modal */}
			<Modal
				show={showEditCardModal}
				onHide={() => setShowEditCardModal(false)}
			>
				<Modal.Header closeButton>
					<Modal.Title>Edit Card</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<Form>
						<Form.Group className="mb-3">
							<Form.Label>Front Content</Form.Label>
							<Form.Control
								as="textarea"
								rows={3}
								value={editCard.frontContent}
								onChange={(e) =>
									setEditCard({ ...editCard, frontContent: e.target.value })
								}
								placeholder="Enter front content"
							/>
						</Form.Group>
						<Form.Group className="mb-3">
							<Form.Label>Back Content</Form.Label>
							<Form.Control
								as="textarea"
								rows={3}
								value={editCard.backContent}
								onChange={(e) =>
									setEditCard({ ...editCard, backContent: e.target.value })
								}
								placeholder="Enter back content"
							/>
						</Form.Group>
						<Form.Group className="mb-3">
							<Form.Label>Difficulty</Form.Label>
							<Form.Select
								value={editCard.difficulty}
								onChange={(e) =>
									setEditCard({ ...editCard, difficulty: e.target.value })
								}
							>
								<option value="easy">Easy</option>
								<option value="medium">Medium</option>
								<option value="hard">Hard</option>
							</Form.Select>
						</Form.Group>
					</Form>
				</Modal.Body>
				<Modal.Footer>
					<Button
						variant="secondary"
						onClick={() => setShowEditCardModal(false)}
					>
						Cancel
					</Button>
					<Button variant="primary" onClick={updateCard}>
						<div className="d-flex justify-content-between align-items-center">
							<Edit size={16} className="me-2" />
							<span>Update Card</span>
						</div>
					</Button>
				</Modal.Footer>
			</Modal>

			{/* Study Modal */}
			<Modal
				show={showStudyModal}
				onHide={() => {}}
				size="lg"
				backdrop="static"
			>
				<Modal.Header>
					<Modal.Title className="d-flex align-items-center">
						<span className="me-3">{currentDeck?.name}</span>
						<Badge bg="primary">
							<Clock size={12} className="me-1" />
							Study Mode
						</Badge>
					</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<div className="mb-4">
						<div className="d-flex justify-content-between align-items-center mb-2">
							<span>Progress</span>
							<span>
								{studySession.completedCards} of {studySession.totalCards}
							</span>
						</div>
						<ProgressBar
							now={
								(studySession.completedCards / studySession.totalCards) * 100
							}
							className="mb-2"
						/>
						<div className="d-flex justify-content-between text-muted small">
							<span>
								Accuracy:{" "}
								{studySession.completedCards > 0
									? Math.round(
											(studySession.correctAnswers /
												studySession.completedCards) *
												100
									  )
									: 0}
								%
							</span>
							<span>Card {currentCardIndex + 1}</span>
						</div>
					</div>

					{currentCard && (
						<>
							<FlashcardComponent
								card={currentCard}
								flipped={flippedCard}
								onFlip={() => setFlippedCard(!flippedCard)}
							/>

							<div className="text-center mt-4">
								{!flippedCard ? (
									<Button
										variant="outline-primary"
										onClick={() => setFlippedCard(true)}
									>
										<div className="d-flex justify-content-between align-items-center">
											<RotateCcw size={16} className="me-2" />
											<span>Reveal Answer</span>
										</div>
									</Button>
								) : (
									<div>
										<p className="mb-3">How well did you know this?</p>
										<div className="d-flex gap-2 justify-content-center">
											<Button
												variant="danger"
												onClick={() => handleCardResponse(false)}
											>
												<div className="d-flex justify-content-between align-items-center">
													<XCircle size={16} className="me-2" />
													<span> Incorrect </span>
												</div>
											</Button>
											<Button
												variant="success"
												onClick={() => handleCardResponse(true)}
											>
												<div className="d-flex justify-content-between align-items-center">
													<CheckCircle size={16} className="me-2" />
													<span>Correct</span>
												</div>
											</Button>
										</div>
									</div>
								)}
							</div>
						</>
					)}
				</Modal.Body>
				<Modal.Footer>
					<Button
						variant="outline-secondary"
						onClick={() => setShowStudyModal(false)}
					>
						End Session
					</Button>
				</Modal.Footer>
			</Modal>
		</Container>
	);
};

export default Flashcards;
