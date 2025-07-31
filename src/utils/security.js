import axios from "axios";
import { getDecryptedApiUrl } from "./apiConfig";

export async function loginUser(username, password) {
	const formData = new FormData();
	formData.append("operation", "login");
	formData.append("json", JSON.stringify({ username: username, password }));
	console.log("username and password", username, password);

	// Get the encrypted API URL from session storage
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
