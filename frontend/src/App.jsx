import React from "react";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Navbar from "./components/Layout/Navbar";
import Home from "./components/Home/Home";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import ForgotPassword from "./components/Auth/ForgotPassword";
import ResetPassword from "./components/Auth/ResetPassword";
import EmailVerification from "./components/Auth/EmailVerification";
import Dashboard from "./components/Dashboard/Dashboard";
import Notes from "./components/Notes/Notes";
import NoteView from "./components/Notes/NoteView";
import Flashcards from "./components/Flashcards/Flashcards";
import StudyPage from "./components/Flashcards/StudyPage";
import Quiz from "./components/Quiz/Quiz";
import Profile from "./components/Profile/Profile";
import QuizTakePage from "./components/Quiz/QuizTakePage";
import QuizResultsPage from "./components/Quiz/QuizResultsPage";
import QuizExplanationPage from "./components/Quiz/QuizExplanationPage";
import QuizResultsListPage from "./components/Quiz/QuizResultsListPage";
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

function AppContent() {
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

	return (
		<div className="App">
			{isAuthenticated && <Navbar />}
			<main>
				<Routes>
					<Route
						path="/"
						element={isAuthenticated ? <Navigate to="/dashboard" /> : <Home />}
					/>
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
					<Route path="/verify-email/:token" element={<EmailVerification />} />
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
						path="/notes/:id"
						element={
							<ProtectedRoute>
								<NoteView />
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
						path="/flashcards/study/:id"
						element={
							<ProtectedRoute>
								<StudyPage />
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
						path="/quiz/:quizId/take"
						element={
							<ProtectedRoute>
								<QuizTakePage />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/quiz/:quizId/results/:sessionId"
						element={
							<ProtectedRoute>
								<QuizResultsPage />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/quiz/:quizId/explanation/:sessionId"
						element={
							<ProtectedRoute>
								<QuizExplanationPage />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/quiz/:quizId/results"
						element={
							<ProtectedRoute>
								<QuizResultsListPage />
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
	);
}

function App() {
	return (
		<AuthProvider>
			<BrowserRouter>
				<AppContent />
			</BrowserRouter>
		</AuthProvider>
	);
}

export default App;
