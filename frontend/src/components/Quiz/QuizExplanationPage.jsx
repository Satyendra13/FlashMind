import React from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Card, Button, Badge, Alert } from "react-bootstrap";
import axios from "axios";
import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Info } from "lucide-react";

const QuizExplanationPage = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const { quizId, sessionId } = useParams();
	const [explanation, setExplanation] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		const fetchExplanation = async () => {
			if (!explanation && quizId && sessionId) {
				setLoading(true);
				try {
					const response = await axios.get(
						`/content/quizzes/${quizId}/explanation/${sessionId}`,
						{
							headers: {
								Authorization: `Bearer ${localStorage.getItem("token")}`,
							},
						}
					);
					setExplanation(response.data);
				} catch (error) {
					setError(
						error.response?.data?.message || "Failed to fetch explanation"
					);
				} finally {
					setLoading(false);
				}
			}
		};
		fetchExplanation();
		// eslint-disable-next-line
	}, [quizId, sessionId, explanation]);

	if (loading) {
		return (
			<div className="d-flex justify-content-center align-items-center min-vh-100">
				<div className="spinner-border text-primary" role="status">
					<span className="visually-hidden">Loading...</span>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="container py-4">
				<Alert variant="danger" className="mb-4">
					{error}
				</Alert>
			</div>
		);
	}

	const formatTime = (seconds) => {
		if (seconds < 60) {
			return `${seconds} sec`;
		}
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes}:${remainingSeconds.toString().padStart(2, "0")} min`;
	};

	return (
		<div className="container py-4">
			{explanation?.quizTitle && (
				<div className="d-flex justify-content-center mb-4">
					<Card className="shadow border-0 w-100" style={{ maxWidth: 600 }}>
						<Card.Body className="text-center py-4">
							<h1
								className="fw-bold mb-2 d-flex justify-content-center align-items-center"
								style={{ fontSize: "2.2rem" }}
							>
								<Info className="me-2 text-primary" size={32} />
								<span>{explanation.quizTitle}</span>
							</h1>
							<div className="text-muted" style={{ fontSize: "1.1rem" }}>
								Quiz Review & Explanations
							</div>
						</Card.Body>
					</Card>
				</div>
			)}
			{Array.isArray(explanation?.explanation) &&
			explanation.explanation.length > 0 ? (
				explanation.explanation.map((q, idx) => {
					const answer = explanation.answers?.find(
						(a) => a.questionIndex === idx
					);
					const userAnswer = answer?.userAnswer;
					const isCorrect = answer?.isCorrect;
					const options = [q.correctAnswer, ...(q.incorrectAnswers || [])];
					return (
						<Card className="mb-4 shadow" key={q._id || idx}>
							<Card.Body>
								<div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-2 gap-2">
									<div className="d-flex align-items-center mb-1 mb-md-0">
										<span className="me-2 fs-5 fw-bold">Q{idx + 1}:</span>
										<span className="fs-5">{q.question}</span>
										{isCorrect ? (
											<CheckCircle
												className="ms-3 text-success"
												size={32}
												title="Correct"
											/>
										) : (
											<XCircle
												className="ms-3 text-danger"
												size={32}
												title="Incorrect"
											/>
										)}
									</div>
									<div className="d-flex align-items-center mt-1 mt-md-0">
										<span
											className="badge bg-light text-dark border border-secondary d-flex align-items-center px-2 py-1"
											style={{ fontSize: "1rem" }}
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="18"
												height="18"
												fill="currentColor"
												className="bi bi-clock me-2"
												viewBox="0 0 16 16"
											>
												<path d="M8 3.5a.5.5 0 0 1 .5.5v4.25l3.5 2.1a.5.5 0 0 1-.5.85l-3.75-2.25A.5.5 0 0 1 7.5 8V4a.5.5 0 0 1 .5-.5z" />
												<path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm0-1A7 7 0 1 1 8 1a7 7 0 0 1 0 14z" />
											</svg>
											<span className="fw-semibold">
												Time Taken: {formatTime(answer?.timeSpent) ?? "-"}
											</span>
										</span>
									</div>
								</div>
								<div className="row g-2 mb-3">
									{options.map((opt, i) => {
										const isUser = userAnswer === opt;
										const isCorrectOpt = q.correctAnswer === opt;
										let bg = "bg-light";
										let border = "border";
										let icon = null;
										if (isUser && isCorrectOpt) {
											bg = "bg-success bg-opacity-25";
											border = "border-success";
											icon = (
												<CheckCircle className="text-success me-2" size={18} />
											);
										} else if (isUser && !isCorrectOpt) {
											bg = "bg-danger bg-opacity-25";
											border = "border-danger";
											icon = <XCircle className="text-danger me-2" size={18} />;
										} else if (isCorrectOpt) {
											bg = "bg-success bg-opacity-10";
											border = "border-success";
											icon = (
												<CheckCircle className="text-success me-2" size={18} />
											);
										}
										return (
											<div className="col-md-6 col-12" key={i}>
												<div
													className={`d-flex align-items-center rounded p-2 mb-1 ${bg} ${border}`}
													style={{ minHeight: 44 }}
												>
													{icon}
													<span className={isUser ? "fw-bold" : ""}>{opt}</span>
													{isUser && (
														<span className="badge bg-primary ms-2">
															Your Answer
														</span>
													)}
													{isCorrectOpt && (
														<span className="badge bg-success ms-2">
															Correct
														</span>
													)}
												</div>
											</div>
										);
									})}
								</div>
								{q.explanation && (
									<div className="mb-2">
										<div
											className="alert alert-info d-flex align-items-center mb-0"
											role="alert"
										>
											<Info className="me-2 text-info" size={18} />
											<div>
												<strong>Explanation:</strong> {q.explanation}
											</div>
										</div>
									</div>
								)}
							</Card.Body>
						</Card>
					);
				})
			) : (
				<div className="text-muted text-center">No explanations available.</div>
			)}
			<div className="d-flex justify-content-center">
				<Button
					variant="primary"
					onClick={() => navigate("/quiz")}
					className="mt-4"
				>
					Back to Quizzes
				</Button>
			</div>
		</div>
	);
};

export default QuizExplanationPage;
