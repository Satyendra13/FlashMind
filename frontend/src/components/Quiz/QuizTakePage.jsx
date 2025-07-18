import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ProgressBar, Badge, Button, Modal, Spinner } from "react-bootstrap";
import axios from "axios";
import toast from "react-hot-toast";
import { Clock } from "lucide-react";
import QuizQuestion from "./QuizQuestion";
import { Modal as RBModal } from "react-bootstrap";

const QuizTakePage = () => {
	const { quizId } = useParams();
	const navigate = useNavigate();
	const [quizSession, setQuizSession] = useState(null);
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [userAnswers, setUserAnswers] = useState([]);
	const [timeLeft, setTimeLeft] = useState(0);
	const [loading, setLoading] = useState(true);
	const [submitLoading, setSubmitLoading] = useState(false);
	const [questionTimes, setQuestionTimes] = useState([]); // [{start: timestamp, total: seconds}]
	const [quizStartTime, setQuizStartTime] = useState(null);
	const [totalTimeTaken, setTotalTimeTaken] = useState(0);
	const [showSubmittingModal, setShowSubmittingModal] = useState(false);
	const [language, setLanguage] = useState("en");

	useEffect(() => {
		const startQuiz = async () => {
			try {
				const response = await axios.post(
					`/content/quizzes/${quizId}/start`,
					{},
					{
						headers: {
							Authorization: `Bearer ${localStorage.getItem("token")}`,
						},
					}
				);
				setQuizSession(response.data);
				setUserAnswers(
					new Array(response.data.quiz.questions.length).fill({
						en: "",
						hi: "",
						key: "",
					})
				);
				setTimeLeft(response.data.quiz.timeLimit * 60);
				setQuizStartTime(Date.now());
				setQuestionTimes(
					new Array(response.data.quiz.questions.length)
						.fill(null)
						.map(() => ({ start: null, total: 0 }))
				);
			} catch (error) {
				toast.error("Failed to start quiz");
				navigate("/quiz");
			} finally {
				setLoading(false);
			}
		};
		startQuiz();
		// eslint-disable-next-line
	}, [quizId]);

	// Start timing when question is shown
	useEffect(() => {
		if (!quizSession) return;
		setQuestionTimes((prev) => {
			const arr = [...prev];
			if (
				arr[currentQuestionIndex] &&
				arr[currentQuestionIndex].start == null
			) {
				arr[currentQuestionIndex] = {
					...arr[currentQuestionIndex],
					start: Date.now(),
				};
			}
			return arr;
		});
		// eslint-disable-next-line
	}, [currentQuestionIndex, quizSession]);

	// Timer for quiz
	useEffect(() => {
		let timer;
		if (timeLeft > 0 && quizSession && !submitLoading) {
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
		// eslint-disable-next-line
	}, [timeLeft, quizSession, submitLoading]);

	const handleAnswerSelect = (optionKey) => {
		const newAnswers = [...userAnswers];
		newAnswers[currentQuestionIndex] = {
			...newAnswers[currentQuestionIndex],
			[language]: optionKey,
			key: optionKey,
		};
		setUserAnswers(newAnswers);
	};

	const goToQuestion = (newIndex) => {
		setQuestionTimes((prev) => {
			const arr = [...prev];
			// Stop timing current question
			if (
				arr[currentQuestionIndex] &&
				arr[currentQuestionIndex].start != null
			) {
				arr[currentQuestionIndex].total += Math.floor(
					(Date.now() - arr[currentQuestionIndex].start) / 1000
				);
				arr[currentQuestionIndex].start = null;
			}
			// Start timing new question
			if (arr[newIndex] && arr[newIndex].start == null) {
				arr[newIndex].start = Date.now();
			}
			return arr;
		});
		setCurrentQuestionIndex(newIndex);
	};

	const handleNextQuestion = () => {
		if (
			currentQuestionIndex <
			(quizSession?.quiz?.questions?.length || 0) - 1
		) {
			goToQuestion(currentQuestionIndex + 1);
		} else {
			handleSubmitQuiz();
		}
	};

	const handlePreviousQuestion = () => {
		if (currentQuestionIndex > 0) {
			goToQuestion(currentQuestionIndex - 1);
		}
	};

	const handleSubmitQuiz = async () => {
		setSubmitLoading(true);
		setShowSubmittingModal(true);
		// Stop timing current question
		setQuestionTimes((prev) => {
			const arr = [...prev];
			if (
				arr[currentQuestionIndex] &&
				arr[currentQuestionIndex].start != null
			) {
				arr[currentQuestionIndex].total += Math.floor(
					(Date.now() - arr[currentQuestionIndex].start) / 1000
				);
				arr[currentQuestionIndex].start = null;
			}
			return arr;
		});
		// Wait for state update
		setTimeout(async () => {
			try {
				// Calculate timeSpent for each question
				const answersWithTime = userAnswers.map((ans, idx) => ({
					questionIndex: idx,
					userAnswerKey: ans.key,
					timeSpent: questionTimes[idx]?.total || 0,
				}));
				// Calculate total time taken
				const totalTime = questionTimes.reduce(
					(sum, q) => sum + (q?.total || 0),
					0
				);
				setTotalTimeTaken(totalTime);
				const response = await axios.post(
					`/content/quizzes/${quizSession?.quiz?._id}/complete`,
					{
						sessionId: quizSession.sessionId,
						answers: answersWithTime,
						timeTaken: totalTime,
					},
					{
						headers: {
							Authorization: `Bearer ${localStorage.getItem("token")}`,
						},
					}
				);
				navigate(
					`/quiz/${quizSession.quiz._id}/results/${quizSession.sessionId}`,
					{
						state: { sessionId: quizSession.sessionId },
					}
				);
			} catch (error) {
				toast.error("Failed to submit quiz");
			} finally {
				setSubmitLoading(false);
				setShowSubmittingModal(false);
			}
		}, 100);
	};

	const formatTime = (seconds) => {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
	};

	useEffect(() => {
		const handleBeforeUnload = (e) => {
			if (submitLoading) {
				e.preventDefault();
				e.returnValue = "";
			}
		};
		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => window.removeEventListener("beforeunload", handleBeforeUnload);
	}, [submitLoading]);

	if (loading) {
		return (
			<div className="d-flex justify-content-center align-items-center min-vh-100">
				<div className="spinner-border text-primary" role="status">
					<span className="visually-hidden">Loading...</span>
				</div>
			</div>
		);
	}

	const currentQuestion = quizSession?.quiz?.questions?.[currentQuestionIndex];

	return (
		<div className="container py-4">
			<div className="d-flex align-items-center mb-4">
				<h2 className="me-3">{quizSession?.quiz?.title}</h2>
				<Badge bg={timeLeft < 60 ? "danger" : "primary"}>
					<div className="d-flex align-items-center">
						<Clock size={12} className="me-1" />
						<span>{formatTime(timeLeft)}</span>
					</div>
				</Badge>
				<div className="ms-auto">
					<Button
						variant={language === "en" ? "primary" : "outline-primary"}
						size="sm"
						onClick={() => setLanguage("en")}
						className="me-2"
					>
						English
					</Button>
					<Button
						variant={language === "hi" ? "primary" : "outline-primary"}
						size="sm"
						onClick={() => setLanguage("hi")}
					>
						हिन्दी
					</Button>
				</div>
			</div>
			<ProgressBar
				now={
					((currentQuestionIndex + 1) /
						(quizSession?.quiz?.questions?.length || 1)) *
					100
				}
				className="mb-2"
			/>
			<div className="d-flex justify-content-between text-muted small mb-4">
				<span>
					Question {currentQuestionIndex + 1} of{" "}
					{quizSession?.quiz?.questions?.length || 0}
				</span>
				<span>
					{userAnswers.filter((answer) => answer !== "").length} answered
				</span>
			</div>
			{currentQuestion && (
				<QuizQuestion
					question={currentQuestion}
					questionIndex={currentQuestionIndex}
					selectedAnswer={userAnswers[currentQuestionIndex]?.key || ""}
					quizType={quizSession.quiz.quizType}
					onAnswerSelect={handleAnswerSelect}
					language={language}
				/>
			)}
			<div className="d-flex align-items-center mt-4">
				<Button
					variant="outline-secondary"
					onClick={handlePreviousQuestion}
					disabled={currentQuestionIndex === 0 || submitLoading}
				>
					Previous
				</Button>
				<div className="flex-grow-1 text-center">
					<small className="text-muted">
						{userAnswers[currentQuestionIndex]
							? "Answer selected"
							: "Select an answer"}
					</small>
				</div>
				<Button
					variant="primary"
					onClick={handleNextQuestion}
					disabled={submitLoading}
				>
					{submitLoading &&
					currentQuestionIndex ===
						(quizSession?.quiz?.questions?.length || 1) - 1 ? (
						<Spinner size="sm" animation="border" className="me-2" />
					) : null}
					{currentQuestionIndex ===
					(quizSession?.quiz?.questions?.length || 1) - 1
						? "Submit Quiz"
						: "Next"}
				</Button>
			</div>
			{/* Submitting Modal */}
			<RBModal
				show={showSubmittingModal}
				centered
				backdrop="static"
				keyboard={false}
			>
				<RBModal.Body className="text-center py-5">
					<Spinner animation="border" variant="primary" className="mb-3" />
					<h5>Submitting your responses...</h5>
					<div className="text-muted mt-2">
						Please wait while we save your quiz results.
					</div>
				</RBModal.Body>
			</RBModal>
		</div>
	);
};

export default QuizTakePage;
