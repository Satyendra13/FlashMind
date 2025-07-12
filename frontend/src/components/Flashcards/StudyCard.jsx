import React from "react";
import { Button, Badge } from "react-bootstrap";
import { RotateCcw, CheckCircle, XCircle, Brain } from "lucide-react";

const StudyCard = ({
	card,
	flipped,
	onFlip,
	onResponse,
	showResponseButtons,
}) => {
	const DifficultyBadge = ({ difficulty }) => {
		const colors = {
			easy: "success",
			medium: "warning",
			hard: "danger",
		};
		return <Badge bg={colors[difficulty]}>{difficulty}</Badge>;
	};

	return (
		<div className="study-card-container">
			{/* 3D Flip Card */}
			<div
				className={`study-card ${flipped ? "flipped" : ""}`}
				onClick={onFlip}
				style={{
					perspective: "1000px",
					width: "100%",
					height: "400px",
					cursor: "pointer",
					marginBottom: "2rem",
				}}
			>
				<div
					className="study-card-inner"
					style={{
						position: "relative",
						width: "100%",
						height: "100%",
						textAlign: "center",
						transition:
							"transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
						transformStyle: "preserve-3d",
						transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
					}}
				>
					{/* Front Side */}
					<div
						className="study-card-side front-side"
						style={{
							position: "absolute",
							width: "100%",
							height: "100%",
							backfaceVisibility: "hidden",
							background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
							borderRadius: "25px",
							padding: "2.5rem",
							display: "flex",
							flexDirection: "column",
							justifyContent: "space-between",
							boxShadow: "0 15px 35px rgba(0,0,0,0.3)",
							border: "3px solid rgba(255,255,255,0.1)",
							overflow: "hidden",
						}}
					>
						{/* Decorative background pattern */}
						<div
							style={{
								position: "absolute",
								top: "-50%",
								right: "-50%",
								width: "200%",
								height: "200%",
								background:
									"radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)",
								backgroundSize: "20px 20px",
								opacity: 0.3,
							}}
						/>

						<div
							className="d-flex justify-content-between align-items-start"
							style={{ position: "relative", zIndex: 1 }}
						>
							<Badge
								bg="light"
								text="dark"
								style={{
									fontSize: "0.9rem",
									padding: "0.6rem 1.2rem",
									borderRadius: "20px",
									fontWeight: "600",
								}}
							>
								Question
							</Badge>
							<DifficultyBadge difficulty={card.difficulty} />
						</div>

						<div
							className="flex-grow-1 d-flex align-items-center justify-content-center"
							style={{ position: "relative", zIndex: 1 }}
						>
							<h3
								className="mb-0 text-white fw-bold"
								style={{
									lineHeight: "1.5",
									textShadow: "0 3px 6px rgba(0,0,0,0.4)",
									fontSize: "1.5rem",
								}}
							>
								{card.frontContent}
							</h3>
						</div>

						<div
							className="text-center"
							style={{ position: "relative", zIndex: 1 }}
						>
							<small className="text-white-50 d-flex align-items-center justify-content-center">
								<div className="d-flex align-items-center">
									<RotateCcw size={16} className="me-2" />
									<span>Click to reveal answer</span>
								</div>
							</small>
						</div>
					</div>

					{/* Back Side */}
					<div
						className="study-card-side back-side"
						style={{
							position: "absolute",
							width: "100%",
							height: "100%",
							backfaceVisibility: "hidden",
							background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
							borderRadius: "25px",
							padding: "2.5rem",
							display: "flex",
							flexDirection: "column",
							justifyContent: "space-between",
							boxShadow: "0 15px 35px rgba(0,0,0,0.3)",
							border: "3px solid rgba(255,255,255,0.1)",
							transform: "rotateY(180deg)",
							overflow: "hidden",
						}}
					>
						{/* Decorative background pattern */}
						<div
							style={{
								position: "absolute",
								top: "-50%",
								right: "-50%",
								width: "200%",
								height: "200%",
								background:
									"radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)",
								backgroundSize: "20px 20px",
								opacity: 0.3,
							}}
						/>

						<div
							className="d-flex justify-content-between align-items-start"
							style={{ position: "relative", zIndex: 1 }}
						>
							<Badge
								bg="light"
								text="dark"
								style={{
									fontSize: "0.9rem",
									padding: "0.6rem 1.2rem",
									borderRadius: "20px",
									fontWeight: "600",
								}}
							>
								Answer
							</Badge>
							<small className="text-white-50 d-flex align-items-center">
								<div className="d-flex align-items-center">
									<CheckCircle size={16} className="me-2" />
									<span>Rate your knowledge</span>
								</div>
							</small>
						</div>

						<div
							className="flex-grow-1 d-flex align-items-center justify-content-center"
							style={{ position: "relative", zIndex: 1 }}
						>
							<h3
								className="mb-0 text-white fw-bold"
								style={{
									lineHeight: "1.5",
									textShadow: "0 3px 6px rgba(0,0,0,0.4)",
									fontSize: "1.5rem",
								}}
							>
								{card.backContent}
							</h3>
						</div>

						<div
							className="text-center"
							style={{ position: "relative", zIndex: 1 }}
						>
							<small className="text-white-50">
								How well did you know this?
							</small>
						</div>
					</div>
				</div>
			</div>

			{/* Response Buttons */}
			{showResponseButtons && (
				<div className="text-center">
					<div className="mb-4">
						<h6 className="text-muted mb-3">
							<div className="d-flex flex-column align-items-center">
								<Brain size={18} className="me-2" />
								<span>How well did you know this?</span>
							</div>
						</h6>
					</div>
					<div className="d-flex gap-4 justify-content-center">
						<Button
							variant="outline-danger"
							size="lg"
							onClick={() => onResponse(false)}
							style={{
								borderRadius: "50px",
								padding: "1rem 2.5rem",
								borderWidth: "3px",
								fontWeight: "bold",
								fontSize: "1.1rem",
								minWidth: "160px",
							}}
						>
							<div className="d-flex align-items-center justify-content-center">
								<XCircle size={20} className="me-2" />
								<span>Incorrect</span>
							</div>
						</Button>
						<Button
							variant="outline-success"
							size="lg"
							onClick={() => onResponse(true)}
							style={{
								borderRadius: "50px",
								padding: "1rem 2.5rem",
								borderWidth: "3px",
								fontWeight: "bold",
								fontSize: "1.1rem",
								minWidth: "160px",
							}}
						>
							<div className="d-flex align-items-center justify-content-center">
								<CheckCircle size={20} className="me-2" />
								<span>Correct</span>
							</div>
						</Button>
					</div>
				</div>
			)}

			{/* Reveal Button */}
			{!flipped && (
				<div className="text-center">
					<Button
						variant="primary"
						size="lg"
						onClick={onFlip}
						style={{
							background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
							border: "none",
							borderRadius: "50px",
							padding: "1rem 3rem",
							boxShadow: "0 8px 25px rgba(102, 126, 234, 0.4)",
							fontSize: "1.1rem",
							fontWeight: "bold",
						}}
					>
						<div className="d-flex align-items-center justify-content-center">
							<RotateCcw size={20} className="me-2" />
							<span>Reveal Answer</span>
						</div>
					</Button>
				</div>
			)}
		</div>
	);
};

export default StudyCard;
