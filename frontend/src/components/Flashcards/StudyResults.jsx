import React from "react";
import { Modal, Button, Row, Col, Alert } from "react-bootstrap";
import {
	Award,
	RotateCcw,
	CheckCircle,
	Target,
	Clock,
	TrendingUp,
	Star,
} from "lucide-react";

const StudyResults = ({
	show,
	onHide,
	sessionStats,
	totalCards,
	onRestart,
	onFinish,
}) => {
	const getPerformanceMessage = (accuracy) => {
		if (accuracy >= 90) {
			return {
				title: "Outstanding Performance! 🏆",
				message:
					"You're absolutely crushing it! This level of mastery is exceptional!",
				variant: "success",
				icon: "🏆",
			};
		} else if (accuracy >= 80) {
			return {
				title: "Excellent Work! 🎉",
				message:
					"You're mastering this material! Keep up the fantastic progress!",
				variant: "success",
				icon: "🎉",
			};
		} else if (accuracy >= 70) {
			return {
				title: "Great Progress! 💪",
				message:
					"You're doing really well! A bit more practice and you'll be unstoppable!",
				variant: "warning",
				icon: "💪",
			};
		} else if (accuracy >= 60) {
			return {
				title: "Good Effort! 📚",
				message:
					"You're on the right track! Keep practicing to improve further!",
				variant: "info",
				icon: "📚",
			};
		} else {
			return {
				title: "Keep Going! 🌱",
				message:
					"Every study session makes you stronger! Don't give up, you're learning!",
				variant: "info",
				icon: "🌱",
			};
		}
	};

	const getAchievementBadges = (accuracy, streak) => {
		const badges = [];

		if (accuracy >= 90)
			badges.push({ name: "Perfect Score", icon: "🏆", color: "#FFD700" });
		if (accuracy >= 80)
			badges.push({ name: "High Achiever", icon: "⭐", color: "#FF6B6B" });
		if (streak >= 5)
			badges.push({ name: "Streak Master", icon: "🔥", color: "#FF8C42" });
		if (sessionStats.timeSpent < 10)
			badges.push({ name: "Speed Demon", icon: "⚡", color: "#4ECDC4" });
		if (totalCards >= 20)
			badges.push({ name: "Marathon Runner", icon: "🏃", color: "#45B7D1" });

		return badges;
	};

	const performance = getPerformanceMessage(sessionStats.accuracy);
	const achievements = getAchievementBadges(
		sessionStats.accuracy,
		sessionStats.streak
	);

	return (
		<Modal show={show} onHide={onHide} centered size="lg" backdrop="static">
			<Modal.Header
				style={{
					background: "linear-gradient(135deg, #28a745 0%, #20c997 100%)",
					color: "white",
					borderBottom: "none",
					borderRadius: "15px 15px 0 0",
				}}
			>
				<Modal.Title className="d-flex align-items-center justify-content-between w-100">
					<div className="d-flex align-items-center">
						<Award size={28} className="me-2" />
						<span className="fw-bold">Session Complete!</span>
					</div>
					<div className="d-flex align-items-center">
						<CheckCircle size={20} className="me-2" />
						<span style={{ fontSize: "0.9rem" }}>Finished</span>
					</div>
				</Modal.Title>
			</Modal.Header>

			<Modal.Body style={{ padding: "2rem" }}>
				<div className="text-center">
					{/* Celebration Icon */}
					<div className="mb-4">
						<div
							className="rounded-circle mx-auto d-flex align-items-center justify-content-center"
							style={{
								width: "100px",
								height: "100px",
								background: "linear-gradient(135deg, #28a745 0%, #20c997 100%)",
								boxShadow: "0 12px 30px rgba(40, 167, 69, 0.4)",
							}}
						>
							<span style={{ fontSize: "3rem" }}>{performance.icon}</span>
						</div>
					</div>

					{/* Performance Message */}
					<h3 className="fw-bold mb-3 text-success">{performance.title}</h3>
					<p className="text-muted mb-4" style={{ fontSize: "1.1rem" }}>
						{performance.message}
					</p>

					{/* Main Stats Cards */}
					<div className="row g-3 mb-4">
						<Col md={4}>
							<div
								className="p-4 rounded text-center"
								style={{
									background:
										"linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
									boxShadow: "0 8px 25px rgba(102, 126, 234, 0.3)",
								}}
							>
								<h2 className="text-white fw-bold mb-2">{totalCards}</h2>
								<small className="text-white-50 fw-semibold">Total Cards</small>
							</div>
						</Col>
						<Col md={4}>
							<div
								className="p-4 rounded text-center"
								style={{
									background:
										"linear-gradient(135deg, #28a745 0%, #20c997 100%)",
									boxShadow: "0 8px 25px rgba(40, 167, 69, 0.3)",
								}}
							>
								<h2 className="text-white fw-bold mb-2">
									{sessionStats.accuracy}%
								</h2>
								<small className="text-white-50 fw-semibold">Accuracy</small>
							</div>
						</Col>
						<Col md={4}>
							<div
								className="p-4 rounded text-center"
								style={{
									background:
										"linear-gradient(135deg, #fd7e14 0%, #ffc107 100%)",
									boxShadow: "0 8px 25px rgba(253, 126, 20, 0.3)",
								}}
							>
								<h2 className="text-white fw-bold mb-2">
									{sessionStats.timeSpent}
								</h2>
								<small className="text-white-50 fw-semibold">Minutes</small>
							</div>
						</Col>
					</div>

					{/* Detailed Stats */}
					<div className="row g-3 mb-4">
						<Col md={6}>
							<div
								className="p-3 rounded"
								style={{
									background: "rgba(102, 126, 234, 0.1)",
									border: "1px solid rgba(102, 126, 234, 0.2)",
								}}
							>
								<h6 className="text-primary fw-bold mb-3">
									<Target size={18} className="me-2" />
									Performance Breakdown
								</h6>
								<div className="d-flex justify-content-between align-items-center mb-2">
									<span className="text-muted">Correct Answers</span>
									<span className="fw-bold text-success">
										{Math.round((sessionStats.accuracy / 100) * totalCards)}
									</span>
								</div>
								<div className="d-flex justify-content-between align-items-center mb-2">
									<span className="text-muted">Incorrect Answers</span>
									<span className="fw-bold text-danger">
										{totalCards -
											Math.round((sessionStats.accuracy / 100) * totalCards)}
									</span>
								</div>
								<div className="d-flex justify-content-between align-items-center">
									<span className="text-muted">Best Streak</span>
									<span className="fw-bold text-primary">
										{sessionStats.bestStreak} cards
									</span>
								</div>
							</div>
						</Col>

						<Col md={6}>
							<div
								className="p-3 rounded"
								style={{
									background: "rgba(40, 167, 69, 0.1)",
									border: "1px solid rgba(40, 167, 69, 0.2)",
								}}
							>
								<h6 className="text-success fw-bold mb-3">
									<TrendingUp size={18} className="me-2" />
									Study Insights
								</h6>
								<div className="d-flex justify-content-between align-items-center mb-2">
									<span className="text-muted">Cards per Minute</span>
									<span className="fw-bold text-success">
										{(totalCards / sessionStats.timeSpent).toFixed(1)}
									</span>
								</div>
								<div className="d-flex justify-content-between align-items-center mb-2">
									<span className="text-muted">Study Efficiency</span>
									<span className="fw-bold text-success">
										{sessionStats.accuracy >= 80
											? "Excellent"
											: sessionStats.accuracy >= 60
											? "Good"
											: "Needs Practice"}
									</span>
								</div>
								<div className="d-flex justify-content-between align-items-center">
									<span className="text-muted">Next Goal</span>
									<span className="fw-bold text-primary">
										{sessionStats.accuracy >= 90
											? "Maintain"
											: sessionStats.accuracy >= 80
											? "90%+"
											: "80%+"}
									</span>
								</div>
							</div>
						</Col>
					</div>

					{/* Achievements */}
					{achievements.length > 0 && (
						<div className="mb-4">
							<h6 className="fw-bold mb-3">
								<div className="d-flex flex-column align-items-center">
									<Star size={18} className="me-2" />
									<span>Achievements Unlocked!</span>
								</div>
							</h6>
							<div className="d-flex flex-wrap gap-2 justify-content-center">
								{achievements.map((badge, index) => (
									<div
										key={index}
										className="d-flex align-items-center p-2 rounded"
										style={{
											background: `${badge.color}20`,
											border: `2px solid ${badge.color}`,
											borderRadius: "20px",
										}}
									>
										<span style={{ fontSize: "1.2rem", marginRight: "0.5rem" }}>
											{badge.icon}
										</span>
										<span
											className="fw-semibold"
											style={{ color: badge.color }}
										>
											{badge.name}
										</span>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Performance Alert */}
					<Alert
						variant={performance.variant}
						className="border-0 mb-4"
						style={{
							background:
								performance.variant === "success"
									? "rgba(40, 167, 69, 0.1)"
									: performance.variant === "warning"
									? "rgba(255, 193, 7, 0.1)"
									: "rgba(13, 202, 240, 0.1)",
						}}
					>
						<strong>{performance.title}</strong> {performance.message}
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
					variant="outline-primary"
					onClick={onRestart}
					style={{
						borderRadius: "50px",
						padding: "0.75rem 2rem",
					}}
				>
					<div className="d-flex align-items-center">
						<RotateCcw size={18} className="me-2" />
						<span>Study Again</span>
					</div>
				</Button>
				<Button
					variant="primary"
					onClick={onFinish}
					style={{
						borderRadius: "50px",
						padding: "0.75rem 2rem",
						background: "linear-gradient(135deg, #28a745 0%, #20c997 100%)",
						border: "none",
					}}
				>
					<div className="d-flex align-items-center">
						<CheckCircle size={18} className="me-2" />
						<span>Finish</span>
					</div>
				</Button>
			</Modal.Footer>
		</Modal>
	);
};

export default StudyResults;
