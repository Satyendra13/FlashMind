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
import { Link, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Eye, EyeOff, Lock } from "lucide-react";

const ResetPassword = () => {
	const [formData, setFormData] = useState({
		newPassword: "",
		confirmPassword: "",
	});
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [error, setError] = useState("");

	const { token } = useParams();
	const { resetPassword, resetLoading } = useAuth();
	const navigate = useNavigate();

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const validateForm = () => {
		if (formData.newPassword !== formData.confirmPassword) {
			setError("Passwords do not match");
			return false;
		}

		if (formData.newPassword.length < 8) {
			setError("Password must be at least 8 characters long");
			return false;
		}

		const passwordRegex =
			/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
		if (!passwordRegex.test(formData.newPassword)) {
			setError(
				"Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
			);
			return false;
		}

		return true;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");

		if (!validateForm()) {
			return;
		}

		const result = await resetPassword(
			token,
			formData.newPassword,
			formData.confirmPassword
		);

		if (result.success) {
			navigate("/login");
		} else {
			setError(result.message);
		}
	};

	return (
		<div className="auth-container">
			<Container>
				<Row className="justify-content-center">
					<Col md={6} lg={5}>
						<Card className="auth-card">
							<Card.Body className="p-5">
								<div className="text-center mb-4">
									<h2 className="fw-bold text-primary mb-2">Reset Password</h2>
									<p className="text-muted">Enter your new password below</p>
								</div>

								{error && (
									<Alert variant="danger" className="mb-4">
										{error}
									</Alert>
								)}

								<Form onSubmit={handleSubmit}>
									<Form.Group className="mb-3">
										<Form.Label className="fw-semibold">
											New Password
										</Form.Label>
										<div className="position-relative">
											<Form.Control
												type={showPassword ? "text" : "password"}
												name="newPassword"
												value={formData.newPassword}
												onChange={handleChange}
												placeholder="Enter new password"
												required
												className="ps-5 pe-5"
											/>
											<Lock
												size={20}
												className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"
											/>
											<button
												type="button"
												className="btn btn-link position-absolute top-50 end-0 translate-middle-y me-2 p-0"
												onClick={() => setShowPassword(!showPassword)}
											>
												{showPassword ? (
													<EyeOff size={20} />
												) : (
													<Eye size={20} />
												)}
											</button>
										</div>
									</Form.Group>

									<Form.Group className="mb-4">
										<Form.Label className="fw-semibold">
											Confirm New Password
										</Form.Label>
										<div className="position-relative">
											<Form.Control
												type={showConfirmPassword ? "text" : "password"}
												name="confirmPassword"
												value={formData.confirmPassword}
												onChange={handleChange}
												placeholder="Confirm new password"
												required
												className="ps-5 pe-5"
											/>
											<Lock
												size={20}
												className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"
											/>
											<button
												type="button"
												className="btn btn-link position-absolute top-50 end-0 translate-middle-y me-2 p-0"
												onClick={() =>
													setShowConfirmPassword(!showConfirmPassword)
												}
											>
												{showConfirmPassword ? (
													<EyeOff size={20} />
												) : (
													<Eye size={20} />
												)}
											</button>
										</div>
									</Form.Group>

									<Button
										type="submit"
										className="w-100 mb-3 py-2"
										disabled={resetLoading}
									>
										{resetLoading ? (
											<Spinner size="sm" animation="border" className="me-2" />
										) : null}
										{resetLoading ? "Resetting..." : "Reset Password"}
									</Button>
								</Form>

								<div className="text-center">
									<Link to="/login" className="text-decoration-none">
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

export default ResetPassword;
