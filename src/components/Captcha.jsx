import React, { useState, useEffect, useRef } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "@radix-ui/react-label";

export default function Captcha({ onVerify, error }) {
	const [captchaText, setCaptchaText] = useState("");
	const [userInput, setUserInput] = useState("");
	const canvasRef = useRef(null);

	// Generate random CAPTCHA text
	const generateCaptcha = () => {
		const chars =
			"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		let result = "";
		for (let i = 0; i < 6; i++) {
			result += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		setCaptchaText(result);
		setUserInput("");
		return result;
	};

	// Draw CAPTCHA on canvas
	const drawCaptcha = (text) => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");

		// Clear canvas
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Background
		ctx.fillStyle = "#f8f9fa";
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// Add noise lines
		for (let i = 0; i < 5; i++) {
			ctx.strokeStyle = `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(
				Math.random() * 255
			)}, ${Math.floor(Math.random() * 255)}, 0.3)`;
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
			ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
			ctx.stroke();
		}

		// Draw text with different styles for each character
		const charWidth = canvas.width / text.length;
		for (let i = 0; i < text.length; i++) {
			const char = text[i];
			const x = charWidth * i + charWidth / 2;
			const y = canvas.height / 2;

			// Random font size and rotation
			const fontSize = 20 + Math.random() * 10;
			const rotation = (Math.random() - 0.5) * 0.4;

			ctx.save();
			ctx.translate(x, y);
			ctx.rotate(rotation);
			ctx.font = `${fontSize}px Arial`;
			ctx.fillStyle = `rgb(${Math.floor(Math.random() * 100)}, ${Math.floor(
				Math.random() * 100
			)}, ${Math.floor(Math.random() * 100)})`;
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			ctx.fillText(char, 0, 0);
			ctx.restore();
		}

		// Add noise dots
		for (let i = 0; i < 50; i++) {
			ctx.fillStyle = `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(
				Math.random() * 255
			)}, ${Math.floor(Math.random() * 255)}, 0.3)`;
			ctx.beginPath();
			ctx.arc(
				Math.random() * canvas.width,
				Math.random() * canvas.height,
				1,
				0,
				2 * Math.PI
			);
			ctx.fill();
		}
	};

	// Initialize CAPTCHA on component mount
	useEffect(() => {
		const text = generateCaptcha();
		drawCaptcha(text);
	}, []);

	// Redraw when captcha text changes
	useEffect(() => {
		if (captchaText) {
			drawCaptcha(captchaText);
		}
	}, [captchaText]);

	const handleRefresh = () => {
		const newText = generateCaptcha();
		drawCaptcha(newText);
	};

	const handleInputChange = (e) => {
		const value = e.target.value;
		setUserInput(value);

		// Auto-verify when user has entered the correct length
		if (value.length === captchaText.length) {
			const isValid = value === captchaText; // Exact case-sensitive match
			onVerify(isValid, value);
		}
	};

	return (
		<div className="space-y-3">
			<Label className="text-sm font-medium text-gray-200">
				CAPTCHA Verification
			</Label>

			{/* CAPTCHA Display */}
			<div className="flex items-center space-x-3">
				<div className="relative">
					<canvas
						ref={canvasRef}
						width={180}
						height={60}
						className="bg-green-500 rounded border border-gray-300"
					/>
				</div>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={handleRefresh}
					className="p-2 w-10 h-10"
					title="Refresh CAPTCHA"
				>
					<RefreshCw className="w-4 h-4" />
				</Button>
			</div>

			{/* Input Field */}
			<div className="space-y-1">
				<Input
					type="text"
					value={userInput}
					onChange={handleInputChange}
					placeholder="Enter the characters shown above"
					className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-green-200 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all duration-200"
					maxLength={6}
				/>
				{error && <p className="text-sm text-red-600">{error}</p>}
			</div>

			<p className="text-xs text-gray-500">
				Enter the characters shown in the image above (case sensitive)
			</p>
		</div>
	);
}
