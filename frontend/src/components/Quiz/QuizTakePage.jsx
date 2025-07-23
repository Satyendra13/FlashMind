import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
	ProgressBar,
	Badge,
	Button,
	Modal,
	Spinner,
	Form,
} from "react-bootstrap";
import axios from "axios";
import toast from "react-hot-toast";
import { Clock, CheckCircle, ArrowLeft } from "lucide-react";
import QuizQuestion from "./QuizQuestion";
import { Modal as RBModal } from "react-bootstrap";

// Utility to detect touch device
const isTouchDevice =
	typeof window !== "undefined" &&
	("ontouchstart" in window || navigator.maxTouchPoints > 0);

const QuizTakePage = () => {
	const { quizId } = useParams();
	const location = useLocation();
	const navigate = useNavigate();
	const [quizSession, setQuizSession] = useState(null);
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [userAnswers, setUserAnswers] = useState([]);
	const [timeLeft, setTimeLeft] = useState(0);
	const [loading, setLoading] = useState(true);
	const [submitLoading, setSubmitLoading] = useState(false);
	const [questionTimes, setQuestionTimes] = useState([]); // [{start: timestamp, total: seconds}]
	const [quizStartTime, setQuizStartTime] = useState(null);
	const [totalTimeTaken, setTotalTimeTaken] = useState(0);
	const [showSubmittingModal, setShowSubmittingModal] = useState(false);
	const [language, setLanguage] = useState("en");
	const [markedForReview, setMarkedForReview] = useState([]);
	const [isDragging, setIsDragging] = useState(false);
	const [dragStartX, setDragStartX] = useState(0);
	const [scrollStartX, setScrollStartX] = useState(0);
	const navScrollRef = useRef(null);
	const [showLeaveDialog, setShowLeaveDialog] = useState(false);
	const [isSavingProgress, setIsSavingProgress] = useState(false);
	const [pendingNavigation, setPendingNavigation] = useState(null);
	const [isQuizCompleted, setIsQuizCompleted] = useState(false); // NEW: Track quiz completion
	const [swipeHandled, setSwipeHandled] = useState(false);
	const touchStartX = useRef(null);
	const touchEndX = useRef(null);
	// Animation state for swipe
	const [swipeDirection, setSwipeDirection] = useState(null); // 'left' or 'right' or null
	const [isAnimating, setIsAnimating] = useState(false);
	const [showAllNav, setShowAllNav] = useState(false); // New state for nav view

	// New useEffect to center the active question
	useEffect(() => {
		if (navScrollRef.current && !showAllNav) {
			const container = navScrollRef.current;
			// Find the button inside the container
			const activeButton = container.querySelector(
				`[data-question-index='${currentQuestionIndex}']`
			);

			if (activeButton) {
				const containerWidth = container.offsetWidth;
				const buttonLeft = activeButton.offsetLeft;
				const buttonWidth = activeButton.offsetWidth;
				const scrollTarget = buttonLeft + buttonWidth / 2 - containerWidth / 2;

				container.scrollTo({
					left: scrollTarget,
					behavior: "smooth",
				});
			}
		}
	}, [currentQuestionIndex, showAllNav]);

	// Scroll left/right by a fixed amount
	const scrollNav = (direction) => {
		const container = navScrollRef.current;
		if (!container) return;
		const scrollAmount = 120; // px
		container.scrollBy({ left: direction * scrollAmount, behavior: "smooth" });
	};

	// Drag/slide handlers
	const handleDragStart = (e) => {
		setIsDragging(true);
		setDragStartX(e.type === "touchstart" ? e.touches[0].clientX : e.clientX);
		setScrollStartX(navScrollRef.current.scrollLeft);
	};
	const handleDragMove = (e) => {
		if (!isDragging) return;
		const x = e.type === "touchmove" ? e.touches[0].clientX : e.clientX;
		const dx = dragStartX - x;
		navScrollRef.current.scrollLeft = scrollStartX + dx;
	};
	const handleDragEnd = () => {
		setIsDragging(false);
	};

	// Prevent click if dragging
	const handleNavButtonClick = (e, idx) => {
		if (isDragging) {
			e.preventDefault();
			e.stopPropagation();
			return;
		}
		handleJumpToQuestion(idx);
	};

	useEffect(() => {
		const startQuiz = async () => {
			try {
				let sessionId = location.state?.sessionId || null;
				let postData = sessionId ? { sessionId } : {};
				const response = await axios.post(
					`/content/quizzes/${quizId}/start`,
					postData,
					{
						headers: {
							Authorization: `Bearer ${localStorage.getItem("token")}`,
						},
					}
				);
				setQuizSession(response.data);
				// If resuming, restore answers and timer
				if (
					response.data.sessionId &&
					response.data.quiz.status === "inprogress" &&
					response.data.quiz.activeSessionId &&
					response?.data?.existingSession?.answers?.length > 0
				) {
					const session = response?.data?.existingSession;
					const restoredAnswers = (session.answers || []).map((ans) => ({
						en: "",
						hi: "",
						key: ans.userAnswerKey || "",
					}));
					setUserAnswers(
						restoredAnswers.length > 0
							? restoredAnswers
							: new Array(response.data.quiz.questions.length).fill({
									en: "",
									hi: "",
									key: "",
							  })
					);
					setMarkedForReview(
						new Array(response.data.quiz.questions.length).fill(false)
					);
					setTimeLeft(
						session.timeTaken
							? Math.max(
									response.data.quiz.timeLimit * 60 -
										parseInt(session.timeTaken),
									1
							  )
							: response.data.quiz.timeLimit * 60
					);
					setQuizStartTime(Date.now());
					setQuestionTimes(
						(session.answers || []).map((a) => ({
							start: null,
							total: a.timeSpent || 0,
						}))
					);
				} else {
					setUserAnswers(
						new Array(response.data.quiz.questions.length).fill({
							en: "",
							hi: "",
							key: "",
						})
					);
					setMarkedForReview(
						new Array(response.data.quiz.questions.length).fill(false)
					);
					setTimeLeft(response.data.quiz.timeLimit * 60);
					setQuizStartTime(Date.now());
					setQuestionTimes(
						new Array(response.data.quiz.questions.length)
							.fill(null)
							.map(() => ({ start: null, total: 0 }))
					);
				}
			} catch (error) {
				toast.error("Failed to start quiz");
				navigate("/quiz");
			} finally {
				setLoading(false);
			}
		};
		startQuiz();
		// eslint-disable-next-line
	}, [quizId]);

	// Start timing when question is shown
	useEffect(() => {
		if (!quizSession) return;
		setQuestionTimes((prev) => {
			const arr = [...prev];
			if (
				arr[currentQuestionIndex] &&
				arr[currentQuestionIndex].start == null
			) {
				arr[currentQuestionIndex] = {
					...arr[currentQuestionIndex],
					start: Date.now(),
				};
			}
			return arr;
		});
		// eslint-disable-next-line
	}, [currentQuestionIndex, quizSession]);

	// Timer for quiz
	useEffect(() => {
		let timer;
		if (timeLeft > 0 && quizSession && !submitLoading) {
			timer = setInterval(() => {
				setTimeLeft((prev) => {
					if (prev <= 1) {
						handleSubmitQuiz();
						return 0;
					}
					return prev - 1;
				});
			}, 1000);
		}
		return () => clearInterval(timer);
		// eslint-disable-next-line
	}, [timeLeft, quizSession, submitLoading]);

	const handleAnswerSelect = (optionKey) => {
		const newAnswers = [...userAnswers];
		newAnswers[currentQuestionIndex] = {
			...newAnswers[currentQuestionIndex],
			[language]: optionKey,
			key: optionKey,
		};
		setUserAnswers(newAnswers);
	};

	const handleClearSelection = () => {
		const newAnswers = [...userAnswers];
		newAnswers[currentQuestionIndex] = { en: "", hi: "", key: "" };
		setUserAnswers(newAnswers);
	};
	const handleMarkForReview = () => {
		const newMarked = [...markedForReview];
		newMarked[currentQuestionIndex] = !newMarked[currentQuestionIndex];
		setMarkedForReview(newMarked);
	};
	const handleJumpToQuestion = (idx) => {
		goToQuestion(idx);
	};

	const goToQuestion = (newIndex) => {
		setQuestionTimes((prev) => {
			const arr = [...prev];
			// Stop timing current question
			if (
				arr[currentQuestionIndex] &&
				arr[currentQuestionIndex].start != null
			) {
				arr[currentQuestionIndex].total += Math.floor(
					(Date.now() - arr[currentQuestionIndex].start) / 1000
				);
				arr[currentQuestionIndex].start = null;
			}
			// Start timing new question
			if (arr[newIndex] && arr[newIndex].start == null) {
				arr[newIndex].start = Date.now();
			}
			return arr;
		});
		setCurrentQuestionIndex(newIndex);
	};

	const handleNextQuestion = () => {
		if (
			currentQuestionIndex <
			(quizSession?.quiz?.questions?.length || 0) - 1
		) {
			goToQuestion(currentQuestionIndex + 1);
		} else {
			handleSubmitQuiz();
		}
	};

	const handlePreviousQuestion = () => {
		if (currentQuestionIndex > 0) {
			goToQuestion(currentQuestionIndex - 1);
		}
	};

	const handleSubmitQuiz = async () => {
		setSubmitLoading(true);
		setShowSubmittingModal(true);
		setIsQuizCompleted(true); // FIXED: Mark quiz as completed to prevent blocking

		// Stop timing current question
		setQuestionTimes((prev) => {
			const arr = [...prev];
			if (
				arr[currentQuestionIndex] &&
				arr[currentQuestionIndex].start != null
			) {
				arr[currentQuestionIndex].total += Math.floor(
					(Date.now() - arr[currentQuestionIndex].start) / 1000
				);
				arr[currentQuestionIndex].start = null;
			}
			return arr;
		});
		// Wait for state update
		setTimeout(async () => {
			try {
				// Calculate timeSpent for each question
				const answersWithTime = userAnswers.map((ans, idx) => ({
					questionIndex: idx,
					userAnswerKey: ans.key,
					timeSpent: questionTimes[idx]?.total || 0,
				}));
				// Calculate total time taken

				setTotalTimeTaken(quizSession?.quiz?.timeLimit - timeLeft);
				const response = await axios.post(
					`/content/quizzes/${quizSession?.quiz?._id}/complete`,
					{
						sessionId: quizSession.sessionId,
						answers: answersWithTime,
						timeTaken: quizSession?.quiz?.timeLimit - timeLeft,
					},
					{
						headers: {
							Authorization: `Bearer ${localStorage.getItem("token")}`,
						},
					}
				);
				// Use regular navigate after quiz completion
				navigate(
					`/quiz/${quizSession.quiz._id}/results/${quizSession.sessionId}`,
					{
						state: { sessionId: quizSession.sessionId },
						replace: true, // Use replace to avoid navigation blocking
					}
				);
			} catch (error) {
				toast.error("Failed to submit quiz");
				setIsQuizCompleted(false); // Reset if submission fails
			} finally {
				setSubmitLoading(false);
				setShowSubmittingModal(false);
			}
		}, 100);
	};

	const formatTime = (seconds) => {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
	};

	// Save progress API call - improved with proper error handling
	const saveProgress = async () => {
		if (!quizSession?.sessionId || isSavingProgress) return;

		setIsSavingProgress(true);
		try {
			const currentTimes = [...questionTimes];
			if (
				currentTimes[currentQuestionIndex] &&
				currentTimes[currentQuestionIndex].start != null
			) {
				currentTimes[currentQuestionIndex].total += Math.floor(
					(Date.now() - currentTimes[currentQuestionIndex].start) / 1000
				);
			}

			const answersWithTime = userAnswers.map((ans, idx) => ({
				questionIndex: idx,
				userAnswerKey: ans.key,
				timeSpent: currentTimes[idx]?.total || 0,
			}));

			await axios.post(
				`/content/quizzes/${quizSession.quiz._id}/session/${quizSession.sessionId}/save-progress`,
				{
					answers: answersWithTime,
					timeTaken: quizSession?.quiz?.timeLimit - timeLeft,
				},
				{
					headers: {
						Authorization: `Bearer ${localStorage.getItem("token")}`,
					},
				}
			);
			return true;
		} catch (error) {
			return false;
		} finally {
			setIsSavingProgress(false);
		}
	};

	// Save progress using navigator.sendBeacon for unload
	const saveProgressBeacon = () => {
		if (!quizSession?.sessionId) return;

		const currentTimes = [...questionTimes];
		if (
			currentTimes[currentQuestionIndex] &&
			currentTimes[currentQuestionIndex].start != null
		) {
			currentTimes[currentQuestionIndex].total += Math.floor(
				(Date.now() - currentTimes[currentQuestionIndex].start) / 1000
			);
		}

		const answersWithTime = userAnswers.map((ans, idx) => ({
			questionIndex: idx,
			userAnswerKey: ans.key,
			timeSpent: currentTimes[idx]?.total || 0,
		}));

		const payload = {
			answers: answersWithTime,
			timeTaken: quizSession?.quiz?.timeLimit - timeLeft,
		};

		const url = `/content/quizzes/${quizSession.quiz._id}/session/${quizSession.sessionId}/save-progress`;

		try {
			const blob = new Blob([JSON.stringify(payload)], {
				type: "application/json",
			});
			navigator.sendBeacon(url, blob);
		} catch (err) {}
	};

	// Block navigation when quiz is incomplete
	const shouldBlock =
		!submitLoading && !isQuizCompleted && quizSession && quizSession.sessionId;

	// Block browser navigation and handle back button
	useEffect(() => {
		if (!shouldBlock) return;

		const handlePopState = (event) => {
			event.preventDefault();
			window.history.pushState(null, null, window.location.pathname);
			setShowLeaveDialog(true);
			setPendingNavigation("back");
		};

		window.history.pushState(null, null, window.location.pathname);
		window.addEventListener("popstate", handlePopState);

		const handleLinkClick = (event) => {
			const target = event.target.closest(
				'a, button[onclick], [role="button"]'
			);
			if (target && !target.closest(".quiz-take-page")) {
				const href = target.getAttribute("href");
				const onClick = target.getAttribute("onclick");

				if (href || onClick || target.classList.contains("nav-link")) {
					event.preventDefault();
					event.stopPropagation();
					setShowLeaveDialog(true);

					if (href) {
						setPendingNavigation(() => () => navigate(href));
					} else {
						setPendingNavigation(() => () => target.click());
					}
				}
			}
		};

		document.addEventListener("click", handleLinkClick, true);

		return () => {
			window.removeEventListener("popstate", handlePopState);
			document.removeEventListener("click", handleLinkClick, true);
		};
	}, [shouldBlock, navigate]);

	const confirmLeave = async () => {
		setShowLeaveDialog(false);
		setIsQuizCompleted(true);

		try {
			await saveProgress();
			setTimeout(() => {
				if (pendingNavigation === "back") {
					navigate("/quiz");
				} else if (typeof pendingNavigation === "function") {
					pendingNavigation();
				}
				setPendingNavigation(null);
			}, 100);
		} catch (error) {
			setTimeout(() => {
				if (pendingNavigation === "back") {
					navigate("/quiz");
				} else if (typeof pendingNavigation === "function") {
					pendingNavigation();
				}
				setPendingNavigation(null);
			}, 100);
		}
	};

	const cancelLeave = () => {
		setShowLeaveDialog(false);
		setPendingNavigation(null);
		if (isQuizCompleted && quizSession && quizSession.sessionId) {
			setIsQuizCompleted(false);
		}
	};

	const navigateWithConfirmation = (path) => {
		if (shouldBlock) {
			setShowLeaveDialog(true);
			setPendingNavigation(() => () => navigate(path));
		} else {
			navigate(path);
		}
	};

	// beforeunload handler using beacon
	useEffect(() => {
		const handleBeforeUnload = (e) => {
			if (shouldBlock && !isSavingProgress) {
				saveProgressBeacon();

				e.preventDefault();
				e.returnValue =
					"Are you sure you want to leave? Your quiz progress will be saved.";
				return e.returnValue;
			}
		};

		const handleKeyDown = (e) => {
			if (shouldBlock) {
				if ((e.ctrlKey || e.metaKey) && e.key === "r") {
					e.preventDefault();
					setShowLeaveDialog(true);
					setPendingNavigation(() => () => window.location.reload());
				}
				if (e.key === "F5") {
					e.preventDefault();
					setShowLeaveDialog(true);
					setPendingNavigation(() => () => window.location.reload());
				}
			}
		};

		window.addEventListener("beforeunload", handleBeforeUnload);
		window.addEventListener("keydown", handleKeyDown);

		return () => {
			window.removeEventListener("beforeunload", handleBeforeUnload);
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [shouldBlock, isSavingProgress, questionTimes, userAnswers]);

	// Save progress when tab is hidden (e.g. tab switch)
	useEffect(() => {
		const handleVisibilityChange = () => {
			if (document.visibilityState === "hidden" && shouldBlock) {
				saveProgress().catch(console.error);
			}
		};

		document.addEventListener("visibilitychange", handleVisibilityChange);
		return () => {
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
	}, [shouldBlock]);

	// Auto-save every 30 seconds
	useEffect(() => {
		if (!shouldBlock) return;

		const interval = setInterval(() => {
			saveProgress().catch(console.error);
		}, 30000);

		return () => clearInterval(interval);
	}, [shouldBlock, userAnswers, questionTimes]);

	// Swipe handlers for Question Card
	const handleTouchStart = (e) => {
		if (!isTouchDevice || swipeHandled || isAnimating) return;
		touchStartX.current = e.touches[0].clientX;
	};
	const handleTouchMove = (e) => {
		if (!isTouchDevice || swipeHandled || isAnimating) return;
		touchEndX.current = e.touches[0].clientX;
	};
	const handleTouchEnd = () => {
		if (
			!isTouchDevice ||
			swipeHandled ||
			isAnimating ||
			touchStartX.current === null ||
			touchEndX.current === null
		)
			return;
		const dx = touchEndX.current - touchStartX.current;
		const threshold = 50; // px
		if (Math.abs(dx) > threshold) {
			if (dx > 0 && currentQuestionIndex > 0) {
				setSwipeDirection("right");
				setIsAnimating(true);
			} else if (
				dx < 0 &&
				currentQuestionIndex < (quizSession?.quiz?.questions?.length || 0) - 1
			) {
				setSwipeDirection("left");
				setIsAnimating(true);
			}
			setSwipeHandled(true);
		}
		touchStartX.current = null;
		touchEndX.current = null;
	};

	// Handle animation end to change question after swipe
	const handleAnimationEnd = () => {
		if (swipeDirection === "left") {
			handleNextQuestion();
		} else if (swipeDirection === "right") {
			handlePreviousQuestion();
		}
		setIsAnimating(false);
		setSwipeDirection(null);
	};
	// Reset swipeHandled when question changes
	useEffect(() => {
		setSwipeHandled(false);
	}, [currentQuestionIndex]);

	if (loading) {
		return (
			<div className="d-flex justify-content-center align-items-center min-vh-100">
				<div className="spinner-border text-primary" role="status">
					<span className="visually-hidden">Loading...</span>
				</div>
			</div>
		);
	}

	const currentQuestion = quizSession?.quiz?.questions?.[currentQuestionIndex];

	return (
		<div className="container py-4 quiz-take-page">
			<div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
				<div className="d-flex align-items-center me-3 mb-2 mb-md-0">
					<Button
						variant="secondary"
						className="me-3"
						onClick={() => navigateWithConfirmation("/quiz")}
						aria-label="Back to quizzes"
					>
						<ArrowLeft size={20} />
					</Button>
					<h2 className="h5 mb-0 text-truncate">{quizSession?.quiz?.title}</h2>
				</div>

				<div className="d-flex align-items-center">
					<Badge bg={timeLeft < 60 ? "danger" : "primary"} className="me-3">
						<div className="d-flex align-items-center px-1 py-1">
							<Clock size={14} className="me-1" />
							<span>{formatTime(timeLeft)}</span>
						</div>
					</Badge>
					<div className="d-flex align-items-center">
						<Button
							variant={language === "en" ? "primary" : "outline-primary"}
							size="sm"
							onClick={() => setLanguage("en")}
							className="me-2"
						>
							EN
						</Button>
						<Button
							variant={language === "hi" ? "primary" : "outline-primary"}
							size="sm"
							onClick={() => setLanguage("hi")}
						>
							HI
						</Button>
					</div>
				</div>
			</div>
			{/* Question Navigation Panel */}
			<div className="mb-4 text-center">
				<div className="d-flex justify-content-end align-items-center mb-2">
					<Form.Check
						type="switch"
						id="toggle-question-nav"
						label="Show All Questions"
						checked={showAllNav}
						onChange={() => setShowAllNav(!showAllNav)}
					/>
				</div>
				<div
					className={`d-flex align-items-center position-relative ${
						showAllNav ? "border rounded p-3 justify-content-center" : ""
					}`}
					style={{ minHeight: 56 }}
				>
					{/* Left Scroll Button - shown only when NOT in showAll mode */}
					{!showAllNav && (quizSession?.quiz?.questions?.length || 0) > 8 && (
						<Button
							variant="light"
							size="sm"
							className="me-2 px-2 border"
							style={{
								zIndex: 2,
								boxShadow: "0 0 6px rgba(0,0,0,0.04)",
							}}
							onClick={() => scrollNav(-1)}
							aria-label="Scroll left"
						>
							&lt;
						</Button>
					)}

					{/* Scrollable Nav / Grid Nav */}
					<div
						ref={navScrollRef}
						className={`gap-2 align-items-center ${
							showAllNav
								? "d-flex flex-wrap justify-content-center"
								: "flex-nowrap d-flex"
						}`}
						style={{
							overflowX: showAllNav ? "hidden" : "auto",
							WebkitOverflowScrolling: "touch",
							scrollbarWidth: "none",
							msOverflowStyle: "none",
							paddingBlock: "4px",
							...(!showAllNav && {
								flex: "1 1 0",
								minWidth: 0,
							}),
						}}
						{...(!showAllNav && {
							onMouseDown: handleDragStart,
							onMouseMove: handleDragMove,
							onMouseUp: handleDragEnd,
							onMouseLeave: handleDragEnd,
							onTouchStart: handleDragStart,
							onTouchMove: handleDragMove,
							onTouchEnd: handleDragEnd,
						})}
					>
						{quizSession?.quiz?.questions?.map((q, idx) => {
							const answered = userAnswers[idx]?.key;
							const isCurrent = idx === currentQuestionIndex;
							const isMarked = markedForReview[idx];
							return (
								<Button
									key={idx}
									variant={
										isCurrent
											? "primary"
											: isMarked
											? "warning"
											: answered
											? "success"
											: "outline-secondary"
									}
									size="sm"
									className={`rounded-circle fw-bold border-2 ${
										isCurrent ? "shadow" : ""
									}`}
									style={{
										width: 40,
										height: 40,
										minWidth: 40,
										minHeight: 40,
										borderRadius: "50%",
										padding: 0,
										position: "relative",
										userSelect: "none",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
									}}
									onClick={(e) => handleNavButtonClick(e, idx)}
									title={
										isMarked
											? "Marked for review"
											: answered
											? "Answered"
											: "Unanswered"
									}
									draggable={false}
									data-question-index={idx} // Add data attribute
								>
									{idx + 1}
									{isMarked && (
										<span
											style={{
												position: "absolute",
												top: -2,
												right: -2,
												lineHeight: 1,
											}}
										>
											<CheckCircle
												size={14}
												className="bg-white rounded-circle text-warning"
											/>
										</span>
									)}
								</Button>
							);
						})}
					</div>

					{/* Right Scroll Button - shown only when NOT in showAll mode */}
					{!showAllNav && (quizSession?.quiz?.questions?.length || 0) > 8 && (
						<Button
							variant="light"
							size="sm"
							className="ms-2 px-2 border"
							style={{
								zIndex: 2,
								boxShadow: "0 0 6px rgba(0,0,0,0.04)",
							}}
							onClick={() => scrollNav(1)}
							aria-label="Scroll right"
						>
							&gt;
						</Button>
					)}
				</div>
			</div>
			{/* Question Card */}
			{currentQuestion && (
				// Attach touch handlers and animation classes only if touch device
				<div
					className={`mb-3 ${
						isAnimating && swipeDirection
							? `swipe-animate swipe-${swipeDirection}`
							: ""
					}`}
					{...(isTouchDevice
						? {
								onTouchStart: handleTouchStart,
								onTouchMove: handleTouchMove,
								onTouchEnd: handleTouchEnd,
						  }
						: {})}
					onAnimationEnd={isAnimating ? handleAnimationEnd : undefined}
				>
					<QuizQuestion
						question={currentQuestion}
						questionIndex={currentQuestionIndex}
						selectedAnswer={userAnswers[currentQuestionIndex]?.key || ""}
						quizType={quizSession.quiz.quizType}
						onAnswerSelect={handleAnswerSelect}
						language={language}
					/>
					<div className="d-flex flex-wrap gap-2 mt-3">
						<Button
							variant={
								markedForReview[currentQuestionIndex]
									? "warning"
									: "outline-warning"
							}
							size="sm"
							onClick={handleMarkForReview}
							disabled={!userAnswers[currentQuestionIndex]?.key}
						>
							{markedForReview[currentQuestionIndex]
								? "Unmark Review"
								: "Mark for Review"}
						</Button>
						<Button
							variant="outline-secondary"
							size="sm"
							onClick={handleClearSelection}
							className="ms-2"
							disabled={!userAnswers[currentQuestionIndex]?.key}
						>
							Clear Selection
						</Button>
					</div>
				</div>
			)}
			<div className="d-flex align-items-center mt-4">
				<Button
					variant="outline-secondary"
					onClick={handlePreviousQuestion}
					disabled={currentQuestionIndex === 0 || submitLoading}
				>
					Previous
				</Button>
				<div className="flex-grow-1 text-center">
					<small className="text-muted">
						{userAnswers[currentQuestionIndex]?.key
							? "Answer selected"
							: "Select an answer"}
					</small>
				</div>
				<Button
					variant="primary"
					onClick={handleNextQuestion}
					disabled={submitLoading}
				>
					{submitLoading &&
					currentQuestionIndex ===
						(quizSession?.quiz?.questions?.length || 1) - 1 ? (
						<Spinner size="sm" animation="border" className="me-2" />
					) : null}
					{currentQuestionIndex ===
					(quizSession?.quiz?.questions?.length || 1) - 1
						? "Submit Quiz"
						: "Next"}
				</Button>
			</div>
			{/* Submitting Modal */}
			<RBModal
				show={showSubmittingModal}
				centered
				backdrop="static"
				keyboard={false}
			>
				<RBModal.Body className="text-center py-5">
					<Spinner animation="border" variant="primary" className="mb-3" />
					<h5>Submitting your responses...</h5>
					<div className="text-muted mt-2">
						Please wait while we save your quiz results.
					</div>
				</RBModal.Body>
			</RBModal>
			{/* Leave confirmation modal */}
			<RBModal
				show={showLeaveDialog}
				centered
				backdrop="static"
				keyboard={false}
			>
				<RBModal.Body className="text-center py-5">
					<h5>Are you sure you want to leave?</h5>
					<div className="text-muted mt-2 mb-4">
						Your quiz progress will be saved and you can resume later.
					</div>
					{isSavingProgress && (
						<div className="mb-3">
							<Spinner animation="border" size="sm" className="me-2" />
							<span>Saving progress...</span>
						</div>
					)}
					<div className="d-flex justify-content-center gap-3">
						<Button
							variant="danger"
							onClick={confirmLeave}
							disabled={isSavingProgress}
						>
							{isSavingProgress ? "Saving..." : "Leave & Save Progress"}
						</Button>
						<Button
							variant="secondary"
							onClick={cancelLeave}
							disabled={isSavingProgress}
						>
							Stay on Page
						</Button>
					</div>
				</RBModal.Body>
			</RBModal>
		</div>
	);
};

export default QuizTakePage;
