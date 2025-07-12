import React from "react";
import { Link } from "react-router-dom";
import {
	Brain,
	Lightbulb,
	TrendingUp,
	Users,
	Star,
	ArrowRight,
	Play,
	BookOpen,
	GraduationCap,
} from "lucide-react";

const Home = () => {
	return (
		<div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
			{/* Navigation */}
			<nav className="absolute top-0 left-0 right-0 z-50 p-6">
				<div className="max-w-7xl mx-auto flex justify-between items-center">
					<div className="flex items-center space-x-2">
						<div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
							<Brain className="text-white w-6 h-6" />
						</div>
						<span className="text-2xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
							FlashMind
						</span>
					</div>
					<div className="flex space-x-4">
						<Link
							to="/login"
							className="px-6 py-2 text-white hover:text-blue-200 transition-colors duration-300 font-medium"
						>
							Login
						</Link>
						<Link
							to="/register"
							className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full hover:from-blue-600 hover:to-purple-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
						>
							Get Started
						</Link>
					</div>
				</div>
			</nav>

			{/* Hero Section */}
			<section className="relative pt-32 pb-20 px-6 overflow-hidden">
				<div className="max-w-7xl mx-auto text-center">
					{/* Animated background elements */}
					<div className="absolute inset-0 overflow-hidden">
						<div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
						<div className="absolute top-40 right-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
						<div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
					</div>

					<div className="relative z-10">
						<h1 className="text-6xl md:text-8xl font-bold mb-8">
							<span className="bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent gradient-text-animate">
								Master Your
							</span>
							<br />
							<span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent gradient-text-animate">
								Knowledge
							</span>
						</h1>

						<p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
							Transform your learning experience with AI-powered flashcards,
							interactive quizzes, and intelligent study sessions. Remember
							more, learn faster.
						</p>

						<div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
							<Link
								to="/register"
								className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full text-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-2xl hover:shadow-blue-500/25 transform hover:scale-105 flex items-center space-x-3 pulse-glow ripple"
							>
								<span>Start Learning Free</span>
								<ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
							</Link>

							<button className="group px-8 py-4 border-2 border-white/30 text-white rounded-full text-lg font-semibold hover:bg-white/10 transition-all duration-300 flex items-center space-x-3 hover-lift">
								<Play className="w-4 h-4" />
								<span>Watch Demo</span>
							</button>
						</div>

						{/* Stats */}
						<div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
							<div className="text-center">
								<div className="text-4xl font-bold text-white mb-2">10K+</div>
								<div className="text-gray-300">Active Learners</div>
							</div>
							<div className="text-center">
								<div className="text-4xl font-bold text-white mb-2">1M+</div>
								<div className="text-gray-300">Cards Created</div>
							</div>
							<div className="text-center">
								<div className="text-4xl font-bold text-white mb-2">95%</div>
								<div className="text-gray-300">Success Rate</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section className="py-20 px-6 bg-black/20 backdrop-blur-sm">
				<div className="max-w-7xl mx-auto">
					<div className="text-center mb-16">
						<h2 className="text-5xl font-bold text-white mb-6">
							Why Choose{" "}
							<span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
								FlashMind
							</span>
							?
						</h2>
						<p className="text-xl text-gray-300 max-w-3xl mx-auto">
							Our AI-powered platform combines cutting-edge technology with
							proven learning methods to help you achieve your educational goals
							faster and more effectively.
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
						<div className="group p-8 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 hover:transform hover:scale-105 hover-lift float-animation">
							<div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
								<Brain className="text-white w-8 h-8" />
							</div>
							<h3 className="text-2xl font-bold text-white mb-4">
								AI-Powered Learning
							</h3>
							<p className="text-gray-300 leading-relaxed">
								Our advanced AI creates personalized study materials and adapts
								to your learning pace, ensuring optimal retention and
								understanding.
							</p>
						</div>

						<div className="group p-8 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 hover:transform hover:scale-105 hover-lift float-animation">
							<div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
								<Lightbulb className="text-white w-8 h-8" />
							</div>
							<h3 className="text-2xl font-bold text-white mb-4">
								Smart Flashcards
							</h3>
							<p className="text-gray-300 leading-relaxed">
								Create intelligent flashcards with AI assistance, track your
								progress, and review cards at the perfect intervals for maximum
								retention.
							</p>
						</div>

						<div className="group p-8 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 hover:transform hover:scale-105 hover-lift float-animation">
							<div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-red-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
								<TrendingUp className="text-white w-8 h-8" />
							</div>
							<h3 className="text-2xl font-bold text-white mb-4">
								Progress Tracking
							</h3>
							<p className="text-gray-300 leading-relaxed">
								Monitor your learning journey with detailed analytics,
								performance insights, and personalized recommendations to
								improve your study habits.
							</p>
						</div>

						<div className="group p-8 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 hover:transform hover:scale-105 hover-lift float-animation">
							<div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
								<BookOpen className="text-white w-8 h-8" />
							</div>
							<h3 className="text-2xl font-bold text-white mb-4">
								Interactive Quizzes
							</h3>
							<p className="text-gray-300 leading-relaxed">
								Test your knowledge with AI-generated quizzes, get instant
								feedback, and identify areas that need more attention.
							</p>
						</div>

						<div className="group p-8 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 hover:transform hover:scale-105 hover-lift float-animation">
							<div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
								<GraduationCap className="text-white w-8 h-8" />
							</div>
							<h3 className="text-2xl font-bold text-white mb-4">
								Study Sessions
							</h3>
							<p className="text-gray-300 leading-relaxed">
								Engage in focused study sessions with spaced repetition
								algorithms that help you remember information long-term.
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Testimonials Section */}
			<section className="py-20 px-6">
				<div className="max-w-7xl mx-auto">
					<div className="text-center mb-16">
						<h2 className="text-5xl font-bold text-white mb-6">
							What Our{" "}
							<span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
								Users Say
							</span>
						</h2>
						<p className="text-xl text-gray-300 max-w-3xl mx-auto">
							Join thousands of students who have transformed their learning
							experience with FlashMind.
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
						<div className="p-8 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl backdrop-blur-sm border border-white/10 hover-lift magnetic">
							<div className="flex items-center mb-4">
								{[...Array(5)].map((_, i) => (
									<Star
										key={i}
										className="text-yellow-400 w-5 h-5 fill-current"
									/>
								))}
							</div>
							<p className="text-gray-300 mb-6 leading-relaxed">
								"FlashMind has completely changed how I study. The AI-generated
								flashcards are incredibly accurate and the spaced repetition
								system works perfectly. I've improved my grades significantly!"
							</p>
							<div className="flex items-center">
								<div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
									S
								</div>
								<div>
									<div className="text-white font-semibold">Sarah Johnson</div>
									<div className="text-gray-400">Medical Student</div>
								</div>
							</div>
						</div>

						<div className="p-8 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl backdrop-blur-sm border border-white/10 hover-lift magnetic">
							<div className="flex items-center mb-4">
								{[...Array(5)].map((_, i) => (
									<Star
										key={i}
										className="text-yellow-400 w-5 h-5 fill-current"
									/>
								))}
							</div>
							<p className="text-gray-300 mb-6 leading-relaxed">
								"The quiz feature is amazing! It helps me identify exactly what
								I need to focus on. The interface is beautiful and the progress
								tracking keeps me motivated."
							</p>
							<div className="flex items-center">
								<div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
									M
								</div>
								<div>
									<div className="text-white font-semibold">Mike Chen</div>
									<div className="text-gray-400">Engineering Student</div>
								</div>
							</div>
						</div>

						<div className="p-8 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl backdrop-blur-sm border border-white/10 hover-lift magnetic">
							<div className="flex items-center mb-4">
								{[...Array(5)].map((_, i) => (
									<Star
										key={i}
										className="text-yellow-400 w-5 h-5 fill-current"
									/>
								))}
							</div>
							<p className="text-gray-300 mb-6 leading-relaxed">
								"I love how easy it is to create custom content. The AI
								suggestions are spot-on and the study sessions are perfectly
								timed. This is exactly what I needed for my language learning!"
							</p>
							<div className="flex items-center">
								<div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
									E
								</div>
								<div>
									<div className="text-white font-semibold">Emma Rodriguez</div>
									<div className="text-gray-400">Language Learner</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="py-20 px-6">
				<div className="max-w-4xl mx-auto text-center">
					<div className="p-12 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-3xl backdrop-blur-sm border border-white/10 hover-lift">
						<h2 className="text-5xl font-bold text-white mb-6 text-glow">
							Ready to Transform Your Learning?
						</h2>
						<p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
							Join thousands of students who are already mastering their
							subjects with FlashMind. Start your free journey today!
						</p>
						<div className="flex flex-col sm:flex-row gap-6 justify-center">
							<Link
								to="/register"
								className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full text-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-2xl hover:shadow-blue-500/25 transform hover:scale-105 flex items-center justify-center space-x-3 pulse-glow ripple"
							>
								<span>Start Learning Free</span>
								<ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
							</Link>
							<Link
								to="/login"
								className="px-8 py-4 border-2 border-white/30 text-white rounded-full text-lg font-semibold hover:bg-white/10 transition-all duration-300 hover-lift"
							>
								Sign In
							</Link>
						</div>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="py-12 px-6 border-t border-white/10">
				<div className="max-w-7xl mx-auto text-center">
					<div className="flex items-center justify-center space-x-2 mb-6">
						<div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
							<Brain className="text-white w-4 h-4" />
						</div>
						<span className="text-xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
							FlashMind
						</span>
					</div>
					<p className="text-gray-400 mb-6">
						© 2024 FlashMind. All rights reserved. Transform your learning
						experience with AI-powered education.
					</p>
					{/* <div className="flex justify-center space-x-6 text-gray-400">
						<a
							href="#"
							className="hover:text-white transition-colors duration-300"
						>
							Privacy Policy
						</a>
						<a
							href="#"
							className="hover:text-white transition-colors duration-300"
						>
							Terms of Service
						</a>
						<a
							href="#"
							className="hover:text-white transition-colors duration-300"
						>
							Contact Us
						</a>
					</div> */}
				</div>
			</footer>
		</div>
	);
};

export default Home;
