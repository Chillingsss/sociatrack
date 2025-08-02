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

		// Background with green tint
		ctx.fillStyle = "#f0f9ff";
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// Add noise lines with green colors
		for (let i = 0; i < 5; i++) {
			ctx.strokeStyle = `rgba(34, 197, 94, ${Math.random() * 0.3 + 0.1})`;
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
			ctx.font = `bold ${fontSize}px Arial`;
			// Green color variations
			const greenShade = Math.floor(Math.random() * 100) + 50;
			ctx.fillStyle = `rgb(${Math.floor(
				greenShade * 0.3
			)}, ${greenShade}, ${Math.floor(greenShade * 0.5)})`;
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			ctx.fillText(char, 0, 0);
			ctx.restore();
		}

		// Add noise dots with green tint
		for (let i = 0; i < 50; i++) {
			ctx.fillStyle = `rgba(34, 197, 94, ${Math.random() * 0.3 + 0.1})`;
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
		<div className="space-y-4">
			<Label className="text-sm font-semibold text-green-800">
				CAPTCHA Verification
			</Label>

			{/* CAPTCHA Display */}
			<div className="flex items-center space-x-4">
				<div className="relative">
					<canvas
						ref={canvasRef}
						width={200}
						height={70}
						className="bg-white rounded-xl border-2 border-green-200 shadow-sm"
					/>
				</div>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={handleRefresh}
					className="p-3 w-12 h-12 text-green-600 bg-green-50 rounded-xl border-2 border-green-200 transition-all duration-200 hover:bg-green-100 hover:text-green-700"
					title="Refresh CAPTCHA"
				>
					<RefreshCw className="w-5 h-5" />
				</Button>
			</div>

			{/* Input Field */}
			<div className="space-y-2">
				<Input
					type="text"
					value={userInput}
					onChange={handleInputChange}
					placeholder="Enter the characters shown above"
					className="px-6 py-4 w-full placeholder-green-400 text-green-900 rounded-2xl border-2 border-green-200 transition-all duration-200 bg-green-50/50 focus:outline-none focus:ring-4 focus:ring-green-300/30 focus:border-green-400 focus:bg-white hover:border-green-300"
					maxLength={6}
				/>
				{error && <p className="text-sm font-medium text-red-600">{error}</p>}
			</div>

			<p className="text-xs leading-relaxed text-green-600">
				Enter the characters shown in the image above (case sensitive)
			</p>
		</div>
	);
}
