import React, { useState, useEffect, useRef } from "react";
import {
	getProfile,
	getPostsWithUserReactions,
	getPosts,
} from "../../utils/faculty";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import CryptoJS from "crypto-js";
import Feed from "../../components/Feed";
import AvatarDropdown from "../../components/AvatarDropdown";
import RefreshButton from "../../components/RefreshButton";
import PostCreation from "../../components/PostCreation";
import FacultyAttendanceModal from "../../components/FacultyAttendanceModal";

export default function FacultyDashboard() {
	const [posts, setPosts] = useState([]);
	const [profile, setProfile] = useState(null);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
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

	// Fetch posts from database with user reactions
	const fetchPosts = () => {
		if (userId) {
			getPostsWithUserReactions(userId)
				.then((postsData) => {
					console.log("Posts data received:", postsData);
					setPosts(postsData);
				})
				.catch((error) => {
					console.error("Error fetching posts:", error);
					setPosts([]);
				});
		} else {
			// Fallback to regular getPosts if no userId
			getPosts()
				.then((postsData) => {
					console.log("Posts data received:", postsData);
					setPosts(postsData);
				})
				.catch((error) => {
					console.error("Error fetching posts:", error);
					setPosts([]);
				});
		}
	};

	useEffect(() => {
		fetchPosts();
	}, [userId]);

	useEffect(() => {
		function handleClickOutside(event) {
			if (
				mobileMenuRef.current &&
				!mobileMenuRef.current.contains(event.target)
			) {
				setMobileMenuOpen(false);
			}
		}
		if (mobileMenuOpen) {
			document.addEventListener("mousedown", handleClickOutside);
			return () =>
				document.removeEventListener("mousedown", handleClickOutside);
		}
	}, [mobileMenuOpen]);

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

	const handleRefresh = () => {
		// Refresh posts
		fetchPosts();

		// Refresh profile data
		if (userId) {
			getProfile(userId)
				.then((profileData) => {
					setProfile(profileData);
				})
				.catch((error) => {
					console.error("Error fetching profile:", error);
					setProfile(null);
				});
		}
	};

	const handleAttendanceClick = () => {
		setAttendanceModalOpen(true);
		setMobileMenuOpen(false); // Close mobile menu if open
	};

	return (
		<div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900">
			{/* Top Bar with Avatar and Mobile Menu */}
			<div className="flex sticky top-0 z-40 justify-between items-center px-4 py-2 w-full bg-gray-100 dark:bg-gray-900 md:px-8">
				{/* Left side - Menu button and Logo on mobile */}
				<div className="flex gap-4 items-center md:hidden">
					{/* Mobile Menu Button */}
					<button
						onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
						className="flex items-center p-2 bg-gray-100 rounded-lg shadow dark:bg-gray-700"
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

					{/* Logo - Mobile */}
					<div className="flex items-center">
						<img
							src="/images/cocLogo.png"
							alt="CITE Logo"
							className="w-auto h-10"
						/>
					</div>
				</div>

				{/* Logo - Desktop */}
				<div className="hidden items-center md:flex">
					<img
						src="/images/cocLogo.png"
						alt="CITE Logo"
						className="w-auto h-16"
					/>
				</div>

				{/* Right side - Refresh button and Avatar */}
				<div className="flex gap-3 items-center">
					{/* Refresh Button */}
					<RefreshButton onRefresh={handleRefresh} />

					{/* Avatar Dropdown */}
					<AvatarDropdown
						profile={profile}
						onLogout={handleLogout}
						userRole="Faculty"
					/>
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
						<button
							onClick={handleAttendanceClick}
							className="px-4 py-3 w-full font-semibold text-white bg-green-600 rounded-lg transition-colors duration-200 hover:bg-green-700"
						>
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
				<aside className="hidden flex-col p-4 mt-4 w-64 bg-white rounded-2xl shadow md:flex dark:bg-gray-800 sticky top-20 h-fit max-h-[calc(100vh-6rem)] overflow-y-auto">
					<h2 className="mb-4 text-xl font-bold text-gray-700 dark:text-gray-200">
						Menu
					</h2>
					<button
						onClick={handleAttendanceClick}
						className="py-2 mb-2 w-full font-semibold text-white bg-green-600 rounded-lg transition hover:bg-green-700"
					>
						Attendance
					</button>
					<button className="py-2 w-full font-semibold text-white bg-blue-600 rounded-lg transition hover:bg-blue-700">
						Tally
					</button>
				</aside>

				{/* Main Feed */}
				<main className="flex-1 mx-auto max-w-2xl">
					{/* Post Creation */}
					<PostCreation
						userId={userId}
						onPostCreated={fetchPosts}
						profile={profile}
					/>

					{/* Feed */}
					<Feed posts={posts} userId={userId} onReactionUpdate={fetchPosts} />
				</main>

				{/* Right Sidebar */}
				<aside className="hidden flex-col p-4 mt-4 w-64 bg-white rounded-2xl shadow lg:flex dark:bg-gray-800 sticky top-20 h-fit max-h-[calc(100vh-6rem)] overflow-y-auto">
					<h2 className="mb-4 text-xl font-bold text-gray-700 dark:text-gray-200">
						Contacts
					</h2>
					<div className="text-gray-500 dark:text-gray-400">
						(Placeholder for contacts or context)
					</div>
				</aside>
			</div>

			{/* Faculty Attendance Modal */}
			<FacultyAttendanceModal
				isOpen={attendanceModalOpen}
				onClose={() => setAttendanceModalOpen(false)}
				facultyId={userId}
				facultyProfile={profile}
			/>
		</div>
	);
}
