import React, { useRef, useState, useEffect } from "react";
import { getDecryptedApiUrl } from "../utils/apiConfig";
import { getComments, addComment, formatTimeAgo } from "../utils/student";

export default function ImageModal({
	selectedImage,
	selectedPost,
	currentImageIndex,
	currentImageSet,
	zoomLevel,
	onClose,
	onPrevImage,
	onNextImage,
	onZoomIn,
	onZoomOut,
	onResetZoom,
	userId, // Add userId prop
	onCommentAdded, // Add callback for when comment is added
}) {
	const [comments, setComments] = useState([]);
	const [loading, setLoading] = useState(false);
	const [commentText, setCommentText] = useState("");
	const [submitting, setSubmitting] = useState(false);

	// Fetch comments when selectedPost changes
	useEffect(() => {
		if (selectedPost && selectedPost.post_id) {
			const fetchComments = async () => {
				setLoading(true);
				try {
					const result = await getComments(selectedPost.post_id);
					if (result.success) {
						setComments(result.comments);
					}
				} catch (error) {
					console.error("Error fetching comments:", error);
				} finally {
					setLoading(false);
				}
			};
			fetchComments();
		}
	}, [selectedPost]);

	const handleSubmitComment = async (e) => {
		e.preventDefault();

		if (!commentText.trim() || !userId || !selectedPost) {
			return;
		}

		setSubmitting(true);

		try {
			const result = await addComment(
				userId,
				selectedPost.post_id,
				commentText.trim()
			);

			if (result.success) {
				// Clear the input
				setCommentText("");

				// Refresh comments
				const updatedComments = await getComments(selectedPost.post_id);
				if (updatedComments.success) {
					setComments(updatedComments.comments);
				}

				// Notify parent component if callback provided
				if (onCommentAdded) {
					onCommentAdded(selectedPost.post_id);
				}
			} else {
				console.error("Failed to add comment:", result.message);
				// You could add a toast notification here
			}
		} catch (error) {
			console.error("Error submitting comment:", error);
		} finally {
			setSubmitting(false);
		}
	};

	if (!selectedPost) return null;

	return (
		<div className="flex fixed inset-0 z-50 justify-center items-center p-4 bg-black bg-opacity-75">
			<div className="flex overflow-hidden flex-col max-w-6xl max-h-full bg-white rounded-lg md:flex-row dark:bg-gray-800">
				{/* Image section - Only show if there's an image */}
				{selectedImage && (
					<div className="flex relative flex-1 justify-center items-start min-h-0 max-h-[50vh] md:max-h-full overflow-y-auto">
						<img
							src={selectedImage}
							alt="Full size"
							className="object-contain w-full max-w-full transition-transform duration-200"
							style={{ transform: `scale(${zoomLevel})` }}
						/>

						{/* Close button */}
						<button
							onClick={onClose}
							className="absolute top-4 right-4 z-10 p-2 text-white bg-black bg-opacity-50 rounded-full hover:bg-opacity-75"
						>
							<svg
								className="w-6 h-6"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>

						{/* Zoom controls */}
						<div className="flex absolute top-4 left-4 z-10 gap-2">
							<button
								onClick={onZoomIn}
								className="p-2 text-white bg-black bg-opacity-50 rounded-full hover:bg-opacity-75"
								title="Zoom In"
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
										d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"
									/>
								</svg>
							</button>
							<button
								onClick={onZoomOut}
								className="p-2 text-white bg-black bg-opacity-50 rounded-full hover:bg-opacity-75"
								title="Zoom Out"
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
										d="M5 12h14"
									/>
								</svg>
							</button>
							<button
								onClick={onResetZoom}
								className="p-2 text-white bg-black bg-opacity-50 rounded-full hover:bg-opacity-75"
								title="Reset Zoom"
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
										d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
									/>
								</svg>
							</button>
						</div>

						{/* Navigation arrows - only show if multiple images */}
						{currentImageSet.length > 1 && (
							<>
								<button
									onClick={onPrevImage}
									className="absolute left-4 top-1/2 z-10 p-2 text-white bg-black bg-opacity-50 rounded-full transform -translate-y-1/2 hover:bg-opacity-75"
								>
									<svg
										className="w-6 h-6"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M15 19l-7-7 7-7"
										/>
									</svg>
								</button>
								<button
									onClick={onNextImage}
									className="absolute right-4 top-1/2 z-10 p-2 text-white bg-black bg-opacity-50 rounded-full transform -translate-y-1/2 hover:bg-opacity-75"
								>
									<svg
										className="w-6 h-6"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M9 5l7 7-7 7"
										/>
									</svg>
								</button>
							</>
						)}

						{/* Image counter */}
						{currentImageSet.length > 1 && (
							<div className="absolute bottom-4 left-1/2 z-10 px-3 py-1 text-white bg-black bg-opacity-50 rounded-full transform -translate-x-1/2">
								{currentImageIndex + 1} / {currentImageSet.length}
							</div>
						)}

						{/* Zoom level indicator */}
						{zoomLevel !== 1 && (
							<div className="absolute right-4 bottom-4 z-10 px-3 py-1 text-white bg-black bg-opacity-50 rounded-full">
								{Math.round(zoomLevel * 100)}%
							</div>
						)}
					</div>
				)}

				{/* Post details section - Right side on desktop, full width when no image */}
				<div
					className={`flex flex-col ${
						selectedImage ? "w-full md:w-96" : "w-full max-w-2xl"
					} border-t md:border-l border-gray-200 dark:border-gray-700 min-h-[50vh] md:max-h-full`}
				>
					{/* Close button for comments-only modal */}
					{!selectedImage && (
						<button
							onClick={onClose}
							className="absolute top-4 right-4 z-10 p-2 text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 dark:text-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600"
						>
							<svg
								className="w-6 h-6"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
					)}

					{/* Header */}
					<div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
						<div className="flex items-center">
							<img
								src={
									selectedPost.user_avatar ||
									`https://ui-avatars.com/api/?name=${encodeURIComponent(
										selectedPost.user_firstname +
											" " +
											selectedPost.user_lastname
									)}`
								}
								alt={
									selectedPost.user_firstname + " " + selectedPost.user_lastname
								}
								className="mr-3 w-10 h-10 rounded-full"
							/>
							<div>
								<span className="font-semibold text-gray-800 dark:text-gray-100">
									{selectedPost.user_firstname +
										" " +
										selectedPost.user_lastname}
								</span>
								<div className="text-sm text-gray-500 dark:text-gray-400">
									{new Date(selectedPost.post_createdAt).toLocaleString(
										"en-PH",
										{
											timeZone: "Asia/Manila",
											year: "numeric",
											month: "long",
											day: "numeric",
											hour: "numeric",
											minute: "2-digit",
											hour12: true,
										}
									)}
								</div>
							</div>
						</div>
						{/* Caption */}
						{selectedPost.post_caption && (
							<div className="mt-3">
								<p className="text-sm leading-relaxed text-gray-900 dark:text-gray-100">
									{selectedPost.post_caption}
								</p>
							</div>
						)}
					</div>

					{/* Comments Section */}
					<div className="overflow-y-auto flex-1 min-h-0">
						<div className="p-4">
							<h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-100">
								Comments ({comments.length})
							</h3>

							{loading ? (
								<div className="flex justify-center items-center py-8">
									<div className="w-6 h-6 rounded-full border-2 border-blue-500 animate-spin border-t-transparent"></div>
								</div>
							) : comments.length > 0 ? (
								<div className="pb-4 space-y-4">
									{comments.map((comment) => (
										<div
											key={comment.comment_id}
											className="flex items-start space-x-3"
										>
											<img
												src={
													comment.user_avatar ||
													`https://ui-avatars.com/api/?name=${encodeURIComponent(
														comment.user_firstname + " " + comment.user_lastname
													)}&size=40`
												}
												alt={
													comment.user_firstname + " " + comment.user_lastname
												}
												className="flex-shrink-0 w-10 h-10 rounded-full"
											/>
											<div className="flex-1 px-4 py-3 bg-gray-100 rounded-xl dark:bg-gray-700">
												<div className="flex justify-between items-center mb-1">
													<span className="font-semibold text-gray-800 dark:text-gray-100">
														{comment.user_firstname +
															" " +
															comment.user_lastname}
													</span>
													<span className="text-xs text-gray-500 dark:text-gray-400">
														{formatTimeAgo(comment.comment_createdAt)}
													</span>
												</div>
												<p className="text-sm leading-relaxed text-gray-700 break-words dark:text-gray-300">
													{comment.comment_message}
												</p>
											</div>
										</div>
									))}
								</div>
							) : (
								<div className="py-8 text-center text-gray-500 dark:text-gray-400">
									<svg
										className="mx-auto mb-3 w-12 h-12 text-gray-400 dark:text-gray-500"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
										/>
									</svg>
									<p>No comments yet</p>
									<p className="mt-1 text-xs">Be the first to comment!</p>
								</div>
							)}
						</div>
					</div>

					{/* Footer - Comment input could go here */}
					<div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700">
						<form onSubmit={handleSubmitComment} className="flex items-center">
							<input
								type="text"
								value={commentText}
								onChange={(e) => setCommentText(e.target.value)}
								placeholder="Add a comment..."
								className="flex-1 p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
								disabled={submitting}
							/>
							<button
								type="submit"
								className="p-2 ml-2 text-blue-500 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/20"
								disabled={submitting}
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
										d="M14 5l7 7m0 0l-7 7m7-7H7"
									/>
								</svg>
							</button>
						</form>
					</div>
				</div>
			</div>
		</div>
	);
}
