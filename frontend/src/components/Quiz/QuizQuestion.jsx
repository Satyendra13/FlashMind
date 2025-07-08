import React from "react";
import { Card, Form, Badge } from "react-bootstrap";

const QuizQuestion = ({
	question,
	questionIndex,
	selectedAnswer,
	quizType,
	onAnswerSelect,
}) => (
	<Card className="border-0 shadow-sm">
		<Card.Body>
			<div className="d-flex justify-content-between align-items-center mb-3">
				<h6 className="text-muted mb-0">Question {questionIndex + 1}</h6>
				<Badge bg="primary">{quizType.replace("_", " ")}</Badge>
			</div>
			<h5 className="mb-4">{question.question}</h5>
			{quizType === "multiple_choice" && (
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
			{quizType === "true_false" && (
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
			{quizType === "fill_blank" && (
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

export default QuizQuestion;
