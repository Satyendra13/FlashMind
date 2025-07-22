import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const AuthContext = createContext();

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

axios.defaults.baseURL = API_URL;
axios.defaults.withCredentials = true;

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [loading, setLoading] = useState(true);
	const [loginLoading, setLoginLoading] = useState(false);
	const [registerLoading, setRegisterLoading] = useState(false);
	const [forgotLoading, setForgotLoading] = useState(false);
	const [resetLoading, setResetLoading] = useState(false);
	const [profileLoading, setProfileLoading] = useState(false);
	const [changePasswordLoading, setChangePasswordLoading] = useState(false);

	useEffect(() => {
		checkAuthStatus();
	}, []);

	const checkAuthStatus = async () => {
		try {
			const token = localStorage.getItem("token");
			if (token) {
				axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
				const response = await axios.get("/auth/profile");
				setUser(response.data.user);
				setIsAuthenticated(true);
			}
		} catch (error) {
			localStorage.removeItem("token");
			delete axios.defaults.headers.common["Authorization"];
			setIsAuthenticated(false);
			setUser(null);
		} finally {
			setLoading(false);
		}
	};

	const login = async (email, password, rememberMe = false) => {
		setLoginLoading(true);
		try {
			const response = await axios.post("/auth/login", {
				email,
				password,
				rememberMe,
			});

			const { token, user } = response.data;

			localStorage.setItem("token", token);
			axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

			setUser(user);
			setIsAuthenticated(true);

			toast.success("Login successful!");
			return { success: true };
		} catch (error) {
			const message = error.response?.data?.message || "Login failed";
			toast.error(message);
			return { success: false, message };
		} finally {
			setLoginLoading(false);
		}
	};

	const register = async (userData) => {
		setRegisterLoading(true);
		try {
			const response = await axios.post("/auth/register", userData);
			toast.success(
				"Registration successful! Please check your email to verify your account."
			);
			return { success: true, message: response.data.message };
		} catch (error) {
			const message = error.response?.data?.message || "Registration failed";
			toast.error(message);
			return { success: false, message };
		} finally {
			setRegisterLoading(false);
		}
	};

	const logout = async () => {
		try {
			await axios.post("/auth/logout");
		} catch (error) {
		} finally {
			localStorage.removeItem("token");
			delete axios.defaults.headers.common["Authorization"];
			setUser(null);
			setIsAuthenticated(false);
			toast.success("Logged out successfully");
		}
	};

	const forgotPassword = async (email) => {
		setForgotLoading(true);
		try {
			await axios.post("/auth/forgot-password", { email });
			toast.success("Password reset link sent to your email");
			return { success: true };
		} catch (error) {
			const message =
				error.response?.data?.message || "Failed to send reset email";
			toast.error(message);
			return { success: false, message };
		} finally {
			setForgotLoading(false);
		}
	};

	const resetPassword = async (token, newPassword, confirmPassword) => {
		setResetLoading(true);
		try {
			await axios.post("/auth/reset-password", {
				token,
				newPassword,
				confirmPassword,
			});
			toast.success(
				"Password reset successful! Please log in with your new password."
			);
			return { success: true };
		} catch (error) {
			const message = error.response?.data?.message || "Password reset failed";
			toast.error(message);
			return { success: false, message };
		} finally {
			setResetLoading(false);
		}
	};

	const verifyEmail = async (token) => {
		try {
			await axios.get(`/auth/verify-email/${token}`);
			toast.success("Email verified successfully! You can now log in.");
			return { success: true };
		} catch (error) {
			const message =
				error.response?.data?.message || "Email verification failed";
			toast.error(message);
			return { success: false, message };
		}
	};

	const updateProfile = async (profileData) => {
		setProfileLoading(true);
		try {
			const response = await axios.put("/auth/profile", profileData);
			setUser(response.data.user);
			toast.success("Profile updated successfully");
			return { success: true };
		} catch (error) {
			const message = error.response?.data?.message || "Profile update failed";
			toast.error(message);
			return { success: false, message };
		} finally {
			setProfileLoading(false);
		}
	};

	const changePassword = async (
		currentPassword,
		newPassword,
		confirmPassword
	) => {
		setChangePasswordLoading(true);
		try {
			await axios.put("/auth/change-password", {
				currentPassword,
				newPassword,
				confirmPassword,
			});
			toast.success("Password changed successfully");
			return { success: true };
		} catch (error) {
			const message = error.response?.data?.message || "Password change failed";
			toast.error(message);
			return { success: false, message };
		} finally {
			setChangePasswordLoading(false);
		}
	};

	const value = {
		user,
		isAuthenticated,
		loading,
		login,
		register,
		logout,
		forgotPassword,
		resetPassword,
		verifyEmail,
		updateProfile,
		changePassword,
		loginLoading,
		registerLoading,
		forgotLoading,
		resetLoading,
		profileLoading,
		changePasswordLoading,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
