import axios from "axios";
import { getDecryptedApiUrl } from "./apiConfig";

export const getComments = async (postId) => {
	try {
		const apiUrl = getDecryptedApiUrl();
		const formData = new FormData();
		formData.append("operation", "getComment");
		formData.append("json", JSON.stringify({ post_id: postId }));

		const response = await axios.post(`${apiUrl}/student.php`, formData);

		if (response.data) {
			return {
				success: true,
				comments: response.data,
			};
		}

		return {
			success: false,
			comments: [],
		};
	} catch (error) {
		console.error("Error fetching comments:", error);
		return {
			success: false,
			comments: [],
		};
	}
};

export const addComment = async (userId, postId, commentMessage) => {
	try {
		const apiUrl = getDecryptedApiUrl();
		const formData = new FormData();
		formData.append("operation", "addComment");
		formData.append(
			"json",
			JSON.stringify({
				comment_userId: userId,
				comment_postId: postId,
				comment_message: commentMessage,
			})
		);

		const response = await axios.post(`${apiUrl}/student.php`, formData);

		if (response.data) {
			return response.data;
		}

		return {
			success: false,
			message: "Failed to add comment",
		};
	} catch (error) {
		console.error("Error adding comment:", error);
		return {
			success: false,
			message: "Failed to add comment",
		};
	}
};

export const formatTimeAgo = (dateString) => {
	// Parse the database timestamp
	const date = new Date(dateString);
	const now = new Date();

	// Calculate the difference in milliseconds
	const diffInMs = now.getTime() - date.getTime();
	const diffInSeconds = Math.floor(diffInMs / 1000);

	// Handle negative differences (future dates) or very recent as "Just now"

	// Handle negative differences (future dates) or very recent as "Just now"
	if (diffInSeconds <= 5) {
		return "Just now";
	}

	if (diffInSeconds < 90) {
		return diffInSeconds === 1
			? "1 second ago"
			: `${diffInSeconds} seconds ago`;
	}

	const diffInMinutes = Math.floor(diffInSeconds / 60);
	if (diffInMinutes < 60) {
		return diffInMinutes === 1
			? "1 minute ago"
			: `${diffInMinutes} minutes ago`;
	}

	const diffInHours = Math.floor(diffInMinutes / 60);
	if (diffInHours < 24) {
		return diffInHours === 1 ? "1 hour ago" : `${diffInHours} hours ago`;
	}

	const diffInDays = Math.floor(diffInHours / 24);
	if (diffInDays < 7) {
		return diffInDays === 1 ? "1 day ago" : `${diffInDays} days ago`;
	}

	const diffInWeeks = Math.floor(diffInDays / 7);
	if (diffInWeeks < 4) {
		return diffInWeeks === 1 ? "1 week ago" : `${diffInWeeks} weeks ago`;
	}

	const diffInMonths = Math.floor(diffInDays / 30);
	if (diffInMonths < 12) {
		return diffInMonths === 1 ? "1 month ago" : `${diffInMonths} months ago`;
	}

	const diffInYears = Math.floor(diffInDays / 365);
	return diffInYears === 1 ? "1 year ago" : `${diffInYears} years ago`;
};

export const getStudentAttendanceRecords = async (studentId) => {
	try {
		const apiUrl = getDecryptedApiUrl();
		const formData = new FormData();
		formData.append("operation", "getStudentAttendanceRecords");
		formData.append("json", JSON.stringify({ studentId }));

		const response = await axios.post(`${apiUrl}/student.php`, formData);
		// console.log(response.data);

		if (Array.isArray(response.data)) {
			return {
				success: true,
				records: response.data,
			};
		}

		return {
			success: false,
			records: [],
		};
	} catch (error) {
		console.error("Error fetching student attendance records:", error);
		return {
			success: false,
			records: [],
		};
	}
};
