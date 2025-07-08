import React from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Card, Row, Col, Badge, Button, Alert } from "react-bootstrap";
import { Award, CheckCircle, XCircle, Clock, RefreshCw } from "lucide-react";
import axios from "axios";
import { useEffect, useState } from "react";

const QuizResultsPage = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const { quizId } = useParams();
	const [results, setResults] = useState(location.state?.results || null);
	const [loading, setLoading] = useState(!location.state?.results);
	const sessionId = location.state?.sessionId;

	useEffect(() => {
		const fetchResults = async () => {
			if (!results && sessionId) {
				setLoading(true);
				try {
					const response = await axios.get(
						`/content/quizzes/${quizId}/results/${sessionId}`,
						{
							headers: {
								Authorization: `Bearer ${localStorage.getItem("token")}`,
							},
						}
					);
					setResults(response.data);
				} catch (error) {
					// Optionally handle error
				} finally {
					setLoading(false);
				}
			}
		};
		fetchResults();
		// eslint-disable-next-line
	}, [sessionId, results]);

	if (loading || !results) {
		return (
			<div className="d-flex justify-content-center align-items-center min-vh-100">
				<div className="spinner-border text-primary" role="status">
					<span className="visually-hidden">Loading...</span>
				</div>
			</div>
		);
	}

	const formatTime = (seconds) => {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
	};

	return (
		<div className="container py-4">
			<div className="text-center mb-4">
				<div
					className={`rounded-circle p-4 mx-auto mb-3 d-inline-flex ${
						results.score >= 80
							? "bg-success"
							: results.score >= 60
							? "bg-warning"
							: "bg-danger"
					} bg-opacity-10`}
				>
					<Award
						className={
							results.score >= 80
								? "text-success"
								: results.score >= 60
								? "text-warning"
								: "text-danger"
						}
						size={48}
					/>
				</div>
				<h2 className="fw-bold mb-2">{results.score}%</h2>
				<p className="text-muted mb-0">
					You got {results.correctAnswers} out of {results.totalQuestions}{" "}
					questions correct
				</p>
			</div>
			<Row className="g-3 mb-4">
				<Col md={4}>
					<Card className="text-center border-0 bg-light">
						<Card.Body>
							<div className="d-flex flex-column align-items-center">
								<CheckCircle className="text-success mb-2" size={24} />
								<h5 className="fw-bold">{results.correctAnswers}</h5>
								<small className="text-muted">Correct</small>
							</div>
						</Card.Body>
					</Card>
				</Col>
				<Col md={4}>
					<Card className="text-center border-0 bg-light">
						<Card.Body>
							<div className="d-flex flex-column align-items-center">
								<XCircle className="text-danger mb-2" size={24} />
								<h5 className="fw-bold">
									{results.totalQuestions - results.correctAnswers}
								</h5>
								<small className="text-muted">Incorrect</small>
							</div>
						</Card.Body>
					</Card>
				</Col>
				<Col md={4}>
					<Card className="text-center border-0 bg-light">
						<Card.Body>
							<div className="d-flex flex-column align-items-center">
								<Clock className="text-info mb-2" size={24} />
								<h5 className="fw-bold">
									{formatTime(results.timeTaken || 0)}
								</h5>
								<small className="text-muted">Time Taken</small>
							</div>
						</Card.Body>
					</Card>
				</Col>
			</Row>
			<Alert
				variant={
					results.score >= 80
						? "success"
						: results.score >= 60
						? "warning"
						: "danger"
				}
			>
				<strong>
					{results.score >= 80
						? "Excellent work!"
						: results.score >= 60
						? "Good job!"
						: "Keep studying!"}
				</strong>
				{results.score >= 80
					? " You have a strong understanding of the material."
					: results.score >= 60
					? " You're on the right track. Review the incorrect answers."
					: " Consider reviewing the material and trying again."}
			</Alert>
			<div className="d-flex justify-content-center gap-3 mt-4">
				<Button variant="secondary" onClick={() => navigate("/quiz")}>
					Back to Quizzes
				</Button>
				<Button
					variant="primary"
					onClick={() =>
						navigate(`/quiz/${quizId}/explanation/${sessionId}`, {
							state: { sessionId },
						})
					}
				>
					View Explanations
				</Button>
				<Button
					variant="outline-primary"
					onClick={() => navigate(`/quiz/${quizId}/take`)}
				>
					<div className="d-flex align-items-center">
						<RefreshCw size={16} className="me-2" />
						<span>Retake Quiz</span>
					</div>
				</Button>
			</div>
		</div>
	);
};

export default QuizResultsPage;
