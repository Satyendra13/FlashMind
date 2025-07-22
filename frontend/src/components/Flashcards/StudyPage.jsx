import React, { useState, useEffect } from "react";
import {
	Container,
	Row,
	Col,
	Card,
	Button,
	Badge,
	ProgressBar,
	Alert,
	Spinner,
	Modal,
} from "react-bootstrap";
import axios from "axios";
import toast from "react-hot-toast";
import {
	Brain,
	Play,
	RotateCcw,
	CheckCircle,
	XCircle,
	Clock,
	Award,
	Target,
	BookOpen,
	ArrowLeft,
	RefreshCw,
	Zap,
	TrendingUp,
	Timer,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import StudyCard from "./StudyCard";
import StudyProgress from "./StudyProgress";
import StudyResults from "./StudyResults";

const StudyPage = () => {
	const { id } = useParams();
	const navigate = useNavigate();

	const [deck, setDeck] = useState(null);
	const [flashcards, setFlashcards] = useState([]);
	const [loading, setLoading] = useState(true);
	const [studySession, setStudySession] = useState({
		totalCards: 0,
		completedCards: 0,
		correctAnswers: 0,
		startTime: null,
		isCompleted: false,
		streak: 0,
		timeSpent: 0,
	});
	const [currentCardIndex, setCurrentCardIndex] = useState(0);
	const [flippedCard, setFlippedCard] = useState(false);
	const [showStartModal, setShowStartModal] = useState(true);
	const [showResultsModal, setShowResultsModal] = useState(false);
	const [sessionStats, setSessionStats] = useState({
		accuracy: 0,
		timeSpent: 0,
		streak: 0,
		bestStreak: 0,
	});

	useEffect(() => {
		if (id) {
			fetchDeckData();
		}
	}, [id]);

	useEffect(() => {
		// Update time spent every second during active session
		let interval;
		if (studySession.startTime && !studySession.isCompleted) {
			interval = setInterval(() => {
				setStudySession((prev) => ({
					...prev,
					timeSpent: Math.round((new Date() - prev.startTime) / 1000),
				}));
			}, 1000);
		}
		return () => clearInterval(interval);
	}, [studySession.startTime, studySession.isCompleted]);

	const fetchDeckData = async () => {
		try {
			setLoading(true);
			const [deckRes, flashcardsRes] = await Promise.all([
				axios.get(`/content/flashcards/deck/${id}`, {
					headers: {
						Authorization: `Bearer ${localStorage.getItem("token")}`,
					},
				}),
				axios.get(`/content/flashcards?id=${id}`, {
					headers: {
						Authorization: `Bearer ${localStorage.getItem("token")}`,
					},
				}),
			]);

			setDeck(deckRes.data);
			setFlashcards(flashcardsRes.data);

			if (flashcardsRes.data.length === 0) {
				toast.error("No flashcards found in this deck");
				navigate("/flashcards");
				return;
			}

			setStudySession((prev) => ({
				...prev,
				totalCards: flashcardsRes.data.length,
			}));
		} catch (error) {
			toast.error("Failed to load deck");
			navigate("/flashcards");
		} finally {
			setLoading(false);
		}
	};

	const startStudySession = () => {
		setStudySession({
			totalCards: flashcards.length,
			completedCards: 0,
			correctAnswers: 0,
			startTime: new Date(),
			isCompleted: false,
			streak: 0,
			timeSpent: 0,
		});
		setCurrentCardIndex(0);
		setFlippedCard(false);
		setShowStartModal(false);
	};

	const handleCardResponse = async (isCorrect) => {
		const currentCard = flashcards[currentCardIndex];

		// Record the review
		try {
			await axios.post(
				`/content/flashcards/${currentCard._id}/review`,
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
		}

		const newCompletedCards = studySession.completedCards + 1;
		const newCorrectAnswers = studySession.correctAnswers + (isCorrect ? 1 : 0);
		const newStreak = isCorrect ? studySession.streak + 1 : 0;

		setStudySession((prev) => ({
			...prev,
			completedCards: newCompletedCards,
			correctAnswers: newCorrectAnswers,
			streak: newStreak,
		}));

		if (currentCardIndex < flashcards.length - 1) {
			setCurrentCardIndex(currentCardIndex + 1);
			setFlippedCard(false);
		} else {
			// Session completed
			const accuracy = Math.round(
				(newCorrectAnswers / flashcards.length) * 100
			);
			const timeSpent = Math.round(
				(new Date() - studySession.startTime) / 1000 / 60
			);

			const finalStats = {
				accuracy,
				timeSpent,
				streak: newStreak,
				bestStreak: Math.max(newStreak, studySession.streak),
			};

			setSessionStats(finalStats);
			setStudySession((prev) => ({
				...prev,
				completedCards: newCompletedCards,
				correctAnswers: newCorrectAnswers,
				streak: newStreak,
				isCompleted: true,
			}));

			setShowResultsModal(true);

			// Show completion toast
			toast.success(
				`Study session complete! Accuracy: ${accuracy}% in ${timeSpent} minutes`
			);
		}
	};

	const restartSession = () => {
		setStudySession({
			totalCards: flashcards.length,
			completedCards: 0,
			correctAnswers: 0,
			startTime: new Date(),
			isCompleted: false,
			streak: 0,
			timeSpent: 0,
		});
		setCurrentCardIndex(0);
		setFlippedCard(false);
		setShowResultsModal(false);
	};

	const endSession = () => {
		setShowResultsModal(false);
		navigate("/flashcards");
	};

	if (loading) {
		return (
			<div className="d-flex justify-content-center align-items-center min-vh-100">
				<div className="text-center">
					<Spinner animation="border" variant="primary" size="lg" />
					<p className="mt-3 text-muted">Loading study session...</p>
				</div>
			</div>
		);
	}

	const currentCard = flashcards[currentCardIndex];
	const progressPercentage =
		(studySession.completedCards / studySession.totalCards) * 100;
	const currentAccuracy =
		studySession.completedCards > 0
			? Math.round(
					(studySession.correctAnswers / studySession.completedCards) * 100
			  )
			: 0;

	return (
		<Container fluid className="py-4">
			{/* Header */}
			<Row className="mb-4">
				<Col>
					<div className="d-flex align-items-center justify-content-between">
						<div className="d-flex align-items-center">
							<Button
								variant="outline-secondary"
								onClick={() => navigate("/flashcards")}
								className="me-3"
								style={{ borderRadius: "50px" }}
							>
								<div className="d-flex align-items-center">
									<ArrowLeft size={16} className="me-2" />
									<span>Back to Flashcards</span>
								</div>
							</Button>
							<div>
								<h1 className="fw-bold mb-1">{deck?.name}</h1>
								<p className="text-muted mb-0">
									Study Session • {flashcards.length} cards
								</p>
							</div>
						</div>
						<Badge
							bg="primary"
							style={{
								fontSize: "1rem",
								padding: "0.75rem 1.5rem",
								borderRadius: "25px",
							}}
						>
							<div className="d-flex align-items-center">
								<BookOpen size={16} className="me-2" />
								<span>Study Mode</span>
							</div>
						</Badge>
					</div>
				</Col>
			</Row>

			{/* Study Progress */}
			{!studySession.isCompleted && studySession.startTime && (
				<StudyProgress
					studySession={studySession}
					currentCardIndex={currentCardIndex}
					totalCards={flashcards.length}
					currentAccuracy={currentAccuracy}
					progressPercentage={progressPercentage}
				/>
			)}

			{/* Study Card */}
			{!studySession.isCompleted && studySession.startTime && currentCard && (
				<Row className="justify-content-center">
					<Col lg={8} xl={6}>
						<StudyCard
							card={currentCard}
							flipped={flippedCard}
							onFlip={() => setFlippedCard(!flippedCard)}
							onResponse={handleCardResponse}
							showResponseButtons={flippedCard}
						/>
					</Col>
				</Row>
			)}

			{/* Start Modal */}
			<Modal
				show={showStartModal}
				onHide={() => navigate("/flashcards")}
				centered
				size="lg"
			>
				<Modal.Header
					style={{
						background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
						color: "white",
						borderBottom: "none",
						borderRadius: "15px 15px 0 0",
					}}
				>
					<Modal.Title className="d-flex align-items-center">
						<Play size={24} className="me-2" />
						<span className="fw-bold">Ready to Study?</span>
					</Modal.Title>
				</Modal.Header>
				<Modal.Body style={{ padding: "2rem" }}>
					<div className="text-center">
						<div className="mb-4">
							<div
								className="rounded-circle mx-auto d-flex align-items-center justify-content-center"
								style={{
									width: "80px",
									height: "80px",
									background:
										"linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
									boxShadow: "0 8px 25px rgba(102, 126, 234, 0.3)",
								}}
							>
								<Brain size={40} className="text-white" />
							</div>
						</div>

						<h4 className="fw-bold mb-3">{deck?.name}</h4>
						<p className="text-muted mb-4">{deck?.description}</p>

						<div className="row g-3 mb-4">
							<div className="col-md-4">
								<div
									className="p-3 rounded text-center"
									style={{ background: "rgba(102, 126, 234, 0.1)" }}
								>
									<h3 className="text-primary fw-bold mb-1">
										{flashcards.length}
									</h3>
									<small className="text-muted">Total Cards</small>
								</div>
							</div>
							<div className="col-md-4">
								<div
									className="p-3 rounded text-center"
									style={{ background: "rgba(40, 167, 69, 0.1)" }}
								>
									<h3 className="text-success fw-bold mb-1">
										{flashcards.filter((card) => card.reviewCount > 0).length}
									</h3>
									<small className="text-muted">Reviewed</small>
								</div>
							</div>
							<div className="col-md-4">
								<div
									className="p-3 rounded text-center"
									style={{ background: "rgba(255, 193, 7, 0.1)" }}
								>
									<h3 className="text-warning fw-bold mb-1">
										{flashcards.length > 0
											? Math.round(
													flashcards.reduce((acc, card) => {
														const accuracy =
															card.reviewCount > 0
																? (card.correctCount / card.reviewCount) * 100
																: 0;
														return acc + accuracy;
													}, 0) / flashcards.length
											  )
											: 0}
										%
									</h3>
									<small className="text-muted">Avg Accuracy</small>
								</div>
							</div>
						</div>

						<Alert
							variant="info"
							className="border-0"
							style={{ background: "rgba(13, 202, 240, 0.1)" }}
						>
							<strong>Study Tips:</strong>
							<ul className="mb-0 mt-2">
								<li>Take your time to think about each answer</li>
								<li>Be honest about your knowledge level</li>
								<li>Review cards you got wrong more frequently</li>
							</ul>
						</Alert>
					</div>
				</Modal.Body>
				<Modal.Footer
					style={{
						borderTop: "none",
						padding: "1rem 2rem 2rem 2rem",
					}}
				>
					<Button
						variant="outline-secondary"
						onClick={() => navigate("/flashcards")}
						style={{
							borderRadius: "50px",
							padding: "0.5rem 1.5rem",
						}}
					>
						<div className="d-flex align-items-center">
							<ArrowLeft size={16} className="me-2" />
							<span>Cancel</span>
						</div>
					</Button>
					<Button
						variant="primary"
						onClick={startStudySession}
						style={{
							borderRadius: "50px",
							padding: "0.5rem 1.5rem",
							background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
							border: "none",
						}}
					>
						<div className="d-flex align-items-center">
							<Play size={16} className="me-2" />
							<span>Start Studying</span>
						</div>
					</Button>
				</Modal.Footer>
			</Modal>

			{/* Results Modal */}
			<StudyResults
				show={showResultsModal}
				onHide={endSession}
				sessionStats={sessionStats}
				totalCards={flashcards.length}
				onRestart={restartSession}
				onFinish={endSession}
			/>
		</Container>
	);
};

export default StudyPage;
