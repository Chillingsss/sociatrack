import React, { useState } from "react";
import { createPost } from "../utils/faculty";

export default function PostCreation({ userId, onPostCreated, profile }) {
	const [caption, setCaption] = useState("");
	const [selectedImages, setSelectedImages] = useState([]);
	const [imagePreviews, setImagePreviews] = useState([]);
	const [isPosting, setIsPosting] = useState(false);
	const [isExpanded, setIsExpanded] = useState(false);

	const handleImageChange = (e) => {
		if (e.target.files && e.target.files.length > 0) {
			const newFiles = Array.from(e.target.files);
			const newPreviews = newFiles.map((file) => URL.createObjectURL(file));

			setSelectedImages([...selectedImages, ...newFiles]);
			setImagePreviews([...imagePreviews, ...newPreviews]);
			setIsExpanded(true);
		}
	};

	const removeImage = (index) => {
		const newSelectedImages = selectedImages.filter((_, i) => i !== index);
		const newImagePreviews = imagePreviews.filter((_, i) => i !== index);

		setSelectedImages(newSelectedImages);
		setImagePreviews(newImagePreviews);

		// Clean up the object URL to prevent memory leaks
		URL.revokeObjectURL(imagePreviews[index]);
	};

	const handlePost = async (e) => {
		e.preventDefault();
		if (!caption.trim() && !selectedImages.length) return;

		setIsPosting(true);
		try {
			const result = await createPost(userId, caption, selectedImages);
			console.log("New post created:", result);

			// Reset form
			setCaption("");
			setSelectedImages([]);
			setImagePreviews([]);
			setIsExpanded(false);

			// Clean up object URLs
			imagePreviews.forEach((preview) => URL.revokeObjectURL(preview));

			if (onPostCreated) {
				onPostCreated();
			}
		} catch (error) {
			console.error("Error creating post:", error);
		} finally {
			setIsPosting(false);
		}
	};

	const handleTextareaClick = () => {
		setIsExpanded(true);
	};

	const handleCancel = () => {
		setCaption("");
		setSelectedImages([]);
		imagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
		setImagePreviews([]);
		setIsExpanded(false);
	};

	return (
		<div className="p-4 mb-6 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm dark:bg-gray-800 dark:border-gray-700">
			<form onSubmit={handlePost}>
				{/* Header with Avatar */}
				<div className="flex items-center mb-4">
					<img
						src={
							profile?.user_avatar ||
							`https://ui-avatars.com/api/?name=${encodeURIComponent(
								(profile?.user_firstname || "") +
									" " +
									(profile?.user_lastname || "User")
							)}&size=40&background=6366f1&color=ffffff`
						}
						alt="Your avatar"
						className="mr-3 w-10 h-10 rounded-full border-2 border-gray-200 dark:border-gray-600"
					/>
					<div className="flex-1">
						<textarea
							className={`w-full p-3 text-gray-900 bg-gray-50 rounded-2xl border-0 resize-none placeholder-gray-500 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-200 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 dark:focus:bg-gray-600 dark:focus:ring-blue-400 ${
								isExpanded ? "min-h-[100px]" : "min-h-[50px]"
							}`}
							placeholder={`What's on your mind${
								profile?.user_firstname ? ", " + profile.user_firstname : ""
							}?`}
							value={caption}
							onChange={(e) => setCaption(e.target.value)}
							onClick={handleTextareaClick}
							rows={isExpanded ? 4 : 2}
						/>
					</div>
				</div>

				{/* Image Previews */}
				{imagePreviews.length > 0 && (
					<div className="mb-4">
						<div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-xl sm:grid-cols-3 md:grid-cols-4 dark:bg-gray-700">
							{imagePreviews.map((preview, index) => (
								<div key={index} className="relative group">
									<img
										src={preview}
										alt={`Preview ${index + 1}`}
										className="object-cover w-full h-24 rounded-lg border border-gray-200 dark:border-gray-600"
									/>
									<button
										type="button"
										onClick={() => removeImage(index)}
										className="flex absolute -top-2 -right-2 justify-center items-center w-6 h-6 text-sm font-bold text-white bg-red-500 rounded-full shadow-lg opacity-0 transition-opacity duration-200 group-hover:opacity-100 hover:bg-red-600"
										title="Remove image"
									>
										×
									</button>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Action Buttons */}
				<div
					className={`transition-all duration-300 ${
						isExpanded
							? "max-h-20 opacity-100"
							: "overflow-hidden max-h-0 opacity-0"
					}`}
				>
					<div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-gray-600">
						<div className="flex items-center space-x-4">
							{/* Photo Upload */}
							<label className="flex items-center px-4 py-2 space-x-2 text-gray-600 rounded-lg transition-colors duration-200 cursor-pointer hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700">
								<svg
									className="w-5 h-5 text-green-500"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
									/>
								</svg>
								<span className="text-sm font-medium">Photo</span>
								<input
									type="file"
									accept="image/*"
									className="hidden"
									onChange={handleImageChange}
									multiple
								/>
							</label>

							{/* Video Upload (placeholder for future) */}
							{/* <button
								type="button"
								className="flex items-center px-4 py-2 space-x-2 text-gray-600 rounded-lg transition-colors duration-200 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
								disabled
							>
								<svg
									className="w-5 h-5 text-blue-500"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
									/>
								</svg>
								<span className="text-sm font-medium opacity-50">Video</span>
							</button> */}

							{/* Feeling/Activity (placeholder for future) */}
							{/* <button
								type="button"
								className="flex items-center px-4 py-2 space-x-2 text-gray-600 rounded-lg transition-colors duration-200 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
								disabled
							>
								<svg
									className="w-5 h-5 text-yellow-500"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
								<span className="text-sm font-medium opacity-50">Feeling</span>
							</button> */}
						</div>

						{/* Post Actions */}
						<div className="flex items-center space-x-3">
							{isExpanded && (
								<button
									type="button"
									onClick={handleCancel}
									className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg transition-colors duration-200 hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
								>
									Cancel
								</button>
							)}
							<button
								type="submit"
								disabled={
									isPosting || (!caption.trim() && !selectedImages.length)
								}
								className={`px-6 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
									isPosting || (!caption.trim() && !selectedImages.length)
										? "bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400"
										: "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 dark:bg-blue-500 dark:hover:bg-blue-600"
								}`}
							>
								{isPosting ? (
									<div className="flex items-center space-x-2">
										<svg
											className="w-4 h-4 animate-spin"
											fill="none"
											viewBox="0 0 24 24"
										>
											<circle
												className="opacity-25"
												cx="12"
												cy="12"
												r="10"
												stroke="currentColor"
												strokeWidth="4"
											></circle>
											<path
												className="opacity-75"
												fill="currentColor"
												d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
											></path>
										</svg>
										<span>Posting...</span>
									</div>
								) : (
									"Post"
								)}
							</button>
						</div>
					</div>
				</div>

				{/* Simple action bar when not expanded */}
				{!isExpanded && (
					<div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-gray-600">
						<div className="flex items-center space-x-6">
							<label className="flex items-center space-x-2 text-gray-500 transition-colors duration-200 cursor-pointer hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400">
								<svg
									className="w-5 h-5"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
									/>
								</svg>
								<span className="text-sm font-medium">Photo</span>
								<input
									type="file"
									accept="image/*"
									className="hidden"
									onChange={handleImageChange}
									multiple
								/>
							</label>
							{/* <button
								type="button"
								className="flex items-center space-x-2 text-gray-500 transition-colors duration-200 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400"
								disabled
							>
								<svg
									className="w-5 h-5"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
									/>
								</svg>
								<span className="text-sm font-medium opacity-50">Video</span>
							</button>
							<button
								type="button"
								className="flex items-center space-x-2 text-gray-500 transition-colors duration-200 hover:text-yellow-500 dark:text-gray-400 dark:hover:text-yellow-400"
								disabled
							>
								<svg
									className="w-5 h-5"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
								<span className="text-sm font-medium opacity-50">Feeling</span>
							</button> */}
						</div>
					</div>
				)}
			</form>
		</div>
	);
}
