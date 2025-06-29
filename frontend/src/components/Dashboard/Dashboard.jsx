import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import axios from "axios";
import {
	BookOpen,
	Brain,
	FileText,
	Award,
	TrendingUp,
	Plus,
	Upload,
	Play,
	Clock,
	Target,
	Calendar,
	Activity,
} from "lucide-react";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	LineChart,
	Line,
} from "recharts";
import QuickActionCard from "./QuickActionCard";
import StatCard from "./StatCard";

const Dashboard = () => {
	const { user } = useAuth();
	const [stats, setStats] = useState({
		totalNotes: 0,
		totalFlashcards: 0,
		totalQuizzes: 0,
		completedQuizzes: 0,
		averageScore: 0,
		studyStreak: 0,
		totalNotesTrend: 0,
		totalFlashcardsTrend: 0,
		totalQuizzesTrend: 0,
		completedQuizzesTrend: 0,
		averageScoreTrend: 0,
	});
	const [recentActivity, setRecentActivity] = useState([]);
	const [performanceData, setPerformanceData] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetchDashboardData();
	}, []);

	const fetchDashboardData = async () => {
		try {
			const [statsRes, activityRes, performanceRes] = await Promise.all([
				axios.get("/content/stats", {
					headers: {
						Authorization: `Bearer ${localStorage.getItem("token")}`,
					},
				}),
				axios.get("/content/stats/recent-activity", {
					headers: {
						Authorization: `Bearer ${localStorage.getItem("token")}`,
					},
				}),
				axios.get("/content/stats/performance", {
					headers: {
						Authorization: `Bearer ${localStorage.getItem("token")}`,
					},
				}),
			]);

			setStats(statsRes.data);
			setRecentActivity(activityRes.data);
			setPerformanceData(performanceRes.data);
		} catch (error) {
			console.error("Error fetching dashboard data:", error);
			// Set default data if API fails
			setStats({
				totalNotes: 0,
				totalFlashcards: 0,
				totalQuizzes: 0,
				completedQuizzes: 0,
				averageScore: 0,
				studyStreak: 0,
			});
			setRecentActivity([]);
			setPerformanceData([
				{ date: "Mon", score: 0 },
				{ date: "Tue", score: 0 },
				{ date: "Wed", score: 0 },
				{ date: "Thu", score: 0 },
				{ date: "Fri", score: 0 },
				{ date: "Sat", score: 0 },
				{ date: "Sun", score: 0 },
			]);
		} finally {
			setLoading(false);
		}
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
	const formatDate = (dateString) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	return (
		<Container fluid className="py-4">
			<Row className="mb-4">
				<Col>
					<h1 className="fw-bold mb-1">Welcome back, {user?.firstName}! 👋</h1>
					<p className="text-muted mb-0">
						Here's what's happening with your studies today.
					</p>
				</Col>
			</Row>

			{/* Statistics Cards */}
			<Row className="g-4 mb-5">
				<Col md={6} xl={3}>
					<StatCard
						title="Total Notes"
						value={stats.totalNotes}
						icon={FileText}
						color="primary"
						trend={stats.totalNotesTrend}
						description="Study materials uploaded"
					/>
				</Col>
				<Col md={6} xl={3}>
					<StatCard
						title="Flashcards Created"
						value={stats.totalFlashcards}
						icon={Brain}
						color="success"
						trend={stats.totalQuizzesTrend}
						description="AI-generated cards"
					/>
				</Col>
				<Col md={6} xl={3}>
					<StatCard
						title="Quizzes Completed"
						value={stats.completedQuizzes}
						icon={Award}
						color="warning"
						trend={stats.completedQuizzesTrend}
						description="Knowledge assessments"
					/>
				</Col>
				<Col md={6} xl={3}>
					<StatCard
						title="Average Score"
						value={`${stats.averageScore}%`}
						icon={Target}
						color="info"
						trend={stats.averageScoreTrend}
						description="Quiz performance"
					/>
				</Col>
			</Row>

			{/* Charts and Activity */}
			<Row className="g-4 mb-5">
				<Col lg={8}>
					<Card className="border-0 shadow-sm">
						<Card.Header className="bg-white border-0 py-3">
							<div className="d-flex justify-content-between align-items-center">
								<h5 className="fw-bold mb-0">
									<div className="d-flex align-items-center">
										<Activity size={20} className="me-2" />
										<span>Performance Overview</span>
									</div>
								</h5>
								<small className="text-muted">Last 7 days</small>
							</div>
						</Card.Header>
						<Card.Body>
							<ResponsiveContainer width="100%" height={300}>
								<BarChart data={performanceData}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="date" />
									<YAxis />
									<Tooltip />
									<Bar dataKey="score" fill="#0d6efd" radius={4} />
								</BarChart>
							</ResponsiveContainer>
						</Card.Body>
					</Card>
				</Col>
				<Col lg={4}>
					<Card className="border-0 shadow-sm">
						<Card.Header className="bg-white border-0 py-3">
							<h5 className="fw-bold mb-0">
								<div className="d-flex align-items-center">
									<Clock size={20} className="me-2" />
									<span>Recent Activity</span>
								</div>
							</h5>
						</Card.Header>
						<Card.Body className="px-0">
							{recentActivity.length > 0 ? (
								<div className="list-group list-group-flush">
									{recentActivity.map((activity, index) => (
										<div key={index} className="list-group-item border-0 px-3">
											<div className="d-flex align-items-center">
												<div className="rounded-circle bg-primary bg-opacity-10 p-2 me-3">
													<FileText size={16} className="text-primary" />
												</div>
												<div className="flex-grow-1">
													<h6 className="mb-1">{activity.title}</h6>
													<small className="text-muted d-flex align-items-center">
														<Calendar size={12} className="me-1" />
														{formatDate(activity.time)}
													</small>
												</div>
											</div>
										</div>
									))}
								</div>
							) : (
								<div className="text-center py-4">
									<div className="d-flex align-items-center">
										<Clock size={48} className="text-muted mb-3" />
										<p className="text-muted mb-0">No recent activity</p>
									</div>
									<small className="text-muted">
										Start studying to see your activity here
									</small>
								</div>
							)}
						</Card.Body>
					</Card>
				</Col>
			</Row>

			{/* Study Streak */}
			<Row className="mb-4">
				<Col>
					<Card
						className="border-0 shadow-sm bg-gradient"
						style={{
							background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
						}}
					>
						<Card.Body className="text-bold">
							<Row className="align-items-center">
								<Col md={8}>
									<h4 className="fw-bold mb-2">🔥 Study Streak</h4>
									<p className="mb-0">
										You're on a {stats.studyStreak}-day study streak! Keep it up
										to maintain your momentum.
									</p>
								</Col>
								<Col md={4} className="text-md-end">
									<h2 className="fw-bold mb-0">{stats.studyStreak} days</h2>
								</Col>
							</Row>
						</Card.Body>
					</Card>
				</Col>
			</Row>

			{/* Quick Actions */}
			<Row className="mb-4">
				<Col>
					<h3 className="fw-bold mb-3">Quick Actions</h3>
				</Col>
			</Row>

			<Row className="g-4">
				<Col md={6} lg={3}>
					<QuickActionCard
						title="Upload Notes"
						description="Upload your study materials and let AI analyze them"
						icon={Upload}
						color="primary"
						to="/notes"
					/>
				</Col>
				<Col md={6} lg={3}>
					<QuickActionCard
						title="Create Flashcards"
						description="Generate AI-powered flashcards from your notes"
						icon={Plus}
						color="success"
						to="/flashcards"
					/>
				</Col>
				<Col md={6} lg={3}>
					<QuickActionCard
						title="Take a Quiz"
						description="Test your knowledge with personalized quizzes"
						icon={Play}
						color="warning"
						to="/quiz"
					/>
				</Col>
				<Col md={6} lg={3}>
					<QuickActionCard
						title="Study Flashcards"
						description="Review your flashcards with spaced repetition"
						icon={BookOpen}
						color="info"
						to="/flashcards"
					/>
				</Col>
			</Row>

			{/* Study Tips */}
			<Row className="mt-5">
				<Col>
					<Card className="border-0 shadow-sm">
						<Card.Header className="bg-white border-0 py-3">
							<h5 className="fw-bold mb-0">💡 Study Tips</h5>
						</Card.Header>
						<Card.Body>
							<Row>
								<Col md={4}>
									<div className="text-center mb-3">
										<div className="rounded-circle bg-primary bg-opacity-10 p-3 mx-auto mb-2 d-inline-flex">
											<Clock size={24} className="text-primary" />
										</div>
										<h6 className="fw-bold">Consistent Schedule</h6>
										<p className="text-muted small">
											Study at the same time each day to build a habit
										</p>
									</div>
								</Col>
								<Col md={4}>
									<div className="text-center mb-3">
										<div className="rounded-circle bg-success bg-opacity-10 p-3 mx-auto mb-2 d-inline-flex">
											<Brain size={24} className="text-success" />
										</div>
										<h6 className="fw-bold">Active Recall</h6>
										<p className="text-muted small">
											Test yourself regularly with flashcards and quizzes
										</p>
									</div>
								</Col>
								<Col md={4}>
									<div className="text-center mb-3">
										<div className="rounded-circle bg-warning bg-opacity-10 p-3 mx-auto mb-2 d-inline-flex">
											<Target size={24} className="text-warning" />
										</div>
										<h6 className="fw-bold">Spaced Repetition</h6>
										<p className="text-muted small">
											Review material at increasing intervals for better
											retention
										</p>
									</div>
								</Col>
							</Row>
						</Card.Body>
					</Card>
				</Col>
			</Row>
		</Container>
	);
};

export default Dashboard;
