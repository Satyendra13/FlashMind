import React from "react";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Navbar from "./components/Layout/Navbar";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import ForgotPassword from "./components/Auth/ForgotPassword";
import ResetPassword from "./components/Auth/ResetPassword";
import EmailVerification from "./components/Auth/EmailVerification";
import Dashboard from "./components/Dashboard/Dashboard";
import Notes from "./components/Notes/Notes";
import Flashcards from "./components/Flashcards/Flashcards";
import Quiz from "./components/Quiz/Quiz";
import Profile from "./components/Profile/Profile";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
	const { isAuthenticated, loading } = useAuth();

	if (loading) {
		return (
			<div className="d-flex justify-content-center align-items-center min-vh-100">
				<div className="spinner-border text-primary" role="status">
					<span className="visually-hidden">Loading...</span>
				</div>
			</div>
		);
	}

	return isAuthenticated ? children : <Navigate to="/login" />;
}

function PublicRoute({ children }) {
	const { isAuthenticated, loading } = useAuth();

	if (loading) {
		return (
			<div className="d-flex justify-content-center align-items-center min-vh-100">
				<div className="spinner-border text-primary" role="status">
					<span className="visually-hidden">Loading...</span>
				</div>
			</div>
		);
	}

	return !isAuthenticated ? children : <Navigate to="/dashboard" />;
}

function App() {
	return (
		<AuthProvider>
			<BrowserRouter>
				<div className="App">
					<Navbar />
					<main>
						<Routes>
							<Route path="/" element={<Navigate to="/dashboard" />} />
							<Route
								path="/login"
								element={
									<PublicRoute>
										<Login />
									</PublicRoute>
								}
							/>
							<Route
								path="/register"
								element={
									<PublicRoute>
										<Register />
									</PublicRoute>
								}
							/>
							<Route
								path="/forgot-password"
								element={
									<PublicRoute>
										<ForgotPassword />
									</PublicRoute>
								}
							/>
							<Route
								path="/reset-password/:token"
								element={
									<PublicRoute>
										<ResetPassword />
									</PublicRoute>
								}
							/>
							<Route
								path="/verify-email/:token"
								element={<EmailVerification />}
							/>
							<Route
								path="/dashboard"
								element={
									<ProtectedRoute>
										<Dashboard />
									</ProtectedRoute>
								}
							/>
							<Route
								path="/notes"
								element={
									<ProtectedRoute>
										<Notes />
									</ProtectedRoute>
								}
							/>
							<Route
								path="/flashcards"
								element={
									<ProtectedRoute>
										<Flashcards />
									</ProtectedRoute>
								}
							/>
							<Route
								path="/quiz"
								element={
									<ProtectedRoute>
										<Quiz />
									</ProtectedRoute>
								}
							/>
							<Route
								path="/profile"
								element={
									<ProtectedRoute>
										<Profile />
									</ProtectedRoute>
								}
							/>
						</Routes>
					</main>
					<Toaster position="top-right" />
				</div>
			</BrowserRouter>
		</AuthProvider>
	);
}

export default App;
