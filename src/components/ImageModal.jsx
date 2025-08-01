import React, { useRef } from "react";
import { getDecryptedApiUrl } from "../utils/apiConfig";

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
}) {
	if (!selectedImage) return null;

	return (
		<div
			className="flex fixed inset-0 z-50 justify-center items-center p-4 bg-black bg-opacity-75"
			onClick={onClose}
		>
			<div className="flex overflow-hidden flex-col max-w-6xl max-h-full bg-white rounded-lg md:flex-row dark:bg-gray-800">
				{/* Image section - Full width on mobile, left side on desktop */}
				<div className="flex relative flex-1 justify-center items-start min-h-0 max-h-[70vh] md:max-h-full overflow-y-auto">
					<img
						src={selectedImage}
						alt="Full size"
						className="object-contain w-full max-w-full transition-transform duration-200"
						style={{ transform: `scale(${zoomLevel})` }}
						onClick={(e) => e.stopPropagation()}
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
							onClick={(e) => {
								e.stopPropagation();
								onZoomIn();
							}}
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
							onClick={(e) => {
								e.stopPropagation();
								onZoomOut();
							}}
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
							onClick={(e) => {
								e.stopPropagation();
								onResetZoom();
							}}
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
								onClick={(e) => {
									e.stopPropagation();
									onPrevImage();
								}}
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
								onClick={(e) => {
									e.stopPropagation();
									onNextImage();
								}}
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

				{/* Post details section - Below image on mobile, right side on desktop */}
				{selectedPost && (
					<div className="flex flex-col w-full md:w-80 border-t md:border-l border-gray-200 dark:border-gray-700 max-h-[30vh] md:max-h-full">
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
										selectedPost.user_firstname +
										" " +
										selectedPost.user_lastname
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
										{new Date(selectedPost.post_createdAt).toLocaleDateString()}
									</div>
								</div>
							</div>
						</div>

						{/* Caption */}
						<div className="overflow-y-auto flex-1 p-4">
							<p className="text-sm leading-relaxed text-gray-900 dark:text-gray-100">
								{selectedPost.post_caption}
							</p>
						</div>

						{/* Footer - Comment button only */}
						<div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700">
							<div className="flex justify-center items-center">
								<button className="flex items-center px-4 py-2 text-gray-500 rounded-lg transition-colors dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20">
									<svg
										className="mr-2 w-5 h-5"
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
									<span className="text-sm font-medium">Comment</span>
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
