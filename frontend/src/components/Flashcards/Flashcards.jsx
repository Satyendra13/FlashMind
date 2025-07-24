import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
	Container,
	Row,
	Col,
	Card,
	Button,
	Form,
	Modal,
	Badge,
	Spinner,
} from "react-bootstrap";
import axios from "axios";
import toast from "react-hot-toast";
import {
	Brain,
	Plus,
	Play,
	Edit,
	Trash2,
	BookOpen,
	Zap,
	Target,
	Award,
} from "lucide-react";

const Flashcards = () => {
	const navigate = useNavigate();
	const [flashcards, setFlashcards] = useState([]);
	const [decks, setDecks] = useState([]);
	const [notes, setNotes] = useState([]);
	const [loading, setLoading] = useState(true);
	const [showGenerateModal, setShowGenerateModal] = useState(false);
	const [showCreateDeckModal, setShowCreateDeckModal] = useState(false);
	const [showEditCardModal, setShowEditCardModal] = useState(false);
	const [selectedCard, setSelectedCard] = useState(null);
	const [generateOptions, setGenerateOptions] = useState({
		source: "note",
		sourceId: "",
		title: "",
		numberOfCards: 10,
		difficulty: "medium",
		cardType: "basic",
		language: "english",
		customPrompt: "",
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
	const [generateLoading, setGenerateLoading] = useState(false);
	const [createDeckLoading, setCreateDeckLoading] = useState(false);
	const [deleteDeckLoading, setDeleteDeckLoading] = useState(null); // deckId or null
	const [updateCardLoading, setUpdateCardLoading] = useState(false);
	const [deleteCardLoading, setDeleteCardLoading] = useState(null); // cardId or null

	useEffect(() => {
		fetchData();
	}, []);

	const fetchData = async () => {
		try {
			const [flashcardsRes, decksRes, notesRes] = await Promise.all([
				axios.get("/content/flashcards", {
					headers: {
						Authorization: `Bearer ${localStorage.getItem("token")}`,
					},
				}),
				axios.get("/content/flashcards/decks", {
					headers: {
						Authorization: `Bearer ${localStorage.getItem("token")}`,
					},
				}),
				axios.get("/content/notes", {
					headers: {
						Authorization: `Bearer ${localStorage.getItem("token")}`,
					},
				}),
			]);

			setFlashcards(flashcardsRes.data);
			setDecks(decksRes.data);
			setNotes(notesRes.data.notes || []);
		} catch (error) {
			toast.error("Failed to fetch data");
		} finally {
			setLoading(false);
		}
	};

	const generateFlashcards = async () => {
		try {
			if (generateOptions.source === "custom") {
				if (
					!generateOptions.customPrompt.trim() ||
					!generateOptions.title?.trim()
				) {
					toast.error(
						"Please provide both title and custom prompt for custom flashcards"
					);
					return;
				}
			} else if (!generateOptions.sourceId) {
				toast.error("Please select a note");
				return;
			}
			setGenerateLoading(true);
			const optionsToSend = { ...generateOptions };
			if (generateOptions.source === "note") {
				optionsToSend.numberOfCards = 0;
				// If totalFlashcard is ever sent, set to 0
				if (optionsToSend.totalFlashcard !== undefined)
					optionsToSend.totalFlashcard = 0;
			}
			const response = await axios.post(
				"/content/flashcards/generate",
				optionsToSend,
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
				source: "note",
				sourceId: "",
				title: "",
				numberOfCards: 10,
				difficulty: "medium",
				cardType: "basic",
				language: "english",
				customPrompt: "",
			});
		} catch (error) {
			toast.error("Failed to generate flashcards");
		} finally {
			setGenerateLoading(false);
		}
	};

	const createDeck = async () => {
		try {
			if (!newDeck.name.trim()) {
				toast.error("Deck name is required");
				return;
			}
			setCreateDeckLoading(true);
			await axios.post("/content/flashcards/deck", newDeck, {
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
			toast.error("Failed to create deck");
		} finally {
			setCreateDeckLoading(false);
		}
	};

	const deleteDeck = async (deckId) => {
		if (
			window.confirm(
				"Are you sure you want to delete this deck and all its cards?"
			)
		) {
			try {
				setDeleteDeckLoading(deckId);
				await axios.delete(`/content/flashcards/deck/${deckId}`, {
					headers: {
						Authorization: `Bearer ${localStorage.getItem("token")}`,
					},
				});

				toast.success("Deck deleted successfully!");
				fetchData();
			} catch (error) {
				toast.error("Failed to delete deck");
			} finally {
				setDeleteDeckLoading(null);
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

		// Navigate to the dedicated study page using React Router
		navigate(`/flashcards/study/${deck._id}`);
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
			setUpdateCardLoading(true);
			await axios.put(`/content/flashcards/${selectedCard._id}`, editCard, {
				headers: {
					Authorization: `Bearer ${localStorage.getItem("token")}`,
				},
			});

			toast.success("Card updated successfully!");
			fetchData();
			setShowEditCardModal(false);
			setSelectedCard(null);
		} catch (error) {
			toast.error("Failed to update card");
		} finally {
			setUpdateCardLoading(false);
		}
	};

	const deleteCard = async (cardId) => {
		if (window.confirm("Are you sure you want to delete this card?")) {
			try {
				setDeleteCardLoading(cardId);
				await axios.delete(`/content/flashcards/${cardId}`, {
					headers: {
						Authorization: `Bearer ${localStorage.getItem("token")}`,
					},
				});

				toast.success("Card deleted successfully!");
				fetchData();
			} catch (error) {
				toast.error("Failed to delete card");
			} finally {
				setDeleteCardLoading(null);
			}
		}
	};

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
						disabled={createDeckLoading}
					>
						<div className="d-flex justify-content-between align-items-center">
							<Plus size={16} className="me-2" />
							<span>Create Deck</span>
						</div>
						{createDeckLoading && (
							<Spinner size="sm" animation="border" className="ms-2" />
						)}
					</Button>
					<Button
						variant="primary"
						onClick={() => setShowGenerateModal(true)}
						disabled={generateLoading}
					>
						<div className="d-flex justify-content-between align-items-center">
							<Zap size={16} className="me-2" />
							<span>Generate Cards</span>
						</div>
						{generateLoading && (
							<Spinner size="sm" animation="border" className="ms-2" />
						)}
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
												disabled={deleteDeckLoading === deck._id}
											>
												{deleteDeckLoading === deck._id ? (
													<Spinner
														size="sm"
														animation="border"
														className="me-1"
													/>
												) : (
													<Trash2 size={12} />
												)}
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
					<div className="d-flex flex-column align-items-center">
						<Brain size={64} className="text-muted mb-3" />
						<h4 className="text-muted mb-2">No flashcard decks yet</h4>
						<p className="text-muted mb-4">
							Generate your first set of flashcards from your notes using AI.
						</p>
						<Button
							variant="primary"
							onClick={() => setShowGenerateModal(true)}
							disabled={generateLoading}
						>
							<div className="d-flex justify-content-between align-items-center">
								<Zap size={16} className="me-2" />
								<span>Generate Your First Deck</span>
							</div>
							{generateLoading && (
								<Spinner size="sm" animation="border" className="ms-2" />
							)}
						</Button>
					</div>
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
												disabled={updateCardLoading}
											>
												<Edit size={12} />
												{updateCardLoading && (
													<Spinner
														size="sm"
														animation="border"
														className="ms-2"
													/>
												)}
											</Button>
											<Button
												variant="outline-danger"
												size="sm"
												onClick={() => deleteCard(card._id)}
												disabled={deleteCardLoading === card._id}
											>
												{deleteCardLoading === card._id ? (
													<Spinner
														size="sm"
														animation="border"
														className="ms-1"
													/>
												) : (
													<Trash2 size={12} />
												)}
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
				onHide={generateLoading ? undefined : () => setShowGenerateModal(false)}
				backdrop={generateLoading ? "static" : true}
			>
				<Modal.Header closeButton={!generateLoading}>
					<Modal.Title>Generate Flashcards</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<Form>
						<Form.Group className="mb-3">
							<Form.Label>Source Type</Form.Label>
							<Form.Select
								value={generateOptions.source}
								onChange={(e) =>
									setGenerateOptions({
										...generateOptions,
										source: e.target.value,
										sourceId: "",
										title: "",
										customPrompt: "",
									})
								}
								disabled={generateLoading}
							>
								<option value="note">From Note</option>
								<option value="custom">Custom</option>
							</Form.Select>
						</Form.Group>
						{generateOptions.source === "custom" && (
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
									disabled={generateLoading}
								>
									<option value={5}>5 cards</option>
									<option value={10}>10 cards</option>
									<option value={15}>15 cards</option>
									<option value={20}>20 cards</option>
								</Form.Select>
							</Form.Group>
						)}

						{generateOptions.source === "note" ? (
							<Form.Group className="mb-3">
								<Form.Label>Select Note</Form.Label>
								<Form.Select
									value={generateOptions.sourceId}
									onChange={(e) =>
										setGenerateOptions({
											...generateOptions,
											sourceId: e.target.value,
										})
									}
									required
									disabled={generateLoading}
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
						) : (
							<>
								<Form.Group className="mb-3">
									<Form.Label>Deck Title</Form.Label>
									<Form.Control
										type="text"
										value={generateOptions.title || ""}
										onChange={(e) =>
											setGenerateOptions({
												...generateOptions,
												title: e.target.value,
											})
										}
										placeholder="Enter deck title (e.g., 'World War II Flashcards')"
										required
										disabled={generateLoading}
									/>
								</Form.Group>

								<Form.Group className="mb-3">
									<Form.Label>Custom Requirements</Form.Label>
									<Form.Control
										as="textarea"
										rows={4}
										value={generateOptions.customPrompt}
										onChange={(e) =>
											setGenerateOptions({
												...generateOptions,
												customPrompt: e.target.value,
											})
										}
										placeholder="Describe your flashcard requirements (e.g., 'Create flashcards about World War II')"
										required
										disabled={generateLoading}
									/>
								</Form.Group>
							</>
						)}

						<Form.Group className="mb-3">
							<Form.Label>Language</Form.Label>
							<Form.Select
								value={generateOptions.language}
								onChange={(e) =>
									setGenerateOptions({
										...generateOptions,
										language: e.target.value,
									})
								}
								disabled={generateLoading}
							>
								<option value="english">English</option>
								<option value="hindi">Hindi</option>
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
								disabled={generateLoading}
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
								disabled={generateLoading}
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
						disabled={generateLoading}
					>
						Cancel
					</Button>
					<Button
						variant="primary"
						onClick={generateFlashcards}
						disabled={
							generateLoading ||
							(generateOptions.source === "custom"
								? !generateOptions.customPrompt.trim() ||
								  !generateOptions.title?.trim()
								: !generateOptions.sourceId)
						}
					>
						{generateLoading ? (
							<Spinner size="sm" animation="border" className="me-2" />
						) : null}
						Generate Cards
					</Button>
				</Modal.Footer>
			</Modal>

			{/* Create Deck Modal */}
			<Modal
				show={showCreateDeckModal}
				onHide={() => setShowCreateDeckModal(false)}
				backdrop={createDeckLoading}
			>
				<Modal.Header closeButton={!createDeckLoading}>
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
								disabled={createDeckLoading}
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
								disabled={createDeckLoading}
							/>
						</Form.Group>
					</Form>
				</Modal.Body>
				<Modal.Footer>
					<Button
						variant="secondary"
						onClick={() => setShowCreateDeckModal(false)}
						disabled={createDeckLoading}
					>
						Cancel
					</Button>
					<Button
						variant="primary"
						onClick={createDeck}
						disabled={createDeckLoading}
					>
						<div className="d-flex justify-content-between align-items-center">
							<Plus size={16} className="me-2" />
							<span>Create Deck</span>
						</div>
						{createDeckLoading && (
							<Spinner size="sm" animation="border" className="ms-2" />
						)}
					</Button>
				</Modal.Footer>
			</Modal>

			{/* Edit Card Modal */}
			<Modal
				show={showEditCardModal}
				onHide={() => setShowEditCardModal(false)}
				backdrop={updateCardLoading}
			>
				<Modal.Header closeButton={!updateCardLoading}>
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
								disabled={updateCardLoading}
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
								disabled={updateCardLoading}
							/>
						</Form.Group>
						<Form.Group className="mb-3">
							<Form.Label>Difficulty</Form.Label>
							<Form.Select
								value={editCard.difficulty}
								onChange={(e) =>
									setEditCard({ ...editCard, difficulty: e.target.value })
								}
								disabled={updateCardLoading}
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
						disabled={updateCardLoading}
					>
						Cancel
					</Button>
					<Button
						variant="primary"
						onClick={updateCard}
						disabled={updateCardLoading}
					>
						<div className="d-flex justify-content-between align-items-center">
							<Edit size={16} className="me-2" />
							<span>Update Card</span>
						</div>
						{updateCardLoading && (
							<Spinner size="sm" animation="border" className="ms-2" />
						)}
					</Button>
				</Modal.Footer>
			</Modal>
		</Container>
	);
};

export default Flashcards;
