import React, { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import {
	Download,
	Calendar,
	Clock,
	LogIn,
	LogOut,
	CheckCircle,
	XCircle,
	X,
} from "lucide-react";
import { getStudentAttendanceRecords } from "../utils/student";

const QRCodeModal = ({ isOpen, onClose, userId, userProfile }) => {
	const canvasRef = useRef(null);
	const [qrDataUrl, setQrDataUrl] = useState("");
	const [showAttendanceRecords, setShowAttendanceRecords] = useState(false);
	const [attendanceRecords, setAttendanceRecords] = useState([]);
	const [loading, setLoading] = useState(false);

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

	const fetchAttendanceRecords = async () => {
		if (!userId) return;

		setLoading(true);
		try {
			const result = await getStudentAttendanceRecords(userId);
			if (result.success) {
				setAttendanceRecords(result.records);
			} else {
				setAttendanceRecords([]);
			}
		} catch (error) {
			console.error("Error fetching attendance records:", error);
			setAttendanceRecords([]);
		} finally {
			setLoading(false);
		}
	};

	const handleViewRecords = () => {
		fetchAttendanceRecords();
		setShowAttendanceRecords(true);
	};

	const formatTime = (datetime) => {
		if (!datetime) return "-";
		return new Date(datetime).toLocaleTimeString("en-US", {
			hour: "2-digit",
			minute: "2-digit",
			hour12: true,
		});
	};

	const formatDate = (datetime) => {
		if (!datetime) return "-";
		return new Date(datetime).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	const getAttendanceStatus = (record) => {
		if (record.attendance_timeIn && record.attendance_timeOut) {
			return "Completed";
		} else if (record.attendance_timeIn && !record.attendance_timeOut) {
			return "Time In";
		}
		return "No record";
	};

	if (!isOpen) return null;

	return (
		<div className="flex fixed inset-0 z-50 justify-center items-center p-4 bg-black bg-opacity-50">
			<div className="p-4 mx-auto w-full max-w-md bg-white rounded-lg shadow-xl sm:p-6 dark:bg-gray-800">
				{/* Header */}
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-lg font-bold text-gray-800 sm:text-xl dark:text-gray-200">
						Attendance QR Code
					</h2>
					<button
						onClick={onClose}
						className="p-1 text-2xl text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
					>
						×
					</button>
				</div>

				{/* User Info */}
				{userProfile && (
					<div className="mb-4 text-center">
						<p className="text-sm text-gray-600 sm:text-base dark:text-gray-300">
							{userProfile.user_firstname} {userProfile.user_lastname}
						</p>
						<p className="text-xs text-gray-500 sm:text-sm dark:text-gray-400">
							Student ID: {userId}
						</p>
					</div>
				)}

				{/* QR Code */}
				<div className="flex justify-center mb-4">
					<div className="relative p-3 bg-white rounded-lg shadow-inner sm:p-4">
						<canvas
							ref={canvasRef}
							className="w-48 max-w-full h-48 h-auto sm:w-64 sm:h-64"
						/>
						{/* Download Link - Top Right Corner */}
						<button
							onClick={downloadQRCode}
							className="absolute -top-2 -right-2 flex gap-1 items-center px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-full shadow-sm transition-all duration-200 hover:bg-emerald-100 hover:shadow-md hover:scale-105 active:scale-95 border border-emerald-200/50 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-700/50 dark:hover:bg-emerald-800/30"
						>
							<Download className="w-3 h-3" />
							<span>Download</span>
						</button>
					</div>
				</div>

				{/* Instructions */}
				<p className="mb-4 text-xs text-center text-gray-600 sm:text-sm dark:text-gray-400">
					Show this QR code to your instructor for attendance verification
				</p>

				{/* Action Buttons */}
				<div className="flex flex-col gap-3 justify-center sm:flex-row sm:gap-3">
					<button
						onClick={handleViewRecords}
						className="flex relative flex-1 gap-2 justify-center items-center px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl border shadow-lg transition-all duration-300 group hover:from-blue-600 hover:to-blue-700 hover:shadow-xl hover:scale-105 active:scale-95 sm:text-base border-blue-400/20"
					>
						<div className="absolute inset-0 bg-gradient-to-r to-transparent rounded-xl opacity-0 transition-opacity duration-300 from-blue-400/20 group-hover:opacity-100"></div>
						<Calendar className="relative w-4 h-4 drop-shadow-sm sm:w-5 sm:h-5" />
						<span className="relative whitespace-nowrap drop-shadow-sm">
							View Records
						</span>
					</button>
					<button
						onClick={onClose}
						className="flex relative flex-1 gap-2 justify-center items-center px-4 py-3 text-sm font-semibold text-gray-700 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl border shadow-lg transition-all duration-300 group hover:from-gray-200 hover:to-gray-300 hover:shadow-xl hover:scale-105 active:scale-95 sm:text-base border-gray-300/50 dark:from-gray-700 dark:to-gray-800 dark:text-gray-200 dark:border-gray-600/50 dark:hover:from-gray-600 dark:hover:to-gray-700"
					>
						<div className="absolute inset-0 bg-gradient-to-r to-transparent rounded-xl opacity-0 transition-opacity duration-300 from-gray-200/20 group-hover:opacity-100 dark:from-gray-600/20"></div>
						<span className="relative whitespace-nowrap">Close</span>
					</button>
				</div>
			</div>

			{/* Attendance Records Modal */}
			{showAttendanceRecords && (
				<div className="flex fixed inset-0 justify-center items-center p-4 bg-black bg-opacity-50 backdrop-blur-md z-80">
					<div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
						{/* Header */}
						<div className="flex justify-between items-center p-4 border-b border-gray-200 sm:p-6 dark:border-gray-700">
							<h2 className="text-lg font-bold text-gray-800 sm:text-xl dark:text-gray-200">
								My Attendance Records
							</h2>
							<button
								onClick={() => setShowAttendanceRecords(false)}
								className="p-2 text-gray-500 rounded-lg transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
							>
								<X className="w-5 h-5 sm:w-6 sm:h-6" />
							</button>
						</div>

						{/* Content */}
						<div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
							{loading ? (
								<div className="flex justify-center items-center py-8">
									<div className="w-8 h-8 rounded-full border-b-2 border-blue-600 animate-spin"></div>
								</div>
							) : attendanceRecords.length === 0 ? (
								<div className="py-8 text-center">
									<Calendar className="mx-auto mb-4 w-12 h-12 text-gray-300 dark:text-gray-600" />
									<p className="text-sm text-gray-500 sm:text-base dark:text-gray-400">
										No attendance records found
									</p>
								</div>
							) : (
								<div className="space-y-3 sm:space-y-4">
									{attendanceRecords.map((record, index) => {
										const status = getAttendanceStatus(record);
										return (
											<div
												key={index}
												className="p-3 bg-gray-50 rounded-lg border border-gray-200 sm:p-4 dark:bg-gray-700 dark:border-gray-600"
											>
												<div className="flex flex-col gap-2 mb-3 sm:flex-row sm:justify-between sm:items-start sm:gap-0">
													<div>
														<h3 className="text-sm font-semibold text-gray-800 sm:text-base dark:text-gray-200">
															{record.session_name || "Unknown Session"}
														</h3>
														<p className="text-xs text-gray-600 sm:text-sm dark:text-gray-400">
															{formatDate(record.attendance_timeIn)}
														</p>
														{record.user_firstname && record.user_lastname && (
															<p className="text-xs text-blue-600 sm:text-sm dark:text-blue-400">
																Processed by: {record.user_firstname}{" "}
																{record.user_lastname} (
																{record.userL_name || "Faculty"})
															</p>
														)}
													</div>
													<span
														className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
															status === "Completed"
																? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
																: status === "Time In"
																? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
																: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
														}`}
													>
														{status === "Completed" && (
															<CheckCircle className="mr-1 w-3 h-3 sm:w-4 sm:h-4" />
														)}
														{status === "Time In" && (
															<LogIn className="mr-1 w-3 h-3 sm:w-4 sm:h-4" />
														)}
														{status === "No record" && (
															<XCircle className="mr-1 w-3 h-3 sm:w-4 sm:h-4" />
														)}
														{status}
													</span>
												</div>

												<div className="grid grid-cols-1 gap-3 text-xs sm:gap-4 sm:text-sm">
													<div className="flex gap-2 items-center text-gray-600 dark:text-gray-300">
														<LogIn className="flex-shrink-0 w-3 h-3 text-green-600 sm:w-4 sm:h-4 dark:text-green-400" />
														<span className="font-medium">Time In:</span>
														<span>{formatTime(record.attendance_timeIn)}</span>
													</div>
													<div className="flex gap-2 items-center text-gray-600 dark:text-gray-300">
														<LogOut className="flex-shrink-0 w-3 h-3 text-red-600 sm:w-4 sm:h-4 dark:text-red-400" />
														<span className="font-medium">Time Out:</span>
														<span>{formatTime(record.attendance_timeOut)}</span>
													</div>
												</div>
											</div>
										);
									})}
								</div>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default QRCodeModal;
