import React, { useEffect, useState } from "react";
import axios from "axios";
import {
	Container,
	Row,
	Col,
	Card,
	Table,
	Spinner,
	Alert,
	ListGroup,
	Tab,
	Nav,
} from "react-bootstrap";
import {
	User as UserIcon,
	Mail,
	Shield,
	FileText,
	BookOpen,
	ListChecks,
	BarChart3,
} from "lucide-react";

const formatTime = (seconds) => {
	if (typeof seconds !== "number" || isNaN(seconds) || seconds < 0) return "-";
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	const s = Math.floor(seconds % 60);
	let result = "";
	if (h > 0) result += `${h}h `;
	if (m > 0 || h > 0) result += `${m}m `;
	result += `${s}s`;
	return result.trim();
};

const AdminUserReports = () => {
	const [users, setUsers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [selectedUser, setSelectedUser] = useState(null);
	const [userReport, setUserReport] = useState(null);
	const [reportLoading, setReportLoading] = useState(false);
	const [reportError, setReportError] = useState("");

	useEffect(() => {
		fetchUsers();
	}, []);

	const fetchUsers = async () => {
		setLoading(true);
		setError("");
		try {
			const res = await axios.get("/auth/admin/users", {
				headers: {
					Authorization: `Bearer ${localStorage.getItem("token")}`,
				},
			});
			setUsers(res.data);
		} catch (err) {
			setError(
				err.response?.data?.message || "Failed to fetch users. Are you admin?"
			);
		} finally {
			setLoading(false);
		}
	};

	const fetchUserInfoAndReport = async (userId) => {
		setReportLoading(true);
		setReportError("");
		setUserReport(null);
		try {
			// Fetch user info from auth-service
			const userRes = await axios.get(`/auth/admin/users/${userId}`, {
				headers: {
					Authorization: `Bearer ${localStorage.getItem("token")}`,
				},
			});
			setSelectedUser(userRes.data);
			// Fetch report from content-service
			const reportRes = await axios.get(
				`/content/admin/users/${userId}/report`,
				{
					headers: {
						Authorization: `Bearer ${localStorage.getItem("token")}`,
					},
				}
			);
			setUserReport(reportRes.data);
		} catch (err) {
			setReportError(
				err.response?.data?.message || "Failed to fetch user report."
			);
		} finally {
			setReportLoading(false);
		}
	};

	return (
		<Container fluid className="py-4">
			<Row>
				<Col md={4}>
					<Card className="mb-4">
						<Card.Header>
							<h5 className="fw-bold mb-0 d-flex align-items-center">
								<UserIcon size={20} className="me-2 text-primary" /> All Users
							</h5>
						</Card.Header>
						<Card.Body style={{ maxHeight: 600, overflowY: "auto" }}>
							{loading ? (
								<div className="text-center py-4">
									<Spinner animation="border" variant="primary" />
								</div>
							) : error ? (
								<Alert variant="danger">{error}</Alert>
							) : (
								<ListGroup variant="flush">
									{users.map((user) => (
										<ListGroup.Item
											key={user._id}
											action
											active={selectedUser && selectedUser._id === user._id}
											onClick={() => {
												fetchUserInfoAndReport(user._id);
											}}
											style={{ cursor: "pointer" }}
										>
											<div className="fw-bold d-flex align-items-center">
												<UserIcon size={16} className="me-2 text-secondary" />
												{user.firstName} {user.lastName}
											</div>
											<div className="small text-muted d-flex align-items-center">
												<Mail size={14} className="me-1" /> {user.email}
											</div>
											<div className="small d-flex align-items-center">
												<Shield size={14} className="me-1 text-info" />
												<span className="badge bg-info">{user.role}</span>
											</div>
										</ListGroup.Item>
									))}
								</ListGroup>
							)}
						</Card.Body>
					</Card>
				</Col>
				<Col md={8}>
					<Card>
						<Card.Header>
							<h5 className="fw-bold mb-0 d-flex align-items-center">
								<UserIcon size={20} className="me-2 text-primary" />
								{selectedUser
									? `Report for ${selectedUser.firstName} ${selectedUser.lastName}`
									: "Select a user to view report"}
							</h5>
						</Card.Header>
						<Card.Body style={{ minHeight: 400 }}>
							{reportLoading ? (
								<div className="text-center py-4">
									<Spinner animation="border" variant="primary" />
								</div>
							) : reportError ? (
								<Alert variant="danger">{reportError}</Alert>
							) : userReport ? (
								<Tab.Container defaultActiveKey="notes">
									<Nav variant="tabs" className="mb-3">
										<Nav.Item>
											<Nav.Link eventKey="notes">
												<FileText size={16} className="me-1" /> Notes
											</Nav.Link>
										</Nav.Item>
										<Nav.Item>
											<Nav.Link eventKey="flashcards">
												<BookOpen size={16} className="me-1" /> Flashcards
											</Nav.Link>
										</Nav.Item>
										<Nav.Item>
											<Nav.Link eventKey="quizzes">
												<ListChecks size={16} className="me-1" /> Quizzes
											</Nav.Link>
										</Nav.Item>
										<Nav.Item>
											<Nav.Link eventKey="quizResults">
												<BarChart3 size={16} className="me-1" /> Quiz Results
											</Nav.Link>
										</Nav.Item>
									</Nav>
									<Tab.Content>
										<Tab.Pane eventKey="notes">
											<h6 className="fw-bold mb-3 d-flex align-items-center">
												<FileText size={16} className="me-2 text-primary" />
												Notes ({userReport.notes.length})
											</h6>
											{userReport.notes.length === 0 ? (
												<div className="text-muted">No notes found.</div>
											) : (
												<Table striped bordered hover size="sm">
													<thead>
														<tr>
															<th>Title</th>
															<th>Folder</th>
															<th>Created</th>
														</tr>
													</thead>
													<tbody>
														{userReport.notes.map((note) => (
															<tr key={note._id}>
																<td>{note.title}</td>
																<td>{note.folder}</td>
																<td>
																	{new Date(note.createdAt).toLocaleString()}
																</td>
															</tr>
														))}
													</tbody>
												</Table>
											)}
										</Tab.Pane>
										<Tab.Pane eventKey="flashcards">
											<h6 className="fw-bold mb-3 d-flex align-items-center">
												<BookOpen size={16} className="me-2 text-success" />
												Flashcards ({userReport.flashcards.length})
											</h6>
											{userReport.flashcards.length === 0 ? (
												<div className="text-muted">No flashcards found.</div>
											) : (
												<Table striped bordered hover size="sm">
													<thead>
														<tr>
															<th>Front</th>
															<th>Back</th>
															<th>Deck</th>
														</tr>
													</thead>
													<tbody>
														{userReport.flashcards.map((card) => (
															<tr key={card._id}>
																<td>{card.frontContent}</td>
																<td>{card.backContent}</td>
																<td>{card.deckId?.name || "-"}</td>
															</tr>
														))}
													</tbody>
												</Table>
											)}
										</Tab.Pane>
										<Tab.Pane eventKey="quizzes">
											<h6 className="fw-bold mb-3 d-flex align-items-center">
												<ListChecks size={16} className="me-2 text-warning" />
												Quizzes ({userReport.quizzes.length})
											</h6>
											{userReport.quizzes.length === 0 ? (
												<div className="text-muted">No quizzes found.</div>
											) : (
												<Table striped bordered hover size="sm">
													<thead>
														<tr>
															<th>Title</th>
															<th>Type</th>
															<th>Total Questions</th>
															<th>Duration</th>
															<th>Created At</th>
														</tr>
													</thead>
													<tbody>
														{userReport.quizzes.map((quiz) => (
															<tr key={quiz._id}>
																<td>{quiz.title}</td>
																<td>{quiz.quizType}</td>
																<td>{quiz.totalQuestions}</td>
																<td>{formatTime(quiz.timeLimit * 60)}</td>
																<td>
																	{new Date(quiz.createdAt).toLocaleString()}
																</td>
															</tr>
														))}
													</tbody>
												</Table>
											)}
										</Tab.Pane>
										<Tab.Pane eventKey="quizResults">
											<h6 className="fw-bold mb-3 d-flex align-items-center">
												<BarChart3 size={16} className="me-2 text-info" />
												Quiz Results ({userReport.quizResults.length})
											</h6>
											{userReport.quizResults.length === 0 ? (
												<div className="text-muted">No quiz results found.</div>
											) : (
												<Table striped bordered hover size="sm">
													<thead>
														<tr>
															<th>Quiz</th>
															<th>Total Questions</th>
															<th>Obtained Marks</th>
															<th>Score</th>
															<th>Time Taken</th>
															<th>Date</th>
														</tr>
													</thead>
													<tbody>
														{userReport.quizResults.map((result) => (
															<tr key={result._id}>
																<td>{result.quizTitle || "-"}</td>
																<td>{result.totalQuestions || "-"}</td>
																<td>{result.correctAnswers || "-"}</td>
																<td>{result.score + "%" || "-"}</td>
																<td>{formatTime(result.timeTaken)}</td>
																<td>
																	{new Date(result.createdAt).toLocaleString()}
																</td>
															</tr>
														))}
													</tbody>
												</Table>
											)}
										</Tab.Pane>
									</Tab.Content>
								</Tab.Container>
							) : selectedUser ? (
								<div className="text-muted">
									Select a user to view their report.
								</div>
							) : null}
						</Card.Body>
					</Card>
				</Col>
			</Row>
		</Container>
	);
};

export default AdminUserReports;
