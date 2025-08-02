import React, { useState, useEffect, useRef } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";
import axios from "axios";
import { getDecryptedApiUrl } from "../utils/apiConfig";
import toast from "react-hot-toast";
import { Toaster } from "react-hot-toast";
import {
	X,
	ChevronUp,
	AlertTriangle,
	Clock,
	Calendar,
	Circle,
	CheckCircle,
	XCircle,
	LogIn,
	LogOut,
	Search,
	ChevronLeft,
	ChevronRight,
	Users,
} from "lucide-react";
import {
	getStudentsInTribe,
	getAttendanceSessions,
	getTodayAttendance,
	processAttendance,
} from "../utils/faculty";

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
	const [showScrollTop, setShowScrollTop] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedDate, setSelectedDate] = useState(() => {
		// Get current date in Philippines timezone (UTC+8)
		const now = new Date();
		const philippinesTime = new Date(now.getTime() + 8 * 60 * 60 * 1000); // Add 8 hours for UTC+8
		return philippinesTime.toISOString().split("T")[0]; // Today's date in YYYY-MM-DD format
	}); // Today's date in YYYY-MM-DD format
	const [showCalendar, setShowCalendar] = useState(false);
	const [calendarDate, setCalendarDate] = useState(new Date());
	const videoRef = useRef(null);
	const codeReader = useRef(null);
	const scrollContainerRef = useRef(null);

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

	// Handle scroll events to show/hide scroll-to-top button
	useEffect(() => {
		const handleScroll = () => {
			if (scrollContainerRef.current) {
				const scrollTop = scrollContainerRef.current.scrollTop;
				setShowScrollTop(scrollTop > 200); // Show button after scrolling 200px
			}
		};

		const scrollContainer = scrollContainerRef.current;
		if (scrollContainer) {
			scrollContainer.addEventListener("scroll", handleScroll);
			return () => scrollContainer.removeEventListener("scroll", handleScroll);
		}
	}, [isOpen]);

	// Function to scroll to top
	const scrollToTop = () => {
		if (scrollContainerRef.current) {
			scrollContainerRef.current.scrollTo({
				top: 0,
				behavior: "smooth",
			});
		}
	};

	const fetchStudentsInTribe = async () => {
		try {
			const result = await getStudentsInTribe(facultyId);
			if (result.success) {
				setStudents(result.students);
			} else {
				console.warn("Failed to fetch students:", result);
				setStudents([]);
			}
		} catch (error) {
			console.error("Error fetching students:", error);
			setStudents([]);
		}
	};

	const fetchAttendanceSessions = async () => {
		try {
			const result = await getAttendanceSessions();
			if (result.success) {
				setSessions(result.sessions);
			} else {
				console.warn("Failed to fetch sessions:", result);
				setSessions([]);
			}
		} catch (error) {
			console.error("Error fetching sessions:", error);
			setSessions([]);
		}
	};

	const fetchTodayAttendance = async () => {
		try {
			const result = await getTodayAttendance(facultyId);
			if (result.success) {
				console.log("Fetched attendance records:", result.records);
				setAttendanceRecords(result.records);
			} else {
				console.warn("Failed to fetch today's attendance:", result);
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

	// Function to sort students by newest attendance first for selected date
	const sortStudentsByNewestAttendanceForDate = (students) => {
		if (!selectedSession) {
			return students;
		}

		const filteredRecords = getFilteredAttendanceByDate();

		return [...students].sort((a, b) => {
			// Get attendance records for both students in the selected session and date
			const recordA = filteredRecords.find(
				(r) =>
					r.attendance_studentId === a.user_id &&
					r.attendance_sessionId === selectedSession.attendanceS_id
			);
			const recordB = filteredRecords.find(
				(r) =>
					r.attendance_studentId === b.user_id &&
					r.attendance_sessionId === selectedSession.attendanceS_id
			);

			// Get attendance status for both students
			const statusA = getStudentAttendanceStatusForDate(a.user_id);
			const statusB = getStudentAttendanceStatusForDate(b.user_id);

			// Priority order: Completed > Time In > No record
			const priorityOrder = {
				Completed: 3,
				"Time In": 2,
				"No record": 1,
				Absent: 0,
			};

			// First, sort by attendance status priority
			const priorityA = priorityOrder[statusA] || 0;
			const priorityB = priorityOrder[statusB] || 0;

			if (priorityA !== priorityB) {
				return priorityB - priorityA; // Higher priority first
			}

			// If both have the same status, sort by newest time_in
			if (recordA && recordB) {
				const timeA = new Date(recordA.attendance_timeIn).getTime();
				const timeB = new Date(recordB.attendance_timeIn).getTime();
				return timeB - timeA; // Newest first
			}

			// If only one has a record, prioritize the one with attendance
			if (recordA && !recordB) return -1;
			if (!recordA && recordB) return 1;

			// If neither has records, maintain original order (alphabetical by name)
			const nameA = `${a.user_firstname} ${a.user_lastname}`.toLowerCase();
			const nameB = `${b.user_firstname} ${b.user_lastname}`.toLowerCase();
			return nameA.localeCompare(nameB);
		});
	};

	// Function to filter students by search query (name or ID)
	const filterStudents = (students) => {
		if (!searchQuery.trim()) {
			return students;
		}

		const query = searchQuery.toLowerCase().trim();
		return students.filter((student) => {
			const fullName =
				`${student.user_firstname} ${student.user_lastname}`.toLowerCase();
			const studentId = student.user_id.toLowerCase();

			return fullName.includes(query) || studentId.includes(query);
		});
	};

	// Function to filter attendance records by selected date
	const getFilteredAttendanceByDate = () => {
		if (!Array.isArray(attendanceRecords)) {
			return [];
		}

		return attendanceRecords.filter((record) => {
			if (!record.attendance_timeIn) return false;

			// Convert the database datetime to Philippines date for comparison
			const recordDate = new Date(record.attendance_timeIn);
			// Add 8 hours to convert to Philippines timezone (UTC+8)
			const philippinesDate = new Date(
				recordDate.getTime() + 8 * 60 * 60 * 1000
			);
			const recordDateString = philippinesDate.toISOString().split("T")[0]; // Get YYYY-MM-DD part

			// Debug logging
			console.log("Date comparison:", {
				recordDate: record.attendance_timeIn,
				recordDateString,
				selectedDate,
				matches: recordDateString === selectedDate,
			});

			return recordDateString === selectedDate;
		});
	};

	// Function to get student attendance status for selected date
	const getStudentAttendanceStatusForDate = (studentId) => {
		if (!selectedSession) return "No Session";

		console.log("Selected session:", selectedSession);
		console.log("All attendance records:", attendanceRecords);

		const filteredRecords = getFilteredAttendanceByDate();
		console.log("Filtered records for date:", selectedDate, filteredRecords);

		const record = filteredRecords.find(
			(r) =>
				r.attendance_studentId === studentId &&
				r.attendance_sessionId === selectedSession.attendanceS_id
		);

		console.log(
			"Looking for student:",
			studentId,
			"session:",
			selectedSession.attendanceS_id,
			"found record:",
			record
		);

		if (!record) return "No record";
		if (record.attendance_timeIn && !record.attendance_timeOut)
			return "Time In";
		if (record.attendance_timeIn && record.attendance_timeOut)
			return "Completed";
		return "Absent";
	};

	// Combined function to filter and sort students
	const getFilteredAndSortedStudents = () => {
		const filtered = filterStudents(students);
		return sortStudentsByNewestAttendanceForDate(filtered);
	};

	// Calendar helper functions
	const formatDateForDisplay = (date) => {
		return new Date(date).toLocaleDateString("en-US", {
			month: "long",
			day: "numeric",
			year: "numeric",
		});
	};

	const formatDateForInput = (date) => {
		return date.toISOString().split("T")[0];
	};

	const getDaysInMonth = (date) => {
		const year = date.getFullYear();
		const month = date.getMonth();
		const firstDay = new Date(year, month, 1);
		const lastDay = new Date(year, month + 1, 0);
		const daysInMonth = lastDay.getDate();
		const startingDayOfWeek = firstDay.getDay();

		const days = [];

		// Add empty cells for days before the first day of the month
		for (let i = 0; i < startingDayOfWeek; i++) {
			days.push(null);
		}

		// Add all days of the month
		for (let day = 1; day <= daysInMonth; day++) {
			days.push(new Date(year, month, day));
		}

		return days;
	};

	const isDateDisabled = (date) => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		return date > today;
	};

	const isDateSelected = (date) => {
		return formatDateForInput(date) === selectedDate;
	};

	const isToday = (date) => {
		const today = new Date();
		return date.toDateString() === today.toDateString();
	};

	const handleDateSelect = (date) => {
		if (!isDateDisabled(date)) {
			setSelectedDate(formatDateForInput(date));
			setShowCalendar(false);
		}
	};

	const navigateMonth = (direction) => {
		setCalendarDate((prev) => {
			const newDate = new Date(prev);
			newDate.setMonth(prev.getMonth() + direction);
			return newDate;
		});
	};

	const goToToday = () => {
		const today = new Date();
		setSelectedDate(formatDateForInput(today));
		setCalendarDate(today);
		setShowCalendar(false);
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
			<div className="flex fixed inset-0 z-50 justify-center items-center bg-black bg-opacity-50">
				<div className="bg-gray-100 dark:bg-gray-800 rounded-none sm:rounded-lg w-full max-w-4xl h-full sm:h-[calc(105vh-2rem)] flex flex-col overflow-hidden">
					{/* Header */}
					<div className="flex flex-shrink-0 justify-between items-center p-4 border-b sm:p-6 dark:border-gray-700">
						<h2 className="text-lg font-bold text-gray-800 sm:text-xl dark:text-gray-200">
							Faculty Attendance System
						</h2>
						<button
							onClick={onClose}
							className="p-1 text-2xl text-gray-500 rounded-full transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
						>
							<X className="w-6 h-6" />
						</button>
					</div>

					{/* Scrollable Content Area */}
					<div className="overflow-y-auto flex-1" ref={scrollContainerRef}>
						{/* Session Selection */}
						<div className="p-4 border-b sm:p-6 dark:border-gray-700">
							<h3 className="mb-3 text-base font-semibold text-gray-700 sm:mb-4 sm:text-lg dark:text-gray-300">
								Select Session
							</h3>
							<div className="flex flex-col flex-wrap gap-2 sm:flex-row sm:gap-4">
								{sessions.map((session) => (
									<button
										key={session.attendanceS_id}
										onClick={() => setSelectedSession(session)}
										className={`px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg transition-colors duration-200 text-sm sm:text-base font-medium ${
											selectedSession?.attendanceS_id === session.attendanceS_id
												? "bg-blue-600 text-white"
												: session.attendanceS_status === 1
												? "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
												: "bg-red-200 text-red-700 hover:bg-red-300 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800"
										}`}
									>
										{session.attendanceS_name}
										{session.attendanceS_status === 0 && " (Inactive)"}
									</button>
								))}
							</div>
						</div>

						{/* QR Scanner Section - Only show for active sessions */}
						{selectedSession && selectedSession.attendanceS_status === 1 && (
							<div className="p-4 border-b sm:p-6 dark:border-gray-700">
								<div className="flex flex-col gap-3 mb-4 sm:flex-row sm:justify-between sm:items-center sm:gap-4">
									<h3 className="text-base font-semibold text-gray-700 sm:text-lg dark:text-gray-300">
										QR Code Scanner
									</h3>
									<button
										onClick={showScanner ? stopScanner : startScanner}
										disabled={loading}
										className={`px-4 py-2.5 sm:py-2 rounded-lg text-white transition-colors duration-200 text-sm sm:text-base font-medium ${
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
									<div className="flex justify-center mb-4">
										<div className="relative">
											<video
												ref={videoRef}
												className="w-full max-w-xs h-48 bg-black rounded-lg sm:w-80 sm:h-60"
												playsInline
											/>
											<div className="absolute inset-0 rounded-lg border-2 border-green-500 pointer-events-none">
												<div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-green-500 sm:top-4 sm:left-4 sm:w-6 sm:h-6"></div>
												<div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-green-500 sm:top-4 sm:right-4 sm:w-6 sm:h-6"></div>
												<div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-green-500 sm:bottom-4 sm:left-4 sm:w-6 sm:h-6"></div>
												<div className="absolute right-2 bottom-2 w-4 h-4 border-r-2 border-b-2 border-green-500 sm:right-4 sm:bottom-4 sm:w-6 sm:h-6"></div>
											</div>
										</div>
									</div>
								)}
							</div>
						)}

						{/* Session Status Info for Inactive Sessions */}
						{selectedSession && selectedSession.attendanceS_status === 0 && (
							<div className="p-4 border-b sm:p-6 dark:border-gray-700">
								<div className="flex gap-3 items-start p-3 bg-amber-50 rounded-lg border border-amber-200 sm:p-4 dark:bg-amber-900/20 dark:border-amber-800">
									<div className="flex-shrink-0 mt-0.5">
										<AlertTriangle className="w-5 h-5 text-amber-600 sm:w-6 sm:h-6 dark:text-amber-400" />
									</div>
									<div>
										<h4 className="text-sm font-medium text-amber-800 sm:text-base dark:text-amber-200">
											{selectedSession.attendanceS_name} Session is Inactive
										</h4>
										<p className="mt-1 text-xs text-amber-700 sm:text-sm dark:text-amber-300">
											You can view attendance records, but scanning is not
											available for inactive sessions.
										</p>
									</div>
								</div>
							</div>
						)}

						{/* Students List - Always show when session is selected */}
						{selectedSession && (
							<div className="p-3 sm:p-4 md:p-6">
								{/* Date and Search Filters */}
								<div className="mb-4 space-y-3">
									{/* Date Picker */}
									<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
										<label className="flex gap-2 items-center text-sm font-medium text-gray-700 dark:text-gray-300">
											<Calendar className="w-4 h-4" />
											Select Date:
										</label>
										<input
											type="date"
											value={selectedDate}
											onChange={(e) => setSelectedDate(e.target.value)}
											max={(() => {
												// Get current date in Philippines timezone (UTC+8)
												const now = new Date();
												const philippinesTime = new Date(
													now.getTime() + 8 * 60 * 60 * 1000
												);
												return philippinesTime.toISOString().split("T")[0];
											})()} // Prevent future dates
											className="px-3 py-2 text-sm bg-white rounded-lg border border-gray-300 transition-colors focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:focus:ring-blue-400"
										/>
										{selectedDate !==
											(() => {
												// Get current date in Philippines timezone (UTC+8)
												const now = new Date();
												const philippinesTime = new Date(
													now.getTime() + 8 * 60 * 60 * 1000
												);
												return philippinesTime.toISOString().split("T")[0];
											})() && (
											<button
												onClick={() => {
													// Get current date in Philippines timezone (UTC+8)
													const now = new Date();
													const philippinesTime = new Date(
														now.getTime() + 8 * 60 * 60 * 1000
													);
													setSelectedDate(
														philippinesTime.toISOString().split("T")[0]
													);
												}}
												className="text-sm text-blue-600 whitespace-nowrap hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
											>
												Back to Today
											</button>
										)}
									</div>

									{/* Search Input */}
									<div className="relative">
										<div className="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none">
											<Search className="w-4 h-4 text-gray-400 dark:text-gray-500" />
										</div>
										<input
											type="text"
											placeholder="Search by name or ID..."
											value={searchQuery}
											onChange={(e) => setSearchQuery(e.target.value)}
											className="py-2 pr-4 pl-10 w-full text-sm bg-white rounded-lg border border-gray-300 transition-colors focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400 dark:focus:ring-blue-400"
										/>
										{searchQuery && (
											<button
												onClick={() => setSearchQuery("")}
												className="flex absolute inset-y-0 right-0 items-center pr-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
											>
												<X className="w-4 h-4" />
											</button>
										)}
									</div>
								</div>

								{/* Header with Session Info */}
								<div className="flex flex-col gap-2 mb-4 sm:flex-row sm:justify-between sm:items-center sm:gap-4">
									<h3 className="text-base font-semibold text-gray-700 sm:text-lg dark:text-gray-300">
										Students in Your Tribe (
										{getFilteredAndSortedStudents().length}/{students.length})
									</h3>
									<div className="text-xs text-gray-500 sm:text-sm dark:text-gray-400">
										<div className="flex flex-wrap gap-2 items-center">
											<span>Session:</span>
											<span className="font-medium text-gray-700 dark:text-gray-300">
												{selectedSession.attendanceS_name}
											</span>
											<span
												className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
													selectedSession.attendanceS_status === 1
														? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
														: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
												}`}
											>
												{selectedSession.attendanceS_status === 1
													? "Active"
													: "Inactive"}
											</span>
											<span className="text-gray-400">•</span>
											<span className="font-medium text-gray-700 dark:text-gray-300">
												{new Date(selectedDate).toLocaleDateString("en-US", {
													month: "short",
													day: "numeric",
													year: "numeric",
												})}
											</span>
										</div>
									</div>
								</div>

								{students.length === 0 ? (
									<p className="py-8 text-sm text-center text-gray-500 sm:text-base dark:text-gray-400">
										No students found in your tribe.
									</p>
								) : getFilteredAndSortedStudents().length === 0 ? (
									<div className="py-8 text-center">
										<Search className="mx-auto mb-4 w-12 h-12 text-gray-300 dark:text-gray-600" />
										<p className="mb-2 text-sm text-gray-500 sm:text-base dark:text-gray-400">
											No students found matching "{searchQuery}"
										</p>
										<button
											onClick={() => setSearchQuery("")}
											className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
										>
											Clear search
										</button>
									</div>
								) : (
									<div className="space-y-3">
										{getFilteredAndSortedStudents().map((student) => {
											const status = getStudentAttendanceStatusForDate(
												student.user_id
											);

											// Get attendance record for selected date and session
											const filteredRecords = getFilteredAttendanceByDate();
											const record = filteredRecords.find(
												(r) =>
													r.attendance_studentId === student.user_id &&
													r.attendance_sessionId ===
														selectedSession?.attendanceS_id
											);

											return (
												<div
													key={student.user_id}
													className="p-3 bg-white rounded-xl border border-gray-100 shadow-sm transition-all duration-200 sm:p-4 dark:bg-gray-700 dark:border-gray-600 hover:shadow-md"
												>
													{/* Mobile-first layout */}
													<div className="flex gap-3 items-start">
														{/* Avatar */}
														<div className="flex-shrink-0">
															{student.user_avatar ? (
																<img
																	src={student.user_avatar}
																	alt={`${student.user_firstname} ${student.user_lastname}`}
																	className="object-cover w-10 h-10 rounded-full ring-2 ring-gray-100 sm:w-12 sm:h-12 dark:ring-gray-600"
																/>
															) : (
																<div className="flex justify-center items-center w-10 h-10 text-xs font-semibold text-white bg-blue-500 rounded-full ring-2 ring-gray-100 sm:w-12 sm:h-12 sm:text-sm dark:ring-gray-600">
																	{`${student.user_firstname?.charAt(0) || ""}${
																		student.user_lastname?.charAt(0) || ""
																	}`}
																</div>
															)}
														</div>

														{/* Student Info */}
														<div className="flex-1 min-w-0">
															<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
																{/* Name and ID */}
																<div className="min-w-0">
																	<p className="text-sm font-semibold leading-tight text-gray-800 sm:text-base dark:text-gray-200">
																		{student.user_firstname}{" "}
																		{student.user_lastname}
																	</p>
																	<p className="text-xs text-gray-500 sm:text-sm dark:text-gray-400 mt-0.5">
																		ID: {student.user_id}
																	</p>
																</div>

																{/* Status Badge */}
																<div className="flex-shrink-0">
																	<span
																		className={`inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium shadow-sm ${
																			status === "Completed"
																				? "bg-green-100 text-green-800 ring-1 ring-green-200 dark:bg-green-900 dark:text-green-200 dark:ring-green-700"
																				: status === "Time In"
																				? "bg-yellow-100 text-yellow-800 ring-1 ring-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:ring-yellow-700"
																				: "bg-red-100 text-red-800 ring-1 ring-red-200 dark:bg-red-900 dark:text-red-200 dark:ring-red-700"
																		}`}
																	>
																		{status === "Completed" && (
																			<CheckCircle className="mr-1 w-4 h-4" />
																		)}
																		{status === "Time In" && (
																			<LogIn className="mr-1 w-4 h-4 text-yellow-500" />
																		)}
																		{(status === "Absent" ||
																			status === "No record") && (
																			<XCircle className="mr-1 w-4 h-4 text-red-500" />
																		)}
																		{status}
																	</span>
																</div>
															</div>

															{/* Attendance Details */}
															{record && (
																<div className="p-2 mt-2 bg-gray-50 rounded-lg sm:p-3 sm:mt-3 dark:bg-gray-800">
																	<div className="flex flex-col gap-2 text-xs sm:text-sm">
																		<div className="flex gap-2 items-center text-gray-600 dark:text-gray-300">
																			<Calendar className="mr-1 w-4 h-4 text-green-600 dark:text-green-400" />
																			<span>
																				{formatDate(record.attendance_timeIn)}
																			</span>
																		</div>
																		<div className="flex flex-col gap-2 text-gray-600 sm:flex-row sm:gap-4 dark:text-gray-300">
																			<div className="flex gap-2 items-center">
																				<LogIn className="mr-1 w-4 h-4 text-green-600 dark:text-green-400" />
																				<span className="font-medium">In:</span>
																				<span>
																					{formatTime(record.attendance_timeIn)}
																				</span>
																			</div>
																			<div className="flex gap-2 items-center">
																				<LogOut className="mr-1 w-4 h-4 text-red-600 dark:text-red-400" />
																				<span className="font-medium">
																					Out:
																				</span>
																				<span>
																					{formatTime(
																						record.attendance_timeOut
																					)}
																				</span>
																			</div>
																		</div>
																		{/* Processor Information */}
																		{record.processor_firstname &&
																			record.processor_lastname && (
																				<div className="flex gap-2 items-center text-gray-600 dark:text-gray-300">
																					<Users className="mr-1 w-4 h-4 text-blue-600 dark:text-blue-400" />
																					<span className="font-medium">
																						Processed by:
																					</span>
																					<span>
																						{record.processor_firstname}{" "}
																						{record.processor_lastname}
																						{record.processor_role && (
																							<span className="text-gray-500 dark:text-gray-400">
																								{" "}
																								({record.processor_role})
																							</span>
																						)}
																					</span>
																				</div>
																			)}
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
						)}

						{/* No Session Selected */}
						{!selectedSession && (
							<div className="p-4 sm:p-6">
								<div className="py-6 text-center sm:py-8">
									<div className="flex justify-center items-center mx-auto mb-4 w-12 h-12 bg-gray-100 rounded-full sm:w-16 sm:h-16 dark:bg-gray-700">
										<Clock className="w-6 h-6 text-gray-400 sm:w-8 sm:h-8 dark:text-gray-500" />
									</div>
									<h3 className="mb-2 text-base font-medium text-gray-900 sm:text-lg dark:text-gray-100">
										Select a Session
									</h3>
									<p className="px-4 text-sm text-gray-500 sm:text-base dark:text-gray-400">
										Choose a session above to view attendance records and manage
										student check-ins.
									</p>
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Scroll to Top Button */}
				{showScrollTop && (
					<button
						onClick={scrollToTop}
						className="fixed right-6 bottom-6 z-50 p-3 text-white bg-green-600 rounded-full shadow-lg transition-all duration-300 transform hover:bg-blue-700 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
						title="Scroll to top"
					>
						<ChevronUp className="w-5 h-5" />
					</button>
				)}
			</div>
		</>
	);
};

export default FacultyAttendanceModal;
