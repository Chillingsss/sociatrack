"use client";

import React, { useState, useEffect } from "react";
import {
	LockKeyhole,
	Mail,
	ArrowRight,
	AlertCircle,
	Eye,
	EyeOff,
	Shield,
	Users,
} from "lucide-react";
import { Label } from "@radix-ui/react-label";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useNavigate } from "react-router-dom";
import CryptoJS from "crypto-js";
import Cookies from "js-cookie";
import Captcha from "../components/Captcha";
import { loginUser } from "../utils/security";
import toast from "react-hot-toast";
import { Toaster } from "react-hot-toast";

const COOKIE_KEY = "cite_user";
const SECRET_KEY = "cite_secret_key"; // You can use a more secure key in production

export default function LoginPage() {
	const [isLoading, setIsLoading] = useState(false);
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [showCaptcha, setShowCaptcha] = useState(false);
	const [captchaVerified, setCaptchaVerified] = useState(false);
	const [captchaError, setCaptchaError] = useState("");
	const [showPassword, setShowPassword] = useState(false);

	const navigate = useNavigate();

	useEffect(() => {
		const encrypted = Cookies.get(COOKIE_KEY);
		if (encrypted) {
			try {
				const bytes = CryptoJS.AES.decrypt(encrypted, SECRET_KEY);
				const decrypted = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
				if (decrypted && decrypted.userLevel === "Admin") {
					navigate("/AdminDashboard");
				} else if (decrypted && decrypted.userLevel === "Student") {
					navigate("/StudentDashboard");
				} else if (decrypted && decrypted.userLevel === "Faculty") {
					navigate("/FacultyDashboard");
				}
			} catch (e) {
				// Invalid cookie, ignore
			}
		}
	}, [navigate]);

	const handleCaptchaVerify = (isValid, userInput) => {
		if (isValid) {
			setCaptchaVerified(true);
			setCaptchaError("");
			toast.success("CAPTCHA verified successfully!");
		} else {
			setCaptchaVerified(false);
			setCaptchaError("Incorrect CAPTCHA. Please try again.");
			toast.error("Incorrect CAPTCHA. Please try again.");
		}
	};

	const handleSubmit = async (event) => {
		event.preventDefault();

		// Validate username and password first
		if (!username.trim() || !password.trim()) {
			setError("Please enter both username and password.");
			toast.error("Please enter both username and password.");
			return;
		}

		// First click: Show CAPTCHA
		if (!showCaptcha) {
			setShowCaptcha(true);
			setError(""); // Clear any previous errors
			toast("Please complete the CAPTCHA verification to continue.");
			return;
		}

		// Second click: Check CAPTCHA and proceed with login
		if (!captchaVerified) {
			setCaptchaError("Please complete the CAPTCHA verification first.");
			toast.error("Please complete the CAPTCHA verification first.");
			return;
		}

		setIsLoading(true);
		setError(""); // Clear any previous errors
		console.log("user");

		try {
			const user = await loginUser(username, password);
			console.log("user", user);

			if (user) {
				// Store user data in cookie after successful login
				const encrypted = CryptoJS.AES.encrypt(
					JSON.stringify(user),
					SECRET_KEY
				).toString();
				Cookies.set(COOKIE_KEY, encrypted, { expires: 1 }); // 1 day expiry

				// Navigate to appropriate dashboard
				if (user.userLevel === "Admin") {
					toast.success("Welcome to Admin Dashboard!");
					navigate("/AdminDashboard");
				} else if (user.userLevel === "Student") {
					toast.success("Welcome to Student Dashboard!");
					navigate("/StudentDashboard");
				} else if (user.userLevel === "Faculty") {
					toast.success("Welcome to Faculty Dashboard!");
					navigate("/FacultyDashboard");
				}
			} else {
				// Invalid credentials - reset everything
				setError(
					"Invalid credentials or unauthorized access. Please check your username and password."
				);
				toast.error("Login failed");
				setShowCaptcha(false);
				setCaptchaVerified(false);
				setCaptchaError("");
				setIsLoading(false);
			}
		} catch (err) {
			console.error("Login error:", err);
			setError("Login failed. Please try again.");
			toast.error("Login failed. Please try again.");
			// Reset everything on error
			setShowCaptcha(false);
			setCaptchaVerified(false);
			setCaptchaError("");
			setIsLoading(false);
		}
	};

	return (
		<>
			<Toaster position="top-right" />
			<div className="min-h-screen bg-gradient-to-br from-green-950 via-green-900 to-green-800 flex">
				{/* Left Panel - Branding */}
				<div className="hidden lg:flex lg:w-1/2 relative items-center justify-center">
					<div className="text-center text-white z-10">
						<div className="mb-8">
							<div className="inline-flex items-center justify-center w-24 h-24 mb-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
								<Shield className="w-12 h-12 text-green-400" />
							</div>
							<h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-green-400 to-lime-400 bg-clip-text text-transparent">
								PHINMA
							</h1>
							<h2 className="text-2xl font-semibold mb-1 text-white">
								Cagayan de Oro College
							</h2>
							<p className="text-green-200 text-lg">Social Media System</p>
						</div>

						<div className="space-y-4 max-w-md">
							<div className="flex items-center space-x-3 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
								<Shield className="w-6 h-6 text-lime-400" />
								<div className="text-left">
									<h3 className="font-semibold text-white">
										College of Information Technology Education
									</h3>
									<p className="text-sm text-green-200">Department</p>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Right Panel - Login Form */}
				<div className="flex-1 flex items-center justify-center p-8">
					<div className="w-full max-w-md">
						{/* Mobile Header */}
						<div className="text-center mb-8 lg:hidden">
							<div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
								<Shield className="w-8 h-8 text-green-400" />
							</div>
							<h1 className="text-2xl font-bold mb-1 bg-gradient-to-r from-green-400 to-lime-400 bg-clip-text text-transparent">
								PHINMA
							</h1>
							<p className="text-white text-sm">Cagayan de Oro College</p>
						</div>

						{/* Login Card */}
						<div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 shadow-2xl">
							<div className="text-center mb-8">
								<h2 className="text-2xl font-bold text-white mb-2">
									Welcome Back
								</h2>
								<p className="text-green-200">Sign in to your account</p>
							</div>

							{/* Error Message */}
							{error && (
								<div className="flex items-start p-4 mb-6 space-x-3 bg-green-900/30 backdrop-blur-sm rounded-xl border border-green-500/20">
									<AlertCircle className="w-5 h-5 text-lime-400 mt-0.5 flex-shrink-0" />
									<div>
										<p className="text-sm font-medium text-green-300">
											Login Failed
										</p>
										<p className="text-sm text-green-200">{error}</p>
									</div>
								</div>
							)}

							<form onSubmit={handleSubmit} className="space-y-6">
								<div className="space-y-2">
									<Label
										htmlFor="username"
										className="text-sm font-medium text-green-200"
									>
										Username
									</Label>
									<div className="relative">
										<Input
											id="username"
											type="text"
											value={username}
											onChange={(e) => {
												setUsername(e.target.value);
												setError("");
											}}
											placeholder="Enter your Student ID or Employee ID"
											className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all duration-200"
											required
										/>
										<Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-300" />
									</div>
								</div>

								<div className="space-y-2">
									<Label
										htmlFor="password"
										className="text-sm font-medium text-green-200"
									>
										Password
									</Label>
									<div className="relative">
										<Input
											id="password"
											type={showPassword ? "text" : "password"}
											value={password}
											onChange={(e) => {
												setPassword(e.target.value);
												setError("");
											}}
											placeholder="Enter your password"
											className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all duration-200"
											required
										/>
										<button
											type="button"
											onClick={() => setShowPassword(!showPassword)}
											className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-300 hover:text-green-200 transition-colors"
										>
											{showPassword ? (
												<EyeOff className="w-5 h-5" />
											) : (
												<Eye className="w-5 h-5" />
											)}
										</button>
									</div>
								</div>

								{/* CAPTCHA Component */}
								{showCaptcha && (
									<div className="p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
										<Captcha
											onVerify={handleCaptchaVerify}
											error={captchaError}
										/>
									</div>
								)}

								<Button
									type="submit"
									className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-400 ${
										showCaptcha && !captchaVerified
											? "bg-gray-600 text-gray-300 cursor-not-allowed"
											: "bg-gradient-to-r from-green-700 to-lime-700 text-white hover:from-green-800 hover:to-lime-800 shadow-lg hover:shadow-xl"
									}`}
									disabled={isLoading || (showCaptcha && !captchaVerified)}
								>
									{isLoading ? (
										<div className="flex items-center justify-center space-x-2">
											<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
											<span>Signing in...</span>
										</div>
									) : showCaptcha && !captchaVerified ? (
										"Complete CAPTCHA to Continue"
									) : showCaptcha && captchaVerified ? (
										<div className="flex items-center justify-center space-x-2">
											<span>Sign In</span>
											<ArrowRight className="w-4 h-4" />
										</div>
									) : (
										<div className="flex items-center justify-center space-x-2">
											<span>Sign In</span>
											<ArrowRight className="w-4 h-4" />
										</div>
									)}
								</Button>
							</form>

							<div className="mt-6 text-center">
								<a
									href="#"
									className="text-sm text-green-300 hover:text-green-200 transition-colors"
								>
									Forgot your password?
								</a>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
