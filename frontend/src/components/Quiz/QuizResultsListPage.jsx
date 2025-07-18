import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
	Card,
	Button,
	Badge,
	Spinner,
	Alert,
	Container,
} from "react-bootstrap";
import { Calendar, CheckCircle, XCircle, Eye, BarChart3 } from "lucide-react";
import axios from "axios";

const QuizResultsListPage = () => {
	const { quizId } = useParams();
	const navigate = useNavigate();
	const [sessions, setSessions] = useState([]);
	const [quizTitle, setQuizTitle] = useState("");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		const fetchResults = async () => {
			setLoading(true);
			try {
				const response = await axios.get(`/content/quizzes/${quizId}/results`, {
					headers: {
						Authorization: `Bearer ${localStorage.getItem("token")}`,
					},
				});
				setSessions(response.data || []);
				if (response.data?.length > 0 && response.data[0].quizId?.title) {
					setQuizTitle(response.data[0].quizId.title);
				}
			} catch (err) {
				setError(
					err.response?.data?.message || "Failed to fetch quiz results."
				);
			} finally {
				setLoading(false);
			}
		};
		fetchResults();
	}, [quizId]);

	if (loading) {
		return (
			<div className="d-flex justify-content-center align-items-center min-vh-100">
				<Spinner animation="border" variant="primary" />
			</div>
		);
	}

	if (error) {
		return (
			<Container className="py-4">
				<Alert variant="danger">{error}</Alert>
			</Container>
		);
	}

	return (
		<Container className="py-4">
			<div className="d-flex align-items-center mb-4">
				<BarChart3 size={32} className="text-primary me-2" />
				<h2 className="fw-bold mb-0">Quiz Results</h2>
			</div>
			{quizTitle && <h4 className="mb-4 text-muted">{quizTitle}</h4>}
			{sessions.length > 0 ? (
				<div className="list-group">
					{sessions.map((session, idx) => (
						<Card
							key={session._id || idx}
							className="list-group-item border-0 shadow-sm mb-3 rounded"
						>
							<Card.Body className="d-flex flex-column flex-md-row justify-content-between align-items-md-center align-items-start gap-3">
								<div>
									<h6 className="fw-bold mb-1">
										Attempt #{sessions.length - idx}
									</h6>
									<p className="text-muted mb-2">
										Score: {session.score}% ({session.correctAnswers}/
										{session.totalQuestions})
									</p>
									<small className="text-muted d-flex align-items-center">
										<Calendar size={12} className="me-1" />
										<span>
											{session.completedAt
												? new Date(session.completedAt).toLocaleString()
												: "-"}
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
										variant="outline-primary"
										size="sm"
										onClick={() =>
											navigate(`/quiz/${quizId}/results/${session._id}`, {
												state: { sessionId: session._id },
											})
										}
									>
										<div className="d-flex align-items-center">
											<Eye size={14} className="me-1" />
											<span>View Result</span>
										</div>
									</Button>
								</div>
							</Card.Body>
						</Card>
					))}
				</div>
			) : (
				<div className="text-center py-5 d-flex flex-column align-items-center">
					<BarChart3 size={48} className="text-muted mb-3" />
					<h5 className="text-muted mb-2">No attempts yet</h5>
					<p className="text-muted">
						You haven't completed this quiz yet. Take the quiz to see your
						results here.
					</p>
				</div>
			)}
			<div className="d-flex justify-content-center mt-4">
				<Button variant="secondary" onClick={() => navigate("/quiz")}>
					Back to Quiz Center
				</Button>
			</div>
		</Container>
	);
};

export default QuizResultsListPage;
