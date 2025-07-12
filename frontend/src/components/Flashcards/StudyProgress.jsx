import React from "react";
import { Row, Col, ProgressBar, Badge } from "react-bootstrap";
import {
	Play,
	Target,
	Clock,
	TrendingUp,
	CheckCircle,
	XCircle,
} from "lucide-react";

const StudyProgress = ({
	studySession,
	currentCardIndex,
	totalCards,
	currentAccuracy,
	progressPercentage,
}) => {
	const formatTime = (seconds) => {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
	};

	return (
		<div className="mb-4">
			{/* Main Progress Section */}
			<div
				className="p-4 rounded mb-4"
				style={{
					background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
					border: "1px solid rgba(0,0,0,0.05)",
				}}
			>
				<div className="d-flex justify-content-between align-items-center mb-3">
					<h6 className="mb-0 fw-bold text-primary">
						<div className="d-flex align-items-center">
							<Play size={18} className="me-2" />
							<span>Study Progress</span>
						</div>
					</h6>
					<Badge
						bg="primary"
						style={{
							fontSize: "1rem",
							padding: "0.75rem 1.5rem",
							borderRadius: "25px",
						}}
					>
						Card {currentCardIndex + 1} of {totalCards}
					</Badge>
				</div>

				<ProgressBar
					now={progressPercentage}
					style={{
						height: "15px",
						borderRadius: "8px",
						backgroundColor: "#e9ecef",
						marginBottom: "1.5rem",
					}}
					className="mb-3"
				/>

				{/* Stats Grid */}
				<Row className="g-3">
					<Col md={3}>
						<div
							className="p-3 rounded text-center"
							style={{
								background: "rgba(25, 135, 84, 0.1)",
								border: "1px solid rgba(25, 135, 84, 0.2)",
							}}
						>
							<div className="d-flex align-items-center justify-content-center mb-2">
								<Target size={20} className="text-success me-2" />
								<h5 className="mb-0 text-success fw-bold">
									{currentAccuracy}%
								</h5>
							</div>
							<small className="text-muted fw-semibold">Accuracy</small>
						</div>
					</Col>

					<Col md={3}>
						<div
							className="p-3 rounded text-center"
							style={{
								background: "rgba(13, 110, 253, 0.1)",
								border: "1px solid rgba(13, 110, 253, 0.2)",
							}}
						>
							<div className="d-flex align-items-center justify-content-center mb-2">
								<CheckCircle size={20} className="text-primary me-2" />
								<h5 className="mb-0 text-primary fw-bold">
									{studySession.correctAnswers}
								</h5>
							</div>
							<small className="text-muted fw-semibold">Correct</small>
						</div>
					</Col>

					<Col md={3}>
						<div
							className="p-3 rounded text-center"
							style={{
								background: "rgba(220, 53, 69, 0.1)",
								border: "1px solid rgba(220, 53, 69, 0.2)",
							}}
						>
							<div className="d-flex align-items-center justify-content-center mb-2">
								<XCircle size={20} className="text-danger me-2" />
								<h5 className="mb-0 text-danger fw-bold">
									{studySession.completedCards - studySession.correctAnswers}
								</h5>
							</div>
							<small className="text-muted fw-semibold">Incorrect</small>
						</div>
					</Col>

					<Col md={3}>
						<div
							className="p-3 rounded text-center"
							style={{
								background: "rgba(255, 193, 7, 0.1)",
								border: "1px solid rgba(255, 193, 7, 0.2)",
							}}
						>
							<div className="d-flex align-items-center justify-content-center mb-2">
								<Clock size={20} className="text-warning me-2" />
								<h5 className="mb-0 text-warning fw-bold">
									{formatTime(studySession.timeSpent)}
								</h5>
							</div>
							<small className="text-muted fw-semibold">Time</small>
						</div>
					</Col>
				</Row>
			</div>

			{/* Streak Section */}
			{studySession.streak > 0 && (
				<div
					className="p-3 rounded text-center mb-4"
					style={{
						background: "linear-gradient(135deg, #28a745 0%, #20c997 100%)",
						color: "white",
						boxShadow: "0 4px 15px rgba(40, 167, 69, 0.3)",
					}}
				>
					<div className="d-flex align-items-center justify-content-center">
						<TrendingUp size={24} className="me-2" />
						<h5 className="mb-0 fw-bold">
							{studySession.streak} Card{studySession.streak !== 1 ? "s" : ""}{" "}
							Streak! 🔥
						</h5>
					</div>
					<small className="text-white-75">Keep up the great work!</small>
				</div>
			)}
		</div>
	);
};

export default StudyProgress;
