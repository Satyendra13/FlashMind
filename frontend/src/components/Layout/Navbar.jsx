import React from "react";
import {
	Navbar as BootstrapNavbar,
	Nav,
	Container,
	NavDropdown,
} from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { BookOpen, User, LogOut, Brain } from "lucide-react";

const Navbar = () => {
	const { isAuthenticated, user, logout } = useAuth();
	const location = useLocation();

	const handleLogout = () => {
		logout();
	};

	return (
		<BootstrapNavbar bg="white" expand="lg" className="shadow-sm sticky-top">
			<Container>
				<BootstrapNavbar.Brand
					as={Link}
					to="/dashboard"
					className="fw-bold text-primary"
				>
					<div className="flex items-center space-x-2">
						<div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
							<Brain className="text-white w-6 h-6" />
						</div>
						<span className="text-2xl font-bold">FlashMind</span>
					</div>
				</BootstrapNavbar.Brand>

				<BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
				<BootstrapNavbar.Collapse id="basic-navbar-nav">
					{isAuthenticated && (
						<Nav className="me-auto">
							<Nav.Link
								as={Link}
								to="/dashboard"
								className={
									location.pathname === "/dashboard" ? "active fw-semibold" : ""
								}
							>
								Dashboard
							</Nav.Link>
							<Nav.Link
								as={Link}
								to="/notes"
								className={
									location.pathname === "/notes" ? "active fw-semibold" : ""
								}
							>
								Notes
							</Nav.Link>
							<Nav.Link
								as={Link}
								to="/flashcards"
								className={
									location.pathname === "/flashcards"
										? "active fw-semibold"
										: ""
								}
							>
								Flashcards
							</Nav.Link>
							<Nav.Link
								as={Link}
								to="/quiz"
								className={
									location.pathname === "/quiz" ? "active fw-semibold" : ""
								}
							>
								Quiz
							</Nav.Link>
						</Nav>
					)}

					<Nav className="ms-auto">
						{isAuthenticated ? (
							<NavDropdown
								title={
									<span className="d-inline-flex align-items-center">
										<User size={16} className="me-1" />
										{user?.firstName || "User"}
									</span>
								}
								id="user-dropdown"
								className="d-flex align-items-center"
								align="end"
							>
								<NavDropdown.Item as={Link} to="/profile">
									<div className="d-flex align-items-center">
										<User size={16} className="me-2" />
										<span>Profile</span>
									</div>
								</NavDropdown.Item>
								<NavDropdown.Divider />
								<NavDropdown.Item onClick={handleLogout}>
									<div className="d-flex align-items-center">
										<LogOut size={16} className="me-2" />
										<span>Logout</span>
									</div>
								</NavDropdown.Item>
							</NavDropdown>
						) : (
							<>
								<Nav.Link as={Link} to="/login">
									Login
								</Nav.Link>
								<Nav.Link as={Link} to="/register">
									<span className="btn btn-primary btn-sm">Sign Up</span>
								</Nav.Link>
							</>
						)}
					</Nav>
				</BootstrapNavbar.Collapse>
			</Container>
		</BootstrapNavbar>
	);
};

export default Navbar;
