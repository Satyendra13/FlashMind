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
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";

const Register = () => {
	const [formData, setFormData] = useState({
		firstName: "",
		lastName: "",
		email: "",
		password: "",
		confirmPassword: "",
	});
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [error, setError] = useState("");

	const { register, registerLoading } = useAuth();
	const navigate = useNavigate();

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const validateForm = () => {
		if (formData.password !== formData.confirmPassword) {
			setError("Passwords do not match");
			return false;
		}

		if (formData.password.length < 8) {
			setError("Password must be at least 8 characters long");
			return false;
		}

		const passwordRegex =
			/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
		if (!passwordRegex.test(formData.password)) {
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

		const result = await register(formData);

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
									<h2 className="fw-bold text-primary mb-2">Create Account</h2>
									<p className="text-muted">
										Join us to start creating flashcards
									</p>
								</div>

								{error && (
									<Alert variant="danger" className="mb-4">
										{error}
									</Alert>
								)}

								<Form onSubmit={handleSubmit}>
									<Row>
										<Col md={6}>
											<Form.Group className="mb-3">
												<Form.Label className="fw-semibold">
													First Name
												</Form.Label>
												<div className="position-relative">
													<Form.Control
														type="text"
														name="firstName"
														value={formData.firstName}
														onChange={handleChange}
														placeholder="First name"
														required
														className="ps-5"
													/>
													<User
														size={20}
														className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"
													/>
												</div>
											</Form.Group>
										</Col>
										<Col md={6}>
											<Form.Group className="mb-3">
												<Form.Label className="fw-semibold">
													Last Name
												</Form.Label>
												<div className="position-relative">
													<Form.Control
														type="text"
														name="lastName"
														value={formData.lastName}
														onChange={handleChange}
														placeholder="Last name"
														required
														className="ps-5"
													/>
													<User
														size={20}
														className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"
													/>
												</div>
											</Form.Group>
										</Col>
									</Row>

									<Form.Group className="mb-3">
										<Form.Label className="fw-semibold">
											Email Address
										</Form.Label>
										<div className="position-relative">
											<Form.Control
												type="email"
												name="email"
												value={formData.email}
												onChange={handleChange}
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

									<Form.Group className="mb-3">
										<Form.Label className="fw-semibold">Password</Form.Label>
										<div className="position-relative">
											<Form.Control
												type={showPassword ? "text" : "password"}
												name="password"
												value={formData.password}
												onChange={handleChange}
												placeholder="Create password"
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
											Confirm Password
										</Form.Label>
										<div className="position-relative">
											<Form.Control
												type={showConfirmPassword ? "text" : "password"}
												name="confirmPassword"
												value={formData.confirmPassword}
												onChange={handleChange}
												placeholder="Confirm password"
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
										disabled={registerLoading}
									>
										{registerLoading ? (
											<Spinner size="sm" animation="border" className="me-2" />
										) : null}
										{registerLoading ? "Signing Up..." : "Sign Up"}
									</Button>
								</Form>

								<div className="text-center">
									<span className="text-muted">Already have an account? </span>
									<Link
										to="/login"
										className="text-decoration-none fw-semibold"
									>
										Sign in here
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

export default Register;
