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
import { Eye, EyeOff, Mail, Lock } from "lucide-react";

const Login = () => {
	const [formData, setFormData] = useState({
		email: "",
		password: "",
		rememberMe: false,
	});
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState("");

	const { login, loginLoading } = useAuth();
	const navigate = useNavigate();

	const handleChange = (e) => {
		const { name, value, type, checked } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: type === "checkbox" ? checked : value,
		}));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");

		const result = await login(
			formData.email,
			formData.password,
			formData.rememberMe
		);

		if (result.success) {
			navigate("/dashboard");
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
									<h2 className="fw-bold text-primary mb-2">Welcome Back</h2>
									<p className="text-muted">
										Sign in to your account to continue
									</p>
								</div>

								{error && (
									<Alert variant="danger" className="mb-4">
										{error}
									</Alert>
								)}

								<Form onSubmit={handleSubmit}>
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
												placeholder="Enter your password"
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

									<div className="d-flex justify-content-between align-items-center mb-4">
										<Form.Check
											type="checkbox"
											name="rememberMe"
											label="Remember me"
											checked={formData.rememberMe}
											onChange={handleChange}
										/>
										<Link
											to="/forgot-password"
											className="text-decoration-none small text-primary"
										>
											Forgot password?
										</Link>
									</div>

									<Button
										type="submit"
										className="w-100 mb-3 py-2"
										disabled={loginLoading}
									>
										{loginLoading ? (
											<Spinner size="sm" animation="border" className="me-2" />
										) : null}
										{loginLoading ? "Signing In..." : "Sign In"}
									</Button>
								</Form>

								<div className="text-center">
									<span className="text-muted">Don't have an account? </span>
									<Link
										to="/register"
										className="text-decoration-none fw-semibold"
									>
										Sign up here
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

export default Login;
