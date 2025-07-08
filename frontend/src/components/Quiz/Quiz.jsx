import React, { useState, useEffect } from "react";
import {
	Container,
	Row,
	Col,
	Card,
	Button,
	Form,
	Modal,
	ProgressBar,
	Alert,
	Badge,
	Spinner,
} from "react-bootstrap";
import axios from "axios";
import toast from "react-hot-toast";
import {
	Play,
	Clock,
	CheckCircle,
	XCircle,
	Award,
	Target,
	BarChart3,
	RefreshCw,
	Plus,
	Trash2,
	Eye,
	Calendar,
	TrendingUp,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const Quiz = () => {
	const [quizzes, setQuizzes] = useState([]);
	const [notes, setNotes] = useState([]);
	const [decks, setDecks] = useState([]);
	const [quizHistory, setQuizHistory] = useState([]);
	const [loading, setLoading] = useState(true);
	const [showGenerateModal, setShowGenerateModal] = useState(false);
	const [showQuizModal, setShowQuizModal] = useState(false);
	const [showResultsModal, setShowResultsModal] = useState(false);
	const [showHistoryModal, setShowHistoryModal] = useState(false);
	const [currentQuiz, setCurrentQuiz] = useState(null);
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [userAnswers, setUserAnswers] = useState([]);
	const [timeLeft, setTimeLeft] = useState(0);
	const [quizResults, setQuizResults] = useState(null);
	const [quizStartTime, setQuizStartTime] = useState(null);
	const [generateOptions, setGenerateOptions] = useState({
		source: "note",
		sourceId: "",
		quizType: "multiple_choice",
		numberOfQuestions: 10,
		timeLimit: 15,
		language: "english",
		customPrompt: "",
	});
	const [generateLoading, setGenerateLoading] = useState(false);
	const [startQuizLoading, setStartQuizLoading] = useState(null); // quizId or null
	const [deleteQuizLoading, setDeleteQuizLoading] = useState(null); // quizId or null

	const navigate = useNavigate();

	useEffect(() => {
		fetchData();
	}, []);

	useEffect(() => {
		let timer;
		if (showQuizModal && timeLeft > 0) {
			timer = setInterval(() => {
				setTimeLeft((prev) => {
					if (prev <= 1) {
						handleSubmitQuiz();
						return 0;
					}
					return prev - 1;
				});
			}, 1000);
		}
		return () => clearInterval(timer);
	}, [showQuizModal, timeLeft]);

	const fetchData = async () => {
		try {
			const [quizzesRes, notesRes, decksRes, historyRes] = await Promise.all([
				axios.get("/content/quizzes", {
					headers: {
						Authorization: `Bearer ${localStorage.getItem("token")}`,
					},
				}),
				axios.get("/content/notes", {
					headers: {
						Authorization: `Bearer ${localStorage.getItem("token")}`,
					},
				}),
				axios.get("/content/flashcards/decks", {
					headers: {
						Authorization: `Bearer ${localStorage.getItem("token")}`,
					},
				}),
				axios
					.get("/content/quizzes/sessions/history", {
						headers: {
							Authorization: `Bearer ${localStorage.getItem("token")}`,
						},
					})
					.catch(() => ({ data: [] })), // Handle if endpoint doesn't exist
			]);

			setQuizzes(quizzesRes.data);
			setNotes(notesRes.data.notes || []);
			setDecks(decksRes.data);
			setQuizHistory(historyRes.data || []);
		} catch (error) {
			console.error("Error fetching data:", error);
			toast.error("Failed to fetch data");
		} finally {
			setLoading(false);
		}
	};

	const generateQuiz = async () => {
		try {
			if (
				generateOptions.source === "custom" &&
				!generateOptions.customPrompt.trim()
			) {
				toast.error("Please enter your custom quiz requirement");
				return;
			}
			if (
				(generateOptions.source === "note" ||
					generateOptions.source === "deck") &&
				!generateOptions.sourceId
			) {
				toast.error("Please select a source");
				return;
			}
			setGenerateLoading(true);
			const response = await axios.post(
				"/content/quizzes/generate",
				generateOptions,
				{
					headers: {
						Authorization: `Bearer ${localStorage.getItem("token")}`,
					},
				}
			);

			toast.success("Quiz generated successfully!");
			fetchData();
			setShowGenerateModal(false);
			setGenerateOptions({
				source: "note",
				sourceId: "",
				quizType: "multiple_choice",
				numberOfQuestions: 10,
				timeLimit: 15,
				language: "english",
				customPrompt: "",
			});
		} catch (error) {
			console.error("Generate quiz error:", error);
			toast.error("Failed to generate quiz");
		} finally {
			setGenerateLoading(false);
		}
	};

	const startQuiz = async (quiz) => {
		try {
			setStartQuizLoading(quiz._id);
			// Start quiz session
			const response = await axios.post(
				`/content/quizzes/${quiz._id}/start`,
				{},
				{
					headers: {
						Authorization: `Bearer ${localStorage.getItem("token")}`,
					},
				}
			);
			// Instead of opening modal, navigate to take page
			navigate(`/quiz/${quiz._id}/take`);
		} catch (error) {
			console.error("Start quiz error:", error);
			toast.error("Failed to start quiz");
		} finally {
			setStartQuizLoading(null);
		}
	};

	const handleAnswerSelect = (answer) => {
		const newAnswers = [...userAnswers];
		newAnswers[currentQuestionIndex] = answer;
		setUserAnswers(newAnswers);
	};

	const handleNextQuestion = () => {
		if (
			currentQuestionIndex <
			(currentQuiz?.quiz?.questions?.length || 0) - 1
		) {
			setCurrentQuestionIndex(currentQuestionIndex + 1);
		} else {
			handleSubmitQuiz();
		}
	};

	const handlePreviousQuestion = () => {
		if (currentQuestionIndex > 0) {
			setCurrentQuestionIndex(currentQuestionIndex - 1);
		}
	};

	const handleSubmitQuiz = async () => {
		try {
			const response = await axios.post(
				`/content/quizzes/${currentQuiz?.quiz?._id}/complete`,
				{
					sessionId: currentQuiz.sessionId,
					answers: userAnswers,
				},
				{
					headers: {
						Authorization: `Bearer ${localStorage.getItem("token")}`,
					},
				}
			);

			setQuizResults(response.data);
			setShowQuizModal(false);
			setShowResultsModal(true);
			fetchData();
		} catch (error) {
			console.error("Submit quiz error:", error);
			toast.error("Failed to submit quiz");
		}
	};

	const deleteQuiz = async (quizId) => {
		if (window.confirm("Are you sure you want to delete this quiz?")) {
			try {
				setDeleteQuizLoading(quizId);
				await axios.delete(`/content/quizzes/${quizId}`, {
					headers: {
						Authorization: `Bearer ${localStorage.getItem("token")}`,
					},
				});

				toast.success("Quiz deleted successfully!");
				fetchData();
			} catch (error) {
				console.error("Delete quiz error:", error);
				toast.error("Failed to delete quiz");
			} finally {
				setDeleteQuizLoading(null);
			}
		}
	};

	const formatTime = (seconds) => {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
	};

	const QuizCard = ({ quiz }) => (
		<Card className="h-100 border-0 shadow-sm hover-lift">
			<Card.Body>
				<div className="d-flex justify-content-between align-items-start mb-3">
					<h5 className="fw-bold mb-0">{quiz.title}</h5>
					<Badge bg="secondary">{quiz?.totalQuestions || 0} questions</Badge>
				</div>

				<div className="d-flex align-items-center mb-2">
					<Clock size={16} className="text-muted me-2" />
					<small className="text-muted">{quiz.timeLimit} minutes</small>
				</div>

				<div className="d-flex align-items-center mb-3">
					<Target size={16} className="text-muted me-2" />
					<small className="text-muted capitalize">
						{quiz.quizType.replace("_", " ")}
					</small>
				</div>

				<div className="d-flex justify-content-between align-items-center">
					<small className="text-muted d-flex align-items-center">
						<Calendar size={12} className="me-1" />
						<span>{new Date(quiz.createdAt).toLocaleDateString()}</span>
					</small>
					<div className="btn-group">
						<Button
							variant="primary"
							size="sm"
							onClick={() => startQuiz(quiz)}
							disabled={startQuizLoading === quiz._id}
						>
							<div className="d-flex justify-content-between align-items-center">
								<div className="d-flex justify-content-between align-items-center">
									<Play size={12} className="me-1" />
									<span>{quiz.isCompleted ? "Retake" : "Start"}</span>
								</div>
							</div>
						</Button>
						<Button
							variant="outline-danger"
							size="sm"
							onClick={() => deleteQuiz(quiz._id)}
							disabled={deleteQuizLoading === quiz._id}
						>
							{deleteQuizLoading === quiz._id ? (
								<Spinner size="sm" animation="border" className="me-1" />
							) : (
								<Trash2 size={12} />
							)}
						</Button>
					</div>
				</div>
			</Card.Body>
		</Card>
	);

	const QuestionComponent = ({
		question,
		questionIndex,
		selectedAnswer,
		onAnswerSelect,
	}) => (
		<Card className="border-0 shadow-sm">
			<Card.Body>
				<div className="d-flex justify-content-between align-items-center mb-3">
					<h6 className="text-muted mb-0">Question {questionIndex + 1}</h6>
					<Badge bg="primary">
						{currentQuiz?.quiz?.quizType.replace("_", " ")}
					</Badge>
				</div>

				<h5 className="mb-4">{question.question}</h5>

				{currentQuiz?.quiz?.quizType === "multiple_choice" && (
					<div>
						{question.options?.map((option, index) => (
							<Form.Check
								key={index}
								type="radio"
								name={`question-${questionIndex}`}
								id={`question-${questionIndex}-option-${index}`}
								label={option}
								checked={selectedAnswer === option}
								onChange={() => onAnswerSelect(option)}
								className="mb-2"
							/>
						)) || <p className="text-muted">No options available</p>}
					</div>
				)}

				{currentQuiz?.quiz?.quizType === "true_false" && (
					<div>
						<Form.Check
							type="radio"
							name={`question-${questionIndex}`}
							id={`question-${questionIndex}-true`}
							label="True"
							checked={selectedAnswer === "True"}
							onChange={() => onAnswerSelect("True")}
							className="mb-2"
						/>
						<Form.Check
							type="radio"
							name={`question-${questionIndex}`}
							id={`question-${questionIndex}-false`}
							label="False"
							checked={selectedAnswer === "False"}
							onChange={() => onAnswerSelect("False")}
							className="mb-2"
						/>
					</div>
				)}

				{currentQuiz?.quiz?.quizType === "fill_blank" && (
					<Form.Control
						type="text"
						value={selectedAnswer}
						onChange={(e) => onAnswerSelect(e.target.value)}
						placeholder="Enter your answer"
					/>
				)}
			</Card.Body>
		</Card>
	);

	if (loading) {
		return (
			<div className="d-flex justify-content-center align-items-center min-vh-100">
				<div className="spinner-border text-primary" role="status">
					<span className="visually-hidden">Loading...</span>
				</div>
			</div>
		);
	}

	const currentQuestion = currentQuiz?.quiz?.questions?.[currentQuestionIndex];

	// Calculate statistics
	const totalQuizzes = new Set(
		quizHistory.map((session) => session.quizId._id.toString())
	).size;

	// Completed quizzes = sessions where completedAt exists
	const completedQuizzesList = quizHistory.filter(
		(session) => session.completedAt
	);

	// Count of completed quizzes
	const completedQuizzes = completedQuizzesList.length;

	// Average score
	const averageScore =
		completedQuizzes > 0
			? Math.round(
					completedQuizzesList.reduce(
						(acc, session) => acc + session.score,
						0
					) / completedQuizzes
			  )
			: 0;

	// Best score
	const bestScore =
		completedQuizzes > 0
			? Math.max(...completedQuizzesList.map((session) => session.score))
			: 0;

	return (
		<Container fluid className="py-4">
			<Row className="mb-4">
				<Col md={8}>
					<h1 className="fw-bold mb-1">Quiz Center</h1>
					<p className="text-muted mb-0">
						Test your knowledge with AI-generated quizzes
					</p>
				</Col>
				<Col md={4} className="text-md-end">
					<Button
						variant="outline-primary"
						className="me-2"
						onClick={() => setShowHistoryModal(true)}
					>
						<div className="d-flex justify-content-between align-items-center">
							<Eye size={16} className="me-2" />
							<span>History</span>
						</div>
					</Button>
					<Button variant="primary" onClick={() => setShowGenerateModal(true)}>
						<div className="d-flex justify-content-between align-items-center">
							<Play size={16} className="me-2" />
							<span>Generate Quiz</span>
						</div>
					</Button>
				</Col>
			</Row>

			<Row className="g-4 mb-5">
				<Col md={3}>
					<Card className="text-center border-0 shadow-sm">
						<Card.Body>
							<div className="rounded-circle bg-primary bg-opacity-10 p-3 mx-auto mb-3 d-inline-flex">
								<BarChart3 className="text-primary" size={24} />
							</div>
							<h3 className="fw-bold">{totalQuizzes}</h3>
							<p className="text-muted mb-0">Total Quizzes</p>
						</Card.Body>
					</Card>
				</Col>
				<Col md={3}>
					<Card className="text-center border-0 shadow-sm">
						<Card.Body>
							<div className="rounded-circle bg-success bg-opacity-10 p-3 mx-auto mb-3 d-inline-flex">
								<CheckCircle className="text-success" size={24} />
							</div>
							<h3 className="fw-bold">{completedQuizzes}</h3>
							<p className="text-muted mb-0">Completed</p>
						</Card.Body>
					</Card>
				</Col>
				<Col md={3}>
					<Card className="text-center border-0 shadow-sm">
						<Card.Body>
							<div className="rounded-circle bg-warning bg-opacity-10 p-3 mx-auto mb-3 d-inline-flex">
								<Award className="text-warning" size={24} />
							</div>
							<h3 className="fw-bold">{averageScore}%</h3>
							<p className="text-muted mb-0">Average Score</p>
						</Card.Body>
					</Card>
				</Col>
				<Col md={3}>
					<Card className="text-center border-0 shadow-sm">
						<Card.Body>
							<div className="rounded-circle bg-info bg-opacity-10 p-3 mx-auto mb-3 d-inline-flex">
								<Target className="text-info" size={24} />
							</div>
							<h3 className="fw-bold">{bestScore}%</h3>
							<p className="text-muted mb-0">Best Score</p>
						</Card.Body>
					</Card>
				</Col>
			</Row>

			<Row className="mb-4">
				<Col>
					<h3 className="fw-bold mb-3">Available Quizzes</h3>
				</Col>
			</Row>

			{quizzes.length > 0 ? (
				<Row className="g-4">
					{quizzes.map((quiz) => (
						<Col key={quiz._id} md={6} lg={4}>
							<QuizCard quiz={quiz} />
						</Col>
					))}
				</Row>
			) : (
				<div className="text-center py-5">
					<div className="d-flex flex-column align-items-center">
						<BarChart3 size={64} className="text-muted mb-3" />
						<h4 className="text-muted mb-2">No quizzes available</h4>
						<p className="text-muted mb-4">
							Generate your first quiz from your notes or flashcard decks.
						</p>
						<Button
							variant="primary"
							onClick={() => setShowGenerateModal(true)}
						>
							<div className="d-flex justify-content-between align-items-center">
								<Play size={16} className="me-2" />
								<span>Generate Your First Quiz</span>
							</div>
						</Button>
					</div>
				</div>
			)}

			{/* Generate Quiz Modal */}
			<Modal
				show={showGenerateModal}
				onHide={generateLoading ? undefined : () => setShowGenerateModal(false)}
				backdrop={generateLoading ? "static" : true}
			>
				<Modal.Header closeButton={!generateLoading}>
					<Modal.Title>Generate New Quiz</Modal.Title>
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
										customPrompt: "",
									})
								}
							>
								<option value="note">From Note</option>
								<option value="deck">From Flashcard Deck</option>
								<option value="custom">Custom</option>
							</Form.Select>
						</Form.Group>
						{generateOptions.source === "custom" ? (
							<Form.Group className="mb-3">
								<Form.Label>Custom Quiz Requirement</Form.Label>
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
									placeholder="Describe your quiz requirement (e.g., 'Create a quiz about World War II with 10 questions')"
									required
								/>
							</Form.Group>
						) : (
							<Form.Group className="mb-3">
								<Form.Label>
									Select {generateOptions.source === "note" ? "Note" : "Deck"}
								</Form.Label>
								<Form.Select
									value={generateOptions.sourceId}
									onChange={(e) =>
										setGenerateOptions({
											...generateOptions,
											sourceId: e.target.value,
										})
									}
									required
								>
									<option value="">Choose a {generateOptions.source}...</option>
									{(generateOptions.source === "note" ? notes : decks).map(
										(item) => (
											<option key={item._id} value={item._id}>
												{item.title || item.name}
											</option>
										)
									)}
								</Form.Select>
							</Form.Group>
						)}
						<Form.Group className="mb-3">
							<Form.Label>Quiz Type</Form.Label>
							<Form.Select
								value={generateOptions.quizType}
								onChange={(e) =>
									setGenerateOptions({
										...generateOptions,
										quizType: e.target.value,
									})
								}
							>
								<option value="multiple_choice">Multiple Choice</option>
								<option value="true_false">True/False</option>
								<option value="fill_blank">Fill in the Blank</option>
								<option value="mixed">Mixed</option>
							</Form.Select>
						</Form.Group>

						<Form.Group className="mb-3">
							<Form.Label>Number of Questions</Form.Label>
							<Form.Select
								value={generateOptions.numberOfQuestions}
								onChange={(e) =>
									setGenerateOptions({
										...generateOptions,
										numberOfQuestions: parseInt(e.target.value),
									})
								}
							>
								<option value={5}>5 questions</option>
								<option value={10}>10 questions</option>
								<option value={15}>15 questions</option>
								<option value={20}>20 questions</option>
								<option value={25}>25 questions</option>
								<option value={30}>30 questions</option>
								<option value={40}>40 questions</option>
								<option value={50}>50 questions</option>
								<option value={60}>60 questions</option>
								<option value={70}>70 questions</option>
								<option value={80}>80 questions</option>
								<option value={90}>90 questions</option>
								<option value={100}>100 questions</option>
								<option value={110}>110 questions</option>
								<option value={120}>120 questions</option>
								<option value={130}>130 questions</option>
								<option value={140}>140 questions</option>
								<option value={150}>150 questions</option>
							</Form.Select>
						</Form.Group>

						<Form.Group className="mb-3">
							<Form.Label>Time Limit (minutes)</Form.Label>
							<Form.Select
								value={generateOptions.timeLimit}
								onChange={(e) =>
									setGenerateOptions({
										...generateOptions,
										timeLimit: parseInt(e.target.value),
									})
								}
							>
								<option value={5}>5 minutes</option>
								<option value={10}>10 minutes</option>
								<option value={15}>15 minutes</option>
								<option value={30}>30 minutes</option>
								<option value={60}>60 minutes</option>
								<option value={90}>90 minutes</option>
								<option value={120}>120 minutes</option>
								<option value={150}>150 minutes</option>
								<option value={180}>180 minutes</option>
								<option value={210}>210 minutes</option>
								<option value={240}>240 minutes</option>
							</Form.Select>
						</Form.Group>
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
							>
								<option value="english">English</option>
								<option value="hindi">Hindi</option>
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
						onClick={generateQuiz}
						disabled={
							generateLoading ||
							(generateOptions.source === "custom"
								? !generateOptions.customPrompt.trim()
								: !generateOptions.sourceId)
						}
					>
						<div className="d-flex align-items-center">
							{generateLoading ? (
								<Spinner size="sm" animation="border" className="me-2" />
							) : (
								<Play size={16} className="me-2" />
							)}
							<span>Generate Quiz</span>
						</div>
					</Button>
				</Modal.Footer>
			</Modal>

			{/* Quiz History Modal */}
			<Modal
				show={showHistoryModal}
				onHide={() => setShowHistoryModal(false)}
				size="lg"
			>
				<Modal.Header closeButton>
					<Modal.Title>Quiz History</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					{quizHistory.length > 0 ? (
						<div className="list-group">
							{quizHistory.map((session, index) => (
								<div
									key={session._id || index}
									className="list-group-item border-0 shadow-sm mb-3 rounded"
								>
									<div className="d-flex justify-content-between align-items-start">
										<div>
											<h6 className="fw-bold mb-1">
												{session.quizId?.title || "Quiz"}
											</h6>
											<p className="text-muted mb-2">
												Score: {session.score}% ({session.correctAnswers}/
												{session.totalQuestions})
											</p>
											<small className="text-muted d-flex align-items-center">
												<Calendar size={12} className="me-1" />
												<span>
													{new Date(session.completedAt).toLocaleDateString()}
												</span>
											</small>
										</div>
										<div className="d-flex flex-column align-items-end">
											<Badge
												bg={
													session.score >= 80
														? "success"
														: session.score >= 60
														? "warning"
														: "danger"
												}
												className="mb-2"
											>
												{session.score}%
											</Badge>
											<Button
												size="sm"
												variant="outline-primary"
												onClick={() =>
													navigate(
														`/quiz/${session.quizId?._id}/results/${session._id}`,
														{
															state: { sessionId: session._id },
														}
													)
												}
											>
												View Result
											</Button>
										</div>
									</div>
								</div>
							))}
						</div>
					) : (
						<div className="text-center py-4 d-flex flex-column align-items-center">
							<BarChart3 size={48} className="text-muted mb-3" />
							<h5 className="text-muted mb-2">No quiz history</h5>
							<p className="text-muted">
								Complete some quizzes to see your history here.
							</p>
						</div>
					)}
				</Modal.Body>
				<Modal.Footer>
					<Button
						variant="secondary"
						onClick={() => setShowHistoryModal(false)}
					>
						Close
					</Button>
				</Modal.Footer>
			</Modal>
		</Container>
	);
};

export default Quiz;
