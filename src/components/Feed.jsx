import React, { useState } from "react";
import { getDecryptedApiUrl } from "../utils/apiConfig";

export default function Feed({ posts }) {
	const [selectedImage, setSelectedImage] = useState(null);
	const [currentImageIndex, setCurrentImageIndex] = useState(0);
	const [currentImageSet, setCurrentImageSet] = useState([]);

	const handleImageClick = (imageUrl, imageSet = null, imageIndex = 0) => {
		if (imageSet) {
			setCurrentImageSet(imageSet);
			setCurrentImageIndex(imageIndex);
		}
		setSelectedImage(imageUrl);
	};

	const closeImageModal = () => {
		setSelectedImage(null);
		setCurrentImageIndex(0);
		setCurrentImageSet([]);
	};

	const nextImage = () => {
		if (currentImageSet.length > 0) {
			const nextIndex = (currentImageIndex + 1) % currentImageSet.length;
			setCurrentImageIndex(nextIndex);
			setSelectedImage(currentImageSet[nextIndex]);
		}
	};

	const prevImage = () => {
		if (currentImageSet.length > 0) {
			const prevIndex =
				currentImageIndex === 0
					? currentImageSet.length - 1
					: currentImageIndex - 1;
			setCurrentImageIndex(prevIndex);
			setSelectedImage(currentImageSet[prevIndex]);
		}
	};

	const renderImages = (imageFiles) => {
		if (!imageFiles) return null;

		const images = imageFiles.split(",");
		const imageCount = images.length;
		const imageUrls = images.map(
			(img) => `${getDecryptedApiUrl()}/uploads/${img}`
		);

		if (imageCount === 1) {
			return (
				<img
					src={imageUrls[0]}
					alt="Post"
					className="w-full max-h-80 object-cover rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
					onClick={() => handleImageClick(imageUrls[0], imageUrls, 0)}
				/>
			);
		}

		if (imageCount === 2) {
			return (
				<div className="grid grid-cols-2 gap-2">
					{images.map((image, index) => (
						<img
							key={index}
							src={imageUrls[index]}
							alt={`Post ${index + 1}`}
							className="w-full h-40 object-cover rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
							onClick={() =>
								handleImageClick(imageUrls[index], imageUrls, index)
							}
						/>
					))}
				</div>
			);
		}

		if (imageCount === 3) {
			return (
				<div className="grid grid-cols-3 gap-2">
					{images.map((image, index) => (
						<img
							key={index}
							src={imageUrls[index]}
							alt={`Post ${index + 1}`}
							className="w-full h-32 object-cover rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
							onClick={() =>
								handleImageClick(imageUrls[index], imageUrls, index)
							}
						/>
					))}
				</div>
			);
		}

		if (imageCount === 4) {
			return (
				<div className="grid grid-cols-2 gap-2">
					{images.map((image, index) => (
						<img
							key={index}
							src={imageUrls[index]}
							alt={`Post ${index + 1}`}
							className="w-full h-32 object-cover rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
							onClick={() =>
								handleImageClick(imageUrls[index], imageUrls, index)
							}
						/>
					))}
				</div>
			);
		}

		// 5 or more images - Facebook style layout
		return (
			<div className="grid grid-cols-2 gap-2">
				{/* First 4 images */}
				{images.slice(0, 4).map((image, index) => (
					<img
						key={index}
						src={imageUrls[index]}
						alt={`Post ${index + 1}`}
						className="w-full h-32 object-cover rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
						onClick={() => handleImageClick(imageUrls[index], imageUrls, index)}
					/>
				))}
				{/* 5th image with overlay */}
				{imageCount >= 5 && (
					<div className="relative">
						<img
							src={imageUrls[4]}
							alt="Post 5"
							className="w-full h-32 object-cover rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
							onClick={() => handleImageClick(imageUrls[4], imageUrls, 4)}
						/>
						{imageCount > 5 && (
							<div
								className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg cursor-pointer hover:bg-opacity-60 transition-opacity"
								onClick={() => handleImageClick(imageUrls[4], imageUrls, 4)}
							>
								<span className="text-white font-bold text-lg">
									+{imageCount - 5}
								</span>
							</div>
						)}
					</div>
				)}
			</div>
		);
	};

	return (
		<>
			<div className="flex flex-col gap-6">
				{posts.map((post) => (
					<div
						key={post.post_id}
						className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5"
					>
						<div className="flex items-center mb-3">
							<img
								src={
									post.user_avatar ||
									`https://ui-avatars.com/api/?name=${encodeURIComponent(
										post.user_firstname + " " + post.user_lastname
									)}`
								}
								alt={post.user_firstname + " " + post.user_lastname}
								className="h-10 w-10 rounded-full mr-3"
							/>
							<div>
								<span className="font-semibold text-gray-800 dark:text-gray-100">
									{post.user_firstname + " " + post.user_lastname}
								</span>
								<div className="text-sm text-gray-500 dark:text-gray-400">
									{new Date(post.post_createdAt).toLocaleDateString()}
								</div>
							</div>
						</div>
						<p className="text-gray-900 dark:text-gray-100 mb-2">
							{post.post_caption}
						</p>
						{post.image_files && renderImages(post.image_files)}
					</div>
				))}
			</div>

			{/* Image Modal with Navigation */}
			{selectedImage && (
				<div
					className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
					onClick={closeImageModal}
				>
					<div className="relative max-w-4xl max-h-full">
						<img
							src={selectedImage}
							alt="Full size"
							className="max-w-full max-h-full object-contain"
							onClick={(e) => e.stopPropagation()}
						/>

						{/* Close button */}
						<button
							onClick={closeImageModal}
							className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75"
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

						{/* Navigation arrows - only show if multiple images */}
						{currentImageSet.length > 1 && (
							<>
								<button
									onClick={(e) => {
										e.stopPropagation();
										prevImage();
									}}
									className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75"
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
										nextImage();
									}}
									className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75"
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
							<div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-50 rounded-full px-3 py-1">
								{currentImageIndex + 1} / {currentImageSet.length}
							</div>
						)}
					</div>
				</div>
			)}
		</>
	);
}
