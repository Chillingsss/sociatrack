import React, { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

const QRCodeModal = ({ isOpen, onClose, userId, userProfile }) => {
	const canvasRef = useRef(null);
	const [qrDataUrl, setQrDataUrl] = useState("");

	useEffect(() => {
		if (isOpen && userId && canvasRef.current) {
			generateQRCode();
		}
	}, [isOpen, userId]);

	const generateQRCode = async () => {
		try {
			const canvas = canvasRef.current;
			const qrText = `student_id: ${userId}`;

			// Generate QR code on canvas
			await QRCode.toCanvas(canvas, qrText, {
				width: 300,
				margin: 2,
				color: {
					dark: "#000000",
					light: "#FFFFFF",
				},
			});

			// Convert canvas to data URL for download
			const dataUrl = canvas.toDataURL("image/png");
			setQrDataUrl(dataUrl);
		} catch (error) {
			console.error("Error generating QR code:", error);
		}
	};

	const downloadQRCode = () => {
		if (qrDataUrl) {
			const link = document.createElement("a");
			const studentName = userProfile
				? `${userProfile.user_firstname}_${userProfile.user_lastname}`
				: `Student_${userId}`;
			link.download = `${studentName}_Attendance_QR.png`;
			link.href = qrDataUrl;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		}
	};

	if (!isOpen) return null;

	return (
		<div className="flex fixed inset-0 z-50 justify-center items-center bg-black bg-opacity-50">
			<div className="p-6 mx-4 w-full max-w-md bg-white rounded-lg shadow-xl dark:bg-gray-800">
				{/* Header */}
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
						Attendance QR Code
					</h2>
					<button
						onClick={onClose}
						className="text-2xl text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
					>
						×
					</button>
				</div>

				{/* User Info */}
				{userProfile && (
					<div className="mb-4 text-center">
						<p className="text-gray-600 dark:text-gray-300">
							{userProfile.user_firstname} {userProfile.user_lastname}
						</p>
						<p className="text-sm text-gray-500 dark:text-gray-400">
							Student ID: {userId}
						</p>
					</div>
				)}

				{/* QR Code */}
				<div className="flex justify-center mb-4">
					<div className="p-4 bg-white rounded-lg shadow-inner">
						<canvas ref={canvasRef} className="max-w-full h-auto" />
					</div>
				</div>

				{/* Instructions */}
				<p className="mb-4 text-sm text-center text-gray-600 dark:text-gray-400">
					Show this QR code to your instructor for attendance verification
				</p>

				{/* Action Buttons */}
				<div className="flex gap-3 justify-center">
					<button
						onClick={downloadQRCode}
						className="flex gap-2 items-center px-4 py-2 text-white bg-green-600 rounded-lg transition-colors duration-200 hover:bg-green-700"
					>
						<svg
							className="w-4 h-4"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							/>
						</svg>
						Download QR Code
					</button>
					<button
						onClick={onClose}
						className="px-4 py-2 text-white bg-gray-600 rounded-lg transition-colors duration-200 hover:bg-gray-700"
					>
						Close
					</button>
				</div>
			</div>
		</div>
	);
};

export default QRCodeModal;
