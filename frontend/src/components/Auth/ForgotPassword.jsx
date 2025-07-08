import React, { useState } from "react";
import {
	Container,
	Row,
	Col,
	Card,
	Form,
	Button,
	Alert,
	Spinner,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Mail, ArrowLeft } from "lucide-react";

const ForgotPassword = () => {
	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);
	const [error, setError] = useState("");

	const { forgotPassword, forgotLoading } = useAuth();

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError("");

		const result = await forgotPassword(email);

		if (result.success) {
			setSuccess(true);
		} else {
			setError(result.message);
		}

		setLoading(false);
	};

	if (success) {
		return (
			<div className="auth-container">
				<Container>
					<Row className="justify-content-center">
						<Col md={6} lg={5}>
							<Card className="auth-card">
								<Card.Body className="p-5 text-center">
									<div className="text-success mb-4">
										<Mail size={64} />
									</div>
									<h2 className="fw-bold text-primary mb-3">
										Check Your Email
									</h2>
									<p className="text-muted mb-4">
										We've sent a password reset link to <strong>{email}</strong>
									</p>
									<p className="text-muted mb-4">
										If you don't see the email, check your spam folder or try
										again.
									</p>
									<Link to="/login" className="btn btn-primary">
										<ArrowLeft size={16} className="me-2" />
										Back to Login
									</Link>
								</Card.Body>
							</Card>
						</Col>
					</Row>
				</Container>
			</div>
		);
	}

	return (
		<div className="auth-container">
			<Container>
				<Row className="justify-content-center">
					<Col md={6} lg={5}>
						<Card className="auth-card">
							<Card.Body className="p-5">
								<div className="text-center mb-4">
									<h2 className="fw-bold text-primary mb-2">
										Forgot Password?
									</h2>
									<p className="text-muted">
										Enter your email address and we'll send you a link to reset
										your password.
									</p>
								</div>

								{error && (
									<Alert variant="danger" className="mb-4">
										{error}
									</Alert>
								)}

								<Form onSubmit={handleSubmit}>
									<Form.Group className="mb-4">
										<Form.Label className="fw-semibold">
											Email Address
										</Form.Label>
										<div className="position-relative">
											<Form.Control
												type="email"
												value={email}
												onChange={(e) => setEmail(e.target.value)}
												placeholder="Enter your email"
												required
												className="ps-5"
											/>
											<Mail
												size={20}
												className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"
											/>
										</div>
									</Form.Group>

									<Button
										type="submit"
										className="w-100 mb-3 py-2"
										disabled={forgotLoading}
									>
										{forgotLoading ? (
											<Spinner size="sm" animation="border" className="me-2" />
										) : null}
										{forgotLoading ? "Sending..." : "Send Reset Link"}
									</Button>
								</Form>

								<div className="text-center">
									<Link to="/login" className="text-decoration-none">
										<ArrowLeft size={16} className="me-1" />
										Back to Login
									</Link>
								</div>
							</Card.Body>
						</Card>
					</Col>
				</Row>
			</Container>
		</div>
	);
};

export default ForgotPassword;
