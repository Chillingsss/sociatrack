import React, { useState, useRef, useEffect } from "react";

export default function AvatarDropdown({
	profile,
	onLogout,
	userRole = "User",
}) {
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const dropdownRef = useRef(null);

	useEffect(() => {
		function handleClickOutside(event) {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
				setDropdownOpen(false);
			}
		}
		if (dropdownOpen) {
			document.addEventListener("mousedown", handleClickOutside);
			return () =>
				document.removeEventListener("mousedown", handleClickOutside);
		}
	}, [dropdownOpen]);

	const handleProfileClick = () => {
		// TODO: Implement profile functionality
		console.log("Profile clicked");
	};

	const handleSettingsClick = () => {
		// TODO: Implement settings functionality
		console.log("Settings clicked");
	};

	return (
		<div className="relative" ref={dropdownRef}>
			<button
				onClick={() => setDropdownOpen((v) => !v)}
				className="flex items-center transition-transform duration-200 focus:outline-none hover:scale-105"
			>
				<img
					src={
						profile?.avatar ||
						`https://ui-avatars.com/api/?name=${encodeURIComponent(
							profile?.user_firstname + " " + profile?.user_lastname || userRole
						)}`
					}
					alt="Avatar"
					className="w-10 h-10 rounded-full border-2 border-green-600 shadow-lg transition-shadow duration-200 hover:shadow-xl"
				/>
				<svg
					className={`ml-2 w-4 h-4 text-gray-600 dark:text-gray-300 transition-transform duration-200 ${
						dropdownOpen ? "rotate-180" : ""}`}
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M19 9l-7 7-7-7"
					/>
				</svg>
			</button>
			{dropdownOpen && (
				<div className="overflow-hidden absolute right-0 z-50 mt-3 w-64 bg-white rounded-xl border border-gray-200 shadow-2xl dark:bg-gray-800 dark:border-gray-700">
					{/* Profile Header */}
					<div className="p-4 bg-gradient-to-r from-green-500 to-green-600">
						<div className="flex items-center">
							<img
								src={
									profile?.avatar ||
									`https://ui-avatars.com/api/?name=${encodeURIComponent(
										profile?.user_firstname + " " + profile?.user_lastname ||
											userRole
									)}`
								}
								alt="Profile"
								className="w-12 h-12 rounded-full border-2 border-white shadow-lg"
							/>
							<div className="ml-3 text-white">
								<div className="text-sm font-semibold">
									{profile?.user_firstname + " " + profile?.user_lastname ||
										userRole}
								</div>
								<div className="text-xs opacity-90">{userRole}</div>
							</div>
						</div>
					</div>

					{/* Menu Items */}
					<div className="py-2">
						<button
							onClick={handleProfileClick}
							className="flex items-center px-4 py-3 w-full text-left text-gray-700 transition-colors duration-200 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
						>
							<svg
								className="mr-3 w-5 h-5 text-gray-500 dark:text-gray-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
								/>
							</svg>
							Profile
						</button>
						<button
							onClick={handleSettingsClick}
							className="flex items-center px-4 py-3 w-full text-left text-gray-700 transition-colors duration-200 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
						>
							<svg
								className="mr-3 w-5 h-5 text-gray-500 dark:text-gray-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
								/>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
								/>
							</svg>
							Settings
						</button>
						<div className="my-1 border-t border-gray-200 dark:border-gray-700"></div>
						<button
							onClick={onLogout}
							className="flex items-center px-4 py-3 w-full text-left text-red-600 transition-colors duration-200 hover:bg-red-50 dark:hover:bg-red-900/20"
						>
							<svg
								className="mr-3 w-5 h-5"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
								/>
							</svg>
							Logout
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
