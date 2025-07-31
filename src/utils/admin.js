import axios from "axios";
import { getDecryptedApiUrl } from "./apiConfig";

export async function getUserLevel() {
	const formData = new FormData();
	formData.append("operation", "getUserLevel");

	// Get the encrypted API URL from session storage
	const apiUrl = getDecryptedApiUrl();

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		return response.data;
	} catch (error) {
		throw error;
	}
}

export async function addUser(userData) {
	const formData = new FormData();
	formData.append("operation", "addUser");
	formData.append("json", JSON.stringify(userData));

	// Get the encrypted API URL from session storage
	const apiUrl = getDecryptedApiUrl();

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		return response.data;
	} catch (error) {
		throw error;
	}
}

export async function getUsers() {
	const formData = new FormData();
	formData.append("operation", "getUsers");

	// Get the encrypted API URL from session storage
	const apiUrl = getDecryptedApiUrl();

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		return response.data;
	} catch (error) {
		throw error;
	}
}

export async function verifyPin(userId, pin) {
	const formData = new FormData();
	formData.append("operation", "verifyPin");
	formData.append("json", JSON.stringify({ userId, pin }));

	// Get the encrypted API URL from session storage
	const apiUrl = getDecryptedApiUrl();

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		return response.data;
	} catch (error) {
		throw error;
	}
}

export async function getGradeLevel() {
	const formData = new FormData();
	formData.append("operation", "getGradelevel");

	const apiUrl = getDecryptedApiUrl();

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		console.log("response", response.data);
		return response.data;
	} catch (error) {
		throw error;
	}
}

export async function getRequestStats() {
	const formData = new FormData();
	formData.append("operation", "getRequestStats");

	const apiUrl = getDecryptedApiUrl();

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		return response.data;
	} catch (error) {
		throw error;
	}
}

export async function getCompletedRequests() {
	const formData = new FormData();
	formData.append("operation", "getCompletedRequests");

	const apiUrl = getDecryptedApiUrl();

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		return response.data;
	} catch (error) {
		throw error;
	}
}

export async function getRecentActivity() {
	const formData = new FormData();
	formData.append("operation", "getRecentActivity");

	const apiUrl = getDecryptedApiUrl();

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		return response.data;
	} catch (error) {
		throw error;
	}
}

export async function getTotalUsers() {
	const formData = new FormData();
	formData.append("operation", "getTotalUsers");

	const apiUrl = getDecryptedApiUrl();

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		return response.data;
	} catch (error) {
		throw error;
	}
}
