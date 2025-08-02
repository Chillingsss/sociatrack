import React, { useState, useEffect, useRef } from "react";
import {
	getProfile,
	getPostsWithUserReactions,
	getPosts,
} from "../../utils/sbo";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import CryptoJS from "crypto-js";
import Feed from "../../components/Feed";
import AvatarDropdown from "../../components/AvatarDropdown";
import RefreshButton from "../../components/RefreshButton";
import PostCreation from "../../components/PostCreation";
import SboAttendanceModal from "../../components/SboAttendanceModal";
import ThemeToggle from "../../components/ThemeToggle";

export default function SboDashboard() {
	const [posts, setPosts] = useState([]);
	const [profile, setProfile] = useState(null);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
	const mobileMenuRef = useRef(null);
	const navigate = useNavigate();

	const COOKIE_KEY = "cite_user";
	const SECRET_KEY = "cite_secret_key";

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
			getProfile(userId)
				.then((profileData) => {
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
		fetchPosts();

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
		setMobileMenuOpen(false);
	};

	return (
		<div className="flex flex-col min-h-screen bg-gray-200 dark:bg-gray-900">
			{/* Top Bar with Avatar and Mobile Menu */}
			<div className="flex sticky top-0 z-40 justify-between items-center px-4 py-2 w-full bg-gray-200 dark:bg-gray-900 md:px-8">
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
					{/* Theme Toggle */}
					<ThemeToggle />

					{/* Refresh Button */}
					<RefreshButton onRefresh={handleRefresh} />

					{/* Avatar Dropdown */}
					<AvatarDropdown
						profile={profile}
						onLogout={handleLogout}
						userRole="SBO Officer"
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
					className={`fixed left-0 top-0 h-full w-64 bg-gray-50 dark:bg-gray-800 shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${
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
							className="flex gap-3 items-center px-4 py-3 w-full text-left text-gray-700 bg-gray-50 rounded-xl transition-all duration-200 dark:text-gray-300 dark:bg-gray-700/50 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-900/20 dark:hover:text-green-300"
						>
							<div className="p-2 bg-green-100 rounded-lg dark:bg-green-900/30">
								<svg
									className="w-4 h-4 text-green-600 dark:text-green-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
									/>
								</svg>
							</div>
							<span className="font-medium">Attendance</span>
						</button>
						<button className="flex gap-3 items-center px-4 py-3 w-full text-left text-gray-700 bg-gray-50 rounded-xl transition-all duration-200 dark:text-gray-300 dark:bg-gray-700/50 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/20 dark:hover:text-blue-300">
							<div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/30">
								<svg
									className="w-4 h-4 text-blue-600 dark:text-blue-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
									/>
								</svg>
							</div>
							<span className="font-medium">Tally</span>
						</button>
					</div>
				</div>
			</div>

			<div className="flex flex-1 gap-6 px-2 py-4 mx-auto w-full max-w-7xl">
				{/* Left Sidebar */}
				<aside className="hidden flex-col p-6 mt-4 w-64 bg-gray-50 rounded-2xl shadow-sm border border-gray-200 md:flex dark:bg-gray-800 dark:border-gray-700 sticky top-20 h-fit max-h-[calc(100vh-6rem)] overflow-y-auto">
					<div className="mb-6">
						<h2 className="mb-1 text-lg font-semibold text-gray-800 dark:text-gray-200">
							Quick Actions
						</h2>
						<p className="text-sm text-gray-500 dark:text-gray-400">
							Manage your activities
						</p>
					</div>
					<div className="space-y-3">
						<button
							onClick={handleAttendanceClick}
							className="flex gap-3 items-center px-4 py-3 w-full text-left text-gray-700 bg-gray-50 rounded-xl transition-all duration-200 dark:text-gray-300 dark:bg-gray-700/50 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-900/20 dark:hover:text-green-300 group"
						>
							<div className="p-2 bg-green-100 rounded-lg transition-colors duration-200 dark:bg-green-900/30 group-hover:bg-green-200 dark:group-hover:bg-green-900/50">
								<svg
									className="w-4 h-4 text-green-600 dark:text-green-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
									/>
								</svg>
							</div>
							<div>
								<div className="font-medium">Attendance</div>
								<div className="text-xs text-gray-500 dark:text-gray-400">
									Manage tribe attendance
								</div>
							</div>
						</button>
						<button className="flex gap-3 items-center px-4 py-3 w-full text-left text-gray-700 bg-gray-50 rounded-xl transition-all duration-200 dark:text-gray-300 dark:bg-gray-700/50 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/20 dark:hover:text-blue-300 group">
							<div className="p-2 bg-blue-100 rounded-lg transition-colors duration-200 dark:bg-blue-900/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50">
								<svg
									className="w-4 h-4 text-blue-600 dark:text-blue-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
									/>
								</svg>
							</div>
							<div>
								<div className="font-medium">Tally</div>
								<div className="text-xs text-gray-500 dark:text-gray-400">
									View statistics
								</div>
							</div>
						</button>
					</div>
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
				<aside className="hidden flex-col p-6 mt-4 w-64 bg-gray-50 rounded-2xl shadow-sm border border-gray-200 lg:flex dark:bg-gray-800 dark:border-gray-700 sticky top-20 h-fit max-h-[calc(100vh-6rem)] overflow-y-auto">
					<div className="mb-6">
						<h2 className="mb-1 text-lg font-semibold text-gray-800 dark:text-gray-200">
							Community
						</h2>
						<p className="text-sm text-gray-500 dark:text-gray-400">
							Connect with colleagues
						</p>
					</div>
					<div className="space-y-4">
						<div className="p-4 bg-gray-50 rounded-xl dark:bg-gray-700/50">
							<div className="flex gap-3 items-center mb-3">
								<div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/30">
									<svg
										className="w-4 h-4 text-blue-600 dark:text-blue-400"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
										/>
									</svg>
								</div>
								<h3 className="font-medium text-gray-800 dark:text-gray-200">
									Active SBO Officers
								</h3>
							</div>
							<p className="text-sm text-gray-600 dark:text-gray-400">
								SBO Officers will appear here when they join conversations
							</p>
						</div>
						<div className="p-4 bg-gray-50 rounded-xl dark:bg-gray-700/50">
							<div className="flex gap-3 items-center mb-3">
								<div className="p-2 bg-green-100 rounded-lg dark:bg-green-900/30">
									<svg
										className="w-4 h-4 text-green-600 dark:text-green-400"
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
								</div>
								<h3 className="font-medium text-gray-800 dark:text-gray-200">
									Recent Activity
								</h3>
							</div>
							<p className="text-sm text-gray-600 dark:text-gray-400">
								Stay updated with the latest community interactions
							</p>
						</div>
					</div>
				</aside>
			</div>

			{/* SBO Attendance Modal */}
			<SboAttendanceModal
				isOpen={attendanceModalOpen}
				onClose={() => setAttendanceModalOpen(false)}
				sboId={userId}
				sboProfile={profile}
			/>
		</div>
	);
}
