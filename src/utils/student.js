import axios from "axios";
import { getDecryptedApiUrl } from "./apiConfig";

export async function getDocuments() {
	const formData = new FormData();
	formData.append("operation", "GetDocuments");

	// Get the encrypted API URL from session storage
	const apiUrl = getDecryptedApiUrl();

	try {
		const response = await axios.post(`${apiUrl}/student.php`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		return response.data;
	} catch (error) {
		throw error;
	}
}

export async function getRequirementsType() {
	const formData = new FormData();
	formData.append("operation", "getRequirementsType");

	// Get the encrypted API URL from session storage
	const apiUrl = getDecryptedApiUrl();

	try {
		const response = await axios.post(`${apiUrl}/student.php`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		return response.data;
	} catch (error) {
		throw error;
	}
}

export async function addRequestDocument({
	userId,
	documentId,
	purpose,
	attachments = [],
	typeIds = [],
}) {
	const formData = new FormData();
	formData.append("operation", "addRequestDocument");
	formData.append(
		"json",
		JSON.stringify({ userId, documentId, purpose, typeIds })
	);

	// Add multiple file attachments if provided
	if (attachments && attachments.length > 0) {
		attachments.forEach((file, index) => {
			formData.append(`attachments[${index}]`, file);
		});
	}

	// Get the encrypted API URL from session storage
	const apiUrl = getDecryptedApiUrl();

	try {
		const response = await axios.post(`${apiUrl}/student.php`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		console.log("response", response.data);
		return response.data;
	} catch (error) {
		throw error;
	}
}

export async function getUserRequests(userId) {
	const formData = new FormData();
	formData.append("operation", "getUserRequests");
	formData.append("json", JSON.stringify({ userId }));

	// Get the encrypted API URL from session storage
	const apiUrl = getDecryptedApiUrl();

	try {
		const response = await axios.post(`${apiUrl}/student.php`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		return response.data;
	} catch (error) {
		throw error;
	}
}

export async function addCombinedRequestDocument({
	userId,
	primaryDocumentId,
	secondaryDocumentId,
	purpose,
	attachments = [],
	typeIds = [],
}) {
	const formData = new FormData();
	formData.append("operation", "addCombinedRequestDocument");
	formData.append(
		"json",
		JSON.stringify({
			userId,
			primaryDocumentId,
			secondaryDocumentId,
			purpose,
			typeIds,
		})
	);

	// Add multiple file attachments if provided
	if (attachments && attachments.length > 0) {
		attachments.forEach((file, index) => {
			formData.append(`attachments[${index}]`, file);
		});
	}

	// Get the encrypted API URL from session storage
	const apiUrl = getDecryptedApiUrl();

	try {
		const response = await axios.post(`${apiUrl}/student.php`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		console.log("response", response.data);
		return response.data;
	} catch (error) {
		throw error;
	}
}

export async function getRequestTracking(requestId) {
	const formData = new FormData();
	formData.append("operation", "getRequestTracking");
	formData.append("json", JSON.stringify({ requestId }));

	// Get the encrypted API URL from session storage
	const apiUrl = getDecryptedApiUrl();

	try {
		const response = await axios.post(`${apiUrl}/student.php`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		return response.data;
	} catch (error) {
		throw error;
	}
}
