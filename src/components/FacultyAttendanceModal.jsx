import React, { useState, useEffect, useRef } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";
import axios from "axios";
import { getDecryptedApiUrl } from "../utils/apiConfig";
import toast from "react-hot-toast";
import { Toaster } from "react-hot-toast";

const FacultyAttendanceModal = ({
	isOpen,
	onClose,
	facultyId,
	facultyProfile,
}) => {
	const [students, setStudents] = useState([]);
	const [sessions, setSessions] = useState([]);
	const [selectedSession, setSelectedSession] = useState(null);
	const [showScanner, setShowScanner] = useState(false);
	const [scanResult, setScanResult] = useState("");
	const [attendanceRecords, setAttendanceRecords] = useState([]);
	const [loading, setLoading] = useState(false);
	const videoRef = useRef(null);
	const codeReader = useRef(null);

	useEffect(() => {
		if (isOpen && facultyId) {
			fetchStudentsInTribe();
			fetchAttendanceSessions();
			fetchTodayAttendance();
		}
	}, [isOpen, facultyId]);

	useEffect(() => {
		return () => {
			// Cleanup camera when component unmounts
			if (codeReader.current) {
				codeReader.current.reset();
			}
		};
	}, []);

	const fetchStudentsInTribe = async () => {
		try {
			const apiUrl = getDecryptedApiUrl();
			const formData = new FormData();
			formData.append("operation", "getStudentsInTribe");
			formData.append("json", JSON.stringify({ facultyId }));

			const response = await axios.post(`${apiUrl}/faculty.php`, formData);

			// Ensure response.data is an array
			const data = response.data;
			if (Array.isArray(data)) {
				setStudents(data);
			} else {
				console.warn("Expected array from getStudentsInTribe, got:", data);
				setStudents([]);
			}
		} catch (error) {
			console.error("Error fetching students:", error);
			setStudents([]);
		}
	};

	const fetchAttendanceSessions = async () => {
		try {
			const apiUrl = getDecryptedApiUrl();
			const formData = new FormData();
			formData.append("operation", "getAttendanceSessions");

			const response = await axios.post(`${apiUrl}/faculty.php`, formData);

			// Ensure response.data is an array
			const data = response.data;
			if (Array.isArray(data)) {
				setSessions(data);
			} else {
				console.warn("Expected array from getAttendanceSessions, got:", data);
				setSessions([]);
			}
		} catch (error) {
			console.error("Error fetching sessions:", error);
			setSessions([]);
		}
	};

	const fetchTodayAttendance = async () => {
		try {
			const apiUrl = getDecryptedApiUrl();
			const formData = new FormData();
			formData.append("operation", "getTodayAttendance");
			formData.append("json", JSON.stringify({ facultyId }));

			const response = await axios.post(`${apiUrl}/faculty.php`, formData);

			// Ensure response.data is an array
			const data = response.data;
			if (Array.isArray(data)) {
				setAttendanceRecords(data);
			} else {
				console.warn("Expected array from getTodayAttendance, got:", data);
				setAttendanceRecords([]);
			}
		} catch (error) {
			console.error("Error fetching today's attendance:", error);
			setAttendanceRecords([]);
		}
	};

	const startScanner = async () => {
		if (!selectedSession) {
			toast.error("Please select a session first!");
			return;
		}

		if (selectedSession.attendanceS_status === 0) {
			toast.error("This session is currently inactive!");
			return;
		}

		setShowScanner(true);

		try {
			// Check if getUserMedia is supported
			if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
				throw new Error("Camera access is not supported in this browser");
			}

			// First, check camera permissions
			try {
				const permissionStatus = await navigator.permissions.query({
					name: "camera",
				});
				console.log("Camera permission status:", permissionStatus.state);

				if (permissionStatus.state === "denied") {
					throw new Error(
						"Camera permission is denied. Please enable camera access in your browser settings."
					);
				}
			} catch (permError) {
				console.warn("Permission API not supported:", permError);
				// Continue anyway, as some browsers don't support permissions API
			}

			codeReader.current = new BrowserMultiFormatReader();

			// Try different camera constraints in order of preference
			const constraintOptions = [
				// First try: Back camera with ideal resolution
				{
					video: {
						facingMode: { exact: "environment" },
						width: { ideal: 640 },
						height: { ideal: 480 },
					},
				},
				// Second try: Any back camera
				{
					video: {
						facingMode: "environment",
						width: { ideal: 640 },
						height: { ideal: 480 },
					},
				},
				// Third try: Front camera
				{
					video: {
						facingMode: "user",
						width: { ideal: 640 },
						height: { ideal: 480 },
					},
				},
				// Fourth try: Any camera with basic constraints
				{
					video: {
						width: { ideal: 640 },
						height: { ideal: 480 },
					},
				},
				// Last try: Just video
				{
					video: true,
				},
			];

			let stream = null;
			let lastError = null;

			// Try each constraint option until one works
			for (const constraints of constraintOptions) {
				try {
					console.log("Trying camera constraints:", constraints);
					stream = await navigator.mediaDevices.getUserMedia(constraints);
					console.log(
						"Camera access successful with constraints:",
						constraints
					);
					break;
				} catch (error) {
					console.warn(
						"Failed with constraints:",
						constraints,
						"Error:",
						error.message
					);
					lastError = error;
					continue;
				}
			}

			if (!stream) {
				throw (
					lastError ||
					new Error("Unable to access camera with any configuration")
				);
			}

			if (videoRef.current) {
				videoRef.current.srcObject = stream;

				// Wait for video to be ready
				await new Promise((resolve, reject) => {
					const video = videoRef.current;
					if (!video) {
						reject(new Error("Video element not available"));
						return;
					}

					const onLoadedMetadata = () => {
						video.removeEventListener("loadedmetadata", onLoadedMetadata);
						video.removeEventListener("error", onError);
						resolve();
					};

					const onError = (error) => {
						video.removeEventListener("loadedmetadata", onLoadedMetadata);
						video.removeEventListener("error", onError);
						reject(new Error("Video failed to load: " + error.message));
					};

					video.addEventListener("loadedmetadata", onLoadedMetadata);
					video.addEventListener("error", onError);

					video.play().catch(reject);
				});

				// Start QR code detection
				codeReader.current.decodeFromVideoDevice(
					null,
					videoRef.current,
					(result, error) => {
						if (result) {
							console.log("QR Code detected:", result.getText());
							setScanResult(result.getText());
							handleQRScanResult(result.getText());
							// Don't stop scanner here - let it continue scanning
						}
						if (error && error.name !== "NotFoundException") {
							console.warn("QR Scanner error:", error);
						}
					}
				);

				// Show success toast when camera starts
				toast.success("Camera started! Scan QR codes continuously.", {
					duration: 3000,
				});
			}
		} catch (error) {
			console.error("Camera access error:", error);
			setShowScanner(false);

			// Provide specific error messages with toast
			if (error.name === "NotAllowedError") {
				toast.error(
					"Camera permission denied. Please allow camera access and try again.",
					{
						duration: 5000,
					}
				);
			} else if (error.name === "NotFoundError") {
				toast.error("No camera found on this device.");
			} else if (error.name === "NotSupportedError") {
				toast.error("Camera is not supported in this browser.");
			} else if (error.name === "NotReadableError") {
				toast.error("Camera is already in use by another application.");
			} else if (error.name === "OverconstrainedError") {
				toast.error("Camera doesn't support the requested settings.");
			} else {
				toast.error(error.message || "Unknown camera error occurred.", {
					duration: 4000,
				});
			}
		}
	};

	const stopScanner = () => {
		if (codeReader.current) {
			codeReader.current.reset();
		}
		if (videoRef.current && videoRef.current.srcObject) {
			const tracks = videoRef.current.srcObject.getTracks();
			tracks.forEach((track) => track.stop());
			videoRef.current.srcObject = null;
		}
		setShowScanner(false);
		toast.success("Scanner stopped.", {
			duration: 2000,
		});
	};

	const handleQRScanResult = async (qrText) => {
		// Prevent processing if already processing another scan
		if (loading) {
			console.log("Already processing a scan, skipping...");
			return;
		}

		// Extract student ID from QR code text
		// Expected format: "student_id: STUDENT_ID" or just "STUDENT_ID"
		let studentId = qrText;
		if (qrText.includes("student_id:")) {
			studentId = qrText.split("student_id:")[1].trim();
		}

		// Verify student is in the same tribe
		const student = students.find((s) => s.user_id === studentId);
		if (!student) {
			toast.error("Student not found in your tribe!", {
				duration: 3000,
			});
			return;
		}

		const studentName = `${student.user_firstname} ${student.user_lastname}`;

		// Show loading toast for checking attendance
		const checkingToast = toast.loading("Checking attendance status...");

		try {
			// Refresh attendance records to get the most up-to-date data
			await fetchTodayAttendance();

			// Wait a moment for state to update
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Get fresh attendance records
			const response = await axios.post(
				`${getDecryptedApiUrl()}/faculty.php`,
				(() => {
					const formData = new FormData();
					formData.append("operation", "getTodayAttendance");
					formData.append("json", JSON.stringify({ facultyId }));
					return formData;
				})()
			);

			const freshAttendanceRecords = Array.isArray(response.data)
				? response.data
				: [];

			// Check current attendance status for this student with fresh data
			const currentRecord = freshAttendanceRecords.find(
				(r) =>
					r.attendance_studentId === studentId &&
					r.attendance_sessionId === selectedSession?.attendanceS_id
			);

			toast.dismiss(checkingToast);

			// If student has a time-in record, check if 1 hour has passed
			if (currentRecord && currentRecord.attendance_timeIn) {
				const timeInDate = new Date(currentRecord.attendance_timeIn);
				const now = new Date();
				const timeDifference = now.getTime() - timeInDate.getTime();
				const oneHourInMs = 60 * 60 * 1000; // 1 hour in milliseconds

				console.log(`Student ${studentName} time check:`, {
					timeIn: currentRecord.attendance_timeIn,
					timeOut: currentRecord.attendance_timeOut,
					timeDifference: Math.round(timeDifference / 1000 / 60), // minutes
					oneHourPassed: timeDifference >= oneHourInMs,
				});

				// If student already has time out, they're done
				if (currentRecord.attendance_timeOut) {
					const timeInFormatted = formatTime(currentRecord.attendance_timeIn);
					const timeOutFormatted = formatTime(currentRecord.attendance_timeOut);
					const dateFormatted = formatDate(currentRecord.attendance_timeIn);

					toast.success(
						`${studentName} already completed attendance!\n📅 ${dateFormatted}\n🕐 In: ${timeInFormatted} | Out: ${timeOutFormatted}`,
						{
							duration: 5000,
							icon: "✅",
						}
					);
					return;
				}

				// If less than 1 hour has passed since time-in, block the scan
				if (timeDifference < oneHourInMs) {
					const remainingTime = Math.ceil(
						(oneHourInMs - timeDifference) / (1000 * 60)
					); // Convert to minutes
					const timeInFormatted = formatTime(currentRecord.attendance_timeIn);
					const dateFormatted = formatDate(currentRecord.attendance_timeIn);

					toast.error(
						`${studentName} is already timed in!\n📅 ${dateFormatted}\n🕐 Time In: ${timeInFormatted}\n⏳ Wait ${remainingTime} minutes to allow time out`,
						{
							duration: 5000,
							icon: "⚠️",
						}
					);
					return;
				}

				// If 1+ hour has passed, allow time out (continue to processAttendance)
				console.log(
					`1+ hour has passed since ${studentName} timed in. Allowing time out.`
				);
			}

			// Show loading toast for processing attendance
			const loadingToast = toast.loading("Processing attendance...");

			try {
				await processAttendance(studentId);
			} finally {
				toast.dismiss(loadingToast);
			}
		} catch (error) {
			toast.dismiss(checkingToast);
			console.error("Error checking attendance status:", error);
			toast.error("Error checking attendance status. Please try again.");
			return;
		}

		// Continue scanning - don't stop the scanner
		console.log("Continuing to scan for more QR codes...");
	};

	const processAttendance = async (studentId) => {
		setLoading(true);
		try {
			const apiUrl = getDecryptedApiUrl();
			const formData = new FormData();
			formData.append("operation", "processAttendance");
			formData.append(
				"json",
				JSON.stringify({
					facultyId,
					studentId,
					sessionId: selectedSession.attendanceS_id,
				})
			);

			const response = await axios.post(`${apiUrl}/faculty.php`, formData);
			const result = response.data;

			if (result.success) {
				const student = students.find((s) => s.user_id === studentId);
				const studentName = student
					? `${student.user_firstname} ${student.user_lastname}`
					: `Student ${studentId}`;

				if (result.action === "time_in") {
					toast.success(`✅ Time In recorded for ${studentName}`, {
						duration: 3000,
						icon: "🕐",
					});
				} else {
					toast.success(`✅ Time Out recorded for ${studentName}`, {
						duration: 3000,
						icon: "🕐",
					});
				}

				fetchTodayAttendance(); // Refresh attendance records
			} else {
				toast.error(result.message || "Error processing attendance", {
					duration: 3000,
				});
			}
		} catch (error) {
			console.error("Error processing attendance:", error);
			toast.error("Failed to process attendance. Please try again.", {
				duration: 3000,
			});
		} finally {
			setLoading(false);
		}
	};

	const getStudentAttendanceStatus = (studentId) => {
		if (!selectedSession) return "No Session";

		// Ensure attendanceRecords is an array before calling find
		if (!Array.isArray(attendanceRecords)) {
			console.warn("attendanceRecords is not an array:", attendanceRecords);
			return "Absent";
		}

		const record = attendanceRecords.find(
			(r) =>
				r.attendance_studentId === studentId &&
				r.attendance_sessionId === selectedSession.attendanceS_id
		);

		if (!record) return "No record";
		if (record.attendance_timeIn && !record.attendance_timeOut)
			return "Checked In";
		if (record.attendance_timeIn && record.attendance_timeOut)
			return "Completed";
		return "Absent";
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

	if (!isOpen) return null;

	return (
		<>
			<Toaster position="top-right" />
			<div className="flex fixed inset-0 z-50 justify-center items-center p-4 bg-black bg-opacity-50">
				<div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
					{/* Header */}
					<div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
						<h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
							Faculty Attendance System
						</h2>
						<button
							onClick={onClose}
							className="text-2xl text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
						>
							×
						</button>
					</div>

					{/* Session Selection */}
					<div className="p-6 border-b dark:border-gray-700">
						<h3 className="mb-4 text-lg font-semibold text-gray-700 dark:text-gray-300">
							Select Session
						</h3>
						<div className="flex flex-wrap gap-4">
							{sessions.map((session) => (
								<button
									key={session.attendanceS_id}
									onClick={() => setSelectedSession(session)}
									className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
										selectedSession?.attendanceS_id === session.attendanceS_id
											? "bg-blue-600 text-white"
											: session.attendanceS_status === 1
											? "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
											: "bg-red-200 text-red-700 cursor-not-allowed dark:bg-red-900 dark:text-red-300"
									}`}
									disabled={session.attendanceS_status === 0}
								>
									{session.attendanceS_name}
									{session.attendanceS_status === 0 && " (Inactive)"}
								</button>
							))}
						</div>
					</div>

					{/* QR Scanner Section */}
					{selectedSession && (
						<div className="p-6 border-b dark:border-gray-700">
							<div className="flex justify-between items-center mb-4">
								<h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
									QR Code Scanner
								</h3>
								<button
									onClick={showScanner ? stopScanner : startScanner}
									disabled={loading || selectedSession.attendanceS_status === 0}
									className={`px-4 py-2 rounded-lg text-white transition-colors duration-200 ${
										showScanner
											? "bg-red-600 hover:bg-red-700"
											: "bg-green-600 hover:bg-green-700"
									} disabled:bg-gray-400 disabled:cursor-not-allowed`}
								>
									{loading
										? "Processing..."
										: showScanner
										? "Stop Scanner"
										: "Start Scanner"}
								</button>
							</div>

							{showScanner && (
								<div className="flex justify-center">
									<div className="relative">
										<video
											ref={videoRef}
											className="w-80 h-60 bg-black rounded-lg"
											playsInline
										/>
										<div className="absolute inset-0 rounded-lg border-2 border-green-500 pointer-events-none">
											<div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-green-500"></div>
											<div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-green-500"></div>
											<div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-green-500"></div>
											<div className="absolute right-4 bottom-4 w-6 h-6 border-r-2 border-b-2 border-green-500"></div>
										</div>
									</div>
								</div>
							)}
						</div>
					)}

					{/* Students List */}
					<div className="overflow-y-auto flex-1 p-6">
						<h3 className="mb-4 text-lg font-semibold text-gray-700 dark:text-gray-300">
							Students in Your Tribe ({students.length})
						</h3>

						{students.length === 0 ? (
							<p className="py-8 text-center text-gray-500 dark:text-gray-400">
								No students found in your tribe.
							</p>
						) : (
							<div className="grid gap-3">
								{students.map((student) => {
									const status = getStudentAttendanceStatus(student.user_id);

									// Ensure attendanceRecords is an array before calling find
									const record = Array.isArray(attendanceRecords)
										? attendanceRecords.find(
												(r) =>
													r.attendance_studentId === student.user_id &&
													r.attendance_sessionId ===
														selectedSession?.attendanceS_id
										  )
										: null;

									return (
										<div
											key={student.user_id}
											className="flex justify-between items-center p-4 bg-gray-50 rounded-lg dark:bg-gray-700"
										>
											<div className="flex gap-3 items-center">
												{student.user_avatar ? (
													<img
														src={student.user_avatar}
														alt={`${student.user_firstname} ${student.user_lastname}`}
														className="object-cover w-10 h-10 rounded-full"
													/>
												) : (
													<div className="flex justify-center items-center w-10 h-10 font-semibold text-white bg-blue-500 rounded-full">
														{`${student.user_firstname?.charAt(0) || ""}${
															student.user_lastname?.charAt(0) || ""
														}`}
													</div>
												)}
												<div>
													<p className="font-medium text-gray-800 dark:text-gray-200">
														{student.user_firstname} {student.user_lastname}
													</p>
													<p className="text-sm text-gray-500 dark:text-gray-400">
														ID: {student.user_id}
													</p>
												</div>
											</div>

											<div className="text-right">
												<div className="flex flex-col gap-1 items-end">
													<span
														className={`px-3 py-1 rounded-full text-sm font-medium ${
															status === "Completed"
																? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
																: status === "Checked In"
																? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
																: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
														}`}
													>
														{status}
													</span>
													{record && (
														<div className="text-xs text-gray-500 dark:text-gray-400">
															<div className="mb-1 font-medium">
																📅 {formatDate(record.attendance_timeIn)}
															</div>
															<div>
																In: {formatTime(record.attendance_timeIn)} |
																Out: {formatTime(record.attendance_timeOut)}
															</div>
														</div>
													)}
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
		</>
	);
};

export default FacultyAttendanceModal;
