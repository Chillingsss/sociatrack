import React, { useState, useEffect, useRef } from "react";
import { getProfile, getPosts, createPost } from "../../utils/faculty";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import CryptoJS from "crypto-js";
import { getDecryptedApiUrl } from "../../utils/apiConfig";
import Feed from "../../components/Feed";

export default function FacultyDashboard() {
	const [caption, setCaption] = useState("");
	const [selectedImages, setSelectedImages] = useState([]);
	const [imagePreviews, setImagePreviews] = useState([]);
	const [posts, setPosts] = useState([]);
	const [profile, setProfile] = useState(null);
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [isPosting, setIsPosting] = useState(false);
	const dropdownRef = useRef(null);
	const mobileMenuRef = useRef(null);
	const navigate = useNavigate();

	const COOKIE_KEY = "cite_user";
	const SECRET_KEY = "cite_secret_key"; // You can use a more secure key in production

	let userId = "";
	const encrypted = Cookies.get(COOKIE_KEY);
	if (encrypted) {
		try {
			const bytes = CryptoJS.AES.decrypt(encrypted, SECRET_KEY);
			const user = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
			userId = user?.user_id;
		} catch {}
	}

	useEffect(() => {
		if (userId) {
			// console.log("Fetching profile for userId:", userId);
			getProfile(userId)
				.then((profileData) => {
					// console.log("Profile data received:", profileData);
					setProfile(profileData);
				})
				.catch((error) => {
					console.error("Error fetching profile:", error);
					setProfile(null);
				});
		} else {
			console.log("No userId found");
		}
	}, [userId]);

	// Fetch posts from database
	useEffect(() => {
		getPosts()
			.then((postsData) => {
				console.log("Posts data received:", postsData);
				setPosts(postsData);
			})
			.catch((error) => {
				console.error("Error fetching posts:", error);
				setPosts([]);
			});
	}, []);

	useEffect(() => {
		function handleClickOutside(event) {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
				setDropdownOpen(false);
			}
			if (
				mobileMenuRef.current &&
				!mobileMenuRef.current.contains(event.target)
			) {
				setMobileMenuOpen(false);
			}
		}
		if (dropdownOpen || mobileMenuOpen) {
			document.addEventListener("mousedown", handleClickOutside);
			return () =>
				document.removeEventListener("mousedown", handleClickOutside);
		}
	}, [dropdownOpen, mobileMenuOpen]);

	const handleImageChange = (e) => {
		if (e.target.files && e.target.files.length > 0) {
			const newFiles = Array.from(e.target.files);
			const newPreviews = newFiles.map((file) => URL.createObjectURL(file));

			setSelectedImages([...selectedImages, ...newFiles]);
			setImagePreviews([...imagePreviews, ...newPreviews]);
		}
	};

	const removeImage = (index) => {
		const newSelectedImages = selectedImages.filter((_, i) => i !== index);
		const newImagePreviews = imagePreviews.filter((_, i) => i !== index);

		setSelectedImages(newSelectedImages);
		setImagePreviews(newImagePreviews);
	};

	const handlePost = (e) => {
		e.preventDefault();
		if (!caption && !selectedImages.length) return;
		setIsPosting(true);
		createPost(userId, caption, selectedImages)
			.then((result) => {
				console.log("New post created:", result);
				// Refresh posts after creating new post
				getPosts()
					.then((postsData) => {
						setPosts(postsData);
					})
					.catch((error) => {
						console.error("Error fetching posts:", error);
					});
				setCaption("");
				setSelectedImages([]);
				setImagePreviews([]);
			})
			.catch((error) => {
				console.error("Error creating post:", error);
			})
			.finally(() => {
				setIsPosting(false);
			});
	};

	const handleLogout = () => {
		// Clear all cookies
		Object.keys(
			document.cookie.split(";").reduce((acc, cookie) => {
				const eqPos = cookie.indexOf("=");
				const name =
					eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
				if (name) acc[name] = true;
				return acc;
			}, {})
		).forEach((name) => {
			document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
		});
		navigate("/sociatrack");
	};

	return (
		<div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900">
			{/* Top Bar with Avatar and Mobile Menu */}
			<div className="flex justify-between items-center px-4 py-4 w-full md:px-8">
				{/* Mobile Menu Button */}
				<button
					onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
					className="flex items-center p-2 bg-gray-100 rounded-lg shadow md:hidden dark:bg-gray-700"
				>
					<svg
						className="w-6 h-6 text-gray-600 dark:text-gray-300"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M4 6h16M4 12h16M4 18h16"
						/>
					</svg>
				</button>

				{/* Desktop Title - Hidden on mobile */}
				<h1 className="hidden text-xl font-bold text-gray-800 md:block dark:text-gray-200">
					Faculty Dashboard
				</h1>

				{/* Avatar - Always on the right */}
				<div className="relative" ref={dropdownRef}>
					<button
						onClick={() => setDropdownOpen((v) => !v)}
						className="flex items-center focus:outline-none"
					>
						<img
							src={
								profile?.avatar ||
								`https://ui-avatars.com/api/?name=${encodeURIComponent(
									profile?.user_firstname + " " + profile?.user_lastname ||
										"Faculty"
								)}`
							}
							alt="Avatar"
							className="w-10 h-10 rounded-full border-2 border-green-600 shadow"
						/>
					</button>
					{dropdownOpen && (
						<div className="absolute right-0 z-50 mt-2 w-40 bg-white rounded-lg shadow-lg dark:bg-gray-800">
							<div className="px-4 py-2 font-semibold text-gray-800 border-b dark:text-gray-100 dark:border-gray-700">
								{profile?.user_firstname + " " + profile?.user_lastname ||
									"Faculty"}
							</div>
							<button
								onClick={handleLogout}
								className="px-4 py-2 w-full text-left text-red-600 rounded-b-lg hover:bg-gray-100 dark:hover:bg-gray-700"
							>
								Logout
							</button>
						</div>
					)}
				</div>
			</div>

			{/* Mobile Menu Overlay */}
			<div
				className={`fixed inset-0 bg-black transition-opacity duration-300 z-40 md:hidden ${
					mobileMenuOpen ? "bg-opacity-50" : "bg-opacity-0 pointer-events-none"
				}`}
			>
				<div
					className={`fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-800 shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${
						mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
					}`}
					ref={mobileMenuRef}
				>
					<div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
						<h2 className="text-xl font-bold text-gray-700 dark:text-gray-200">
							Menu
						</h2>
						<button
							onClick={() => setMobileMenuOpen(false)}
							className="p-2 rounded-lg transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700"
						>
							<svg
								className="w-6 h-6 text-gray-600 dark:text-gray-300"
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
					</div>
					<div className="p-4 space-y-3">
						<button className="px-4 py-3 w-full font-semibold text-white bg-green-600 rounded-lg transition-colors duration-200 hover:bg-green-700">
							Attendance
						</button>
						<button className="px-4 py-3 w-full font-semibold text-white bg-blue-600 rounded-lg transition-colors duration-200 hover:bg-blue-700">
							Tally
						</button>
					</div>
				</div>
			</div>

			<div className="flex flex-1 gap-6 px-2 py-4 mx-auto w-full max-w-7xl">
				{/* Left Sidebar */}
				<aside className="hidden flex-col p-4 mt-4 w-64 bg-white rounded-2xl shadow md:flex dark:bg-gray-800 h-fit">
					<h2 className="mb-4 text-xl font-bold text-gray-700 dark:text-gray-200">
						Menu
					</h2>
					<button className="py-2 mb-2 w-full font-semibold text-white bg-green-600 rounded-lg transition hover:bg-green-700">
						Attendance
					</button>
					<button className="py-2 w-full font-semibold text-white bg-blue-600 rounded-lg transition hover:bg-blue-700">
						Tally
					</button>
				</aside>

				{/* Main Feed */}
				<main className="flex-1 mx-auto max-w-2xl">
					{/* Post Creation */}
					<div className="p-6 mb-6 bg-white rounded-2xl shadow dark:bg-gray-800">
						<form onSubmit={handlePost} className="flex flex-col gap-4">
							<textarea
								className="p-3 w-full text-gray-900 bg-gray-50 rounded-lg border border-gray-300 resize-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
								placeholder="What's on your mind?"
								value={caption}
								onChange={(e) => setCaption(e.target.value)}
								rows={2}
							/>
							<div className="flex gap-3 items-center">
								<label className="font-semibold text-blue-600 cursor-pointer dark:text-blue-400">
									<input
										type="file"
										accept="image/*"
										className="hidden"
										onChange={handleImageChange}
										multiple
									/>
									Upload Image
								</label>
								<div className="flex flex-wrap gap-2">
									{imagePreviews.map((preview, index) => (
										<div key={index} className="relative group">
											<img
												src={preview}
												alt={`Preview ${index + 1}`}
												className="object-cover w-12 h-12 rounded-lg border"
											/>
											<button
												type="button"
												onClick={() => removeImage(index)}
												className="absolute top-0 right-0 p-1 text-white bg-red-500 rounded-full opacity-0 transition-opacity duration-200 group-hover:opacity-100"
												title="Remove image"
											>
												<svg
													className="w-4 h-4"
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
										</div>
									))}
								</div>
								<button
									type="submit"
									className="px-4 py-2 ml-auto font-semibold text-white bg-green-600 rounded-lg transition hover:bg-green-700"
									disabled={isPosting}
								>
									{isPosting ? "Posting..." : "Post"}
								</button>
							</div>
						</form>
					</div>

					{/* Feed */}
					<Feed posts={posts} />
				</main>

				{/* Right Sidebar */}
				<aside className="hidden flex-col p-4 mt-4 w-64 bg-white rounded-2xl shadow lg:flex dark:bg-gray-800 h-fit">
					<h2 className="mb-4 text-xl font-bold text-gray-700 dark:text-gray-200">
						Contacts
					</h2>
					<div className="text-gray-500 dark:text-gray-400">
						(Placeholder for contacts or context)
					</div>
				</aside>
			</div>
		</div>
	);
}
