import axios from "axios";
import { getDecryptedApiUrl } from "./apiConfig";

export async function getProfile(userId) {
	if (!userId) throw new Error("No user_id provided");

	const apiUrl = getDecryptedApiUrl();

	const formData = new FormData();
	formData.append("operation", "getProfile");
	formData.append("json", JSON.stringify({ user_id: userId }));

	const response = await axios.post(`${apiUrl}/faculty.php`, formData);
	// Assuming backend returns an array of user objects
	return response.data && Array.isArray(response.data)
		? response.data[0]
		: response.data;
}

export async function getPosts() {
	const apiUrl = getDecryptedApiUrl();

	const formData = new FormData();
	formData.append("operation", "getPosts");

	const response = await axios.post(`${apiUrl}/faculty.php`, formData);
	return response.data && Array.isArray(response.data) ? response.data : [];
}

export async function getPostsWithUserReactions(userId) {
	const apiUrl = getDecryptedApiUrl();

	const formData = new FormData();
	formData.append("operation", "getPostsWithUserReactions");
	formData.append("json", JSON.stringify({ user_id: userId }));

	const response = await axios.post(`${apiUrl}/faculty.php`, formData);
	return response.data && Array.isArray(response.data) ? response.data : [];
}

export async function addReaction(userId, postId, reactionType) {
	const apiUrl = getDecryptedApiUrl();

	const formData = new FormData();
	formData.append("operation", "addReaction");
	formData.append(
		"json",
		JSON.stringify({
			userId: userId,
			postId: postId,
			reactionType: reactionType,
		})
	);

	const response = await axios.post(`${apiUrl}/faculty.php`, formData);
	return response.data;
}

export async function createPost(userId, caption, imageFiles) {
	const apiUrl = getDecryptedApiUrl();

	// Upload images first
	const uploadedImages = [];
	if (imageFiles && imageFiles.length > 0) {
		for (let i = 0; i < imageFiles.length; i++) {
			const formData = new FormData();
			formData.append("file", imageFiles[i]);

			try {
				const uploadResponse = await axios.post(
					`${apiUrl}/upload.php`,
					formData
				);
				if (uploadResponse.data.success) {
					uploadedImages.push(uploadResponse.data.fileName);
				}
			} catch (error) {
				console.error("Error uploading image:", error);
			}
		}
	}

	// Create post with uploaded images
	const postFormData = new FormData();
	postFormData.append("operation", "createPost");
	postFormData.append(
		"json",
		JSON.stringify({
			userId: userId,
			caption: caption,
			images: uploadedImages,
		})
	);

	const response = await axios.post(`${apiUrl}/faculty.php`, postFormData);
	return response.data;
}

export async function updatePost(userId, postId, caption) {
	const apiUrl = getDecryptedApiUrl();

	const formData = new FormData();
	formData.append("operation", "updatePost");
	formData.append(
		"json",
		JSON.stringify({
			userId: userId,
			postId: postId,
			caption: caption,
		})
	);

	const response = await axios.post(`${apiUrl}/faculty.php`, formData);
	return response.data;
}
