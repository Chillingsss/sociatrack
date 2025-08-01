import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import LoginPage from "./pages/Login";
import { initializeApiUrl } from "./utils/apiConfig";
import PrivateRoute from "./components/PrivateRoute";
import AdminDashboard from "./pages/admin/AdminDashboard";
import StudentDashboard from "./pages/student/StudentDashboard";
import FacultyDashboard from "./pages/faculty/FacultyDashboard";

function App() {
	// Initialize encrypted API URL in session storage when app starts
	useEffect(() => {
		initializeApiUrl();
	}, []);
	return (
		<Routes>
			<Route path="/sociatrack" element={<LoginPage />} />
			<Route
				path="/AdminDashboard"
				element={
					<PrivateRoute allowedRole="Admin">
						<AdminDashboard />
					</PrivateRoute>
				}
			/>
			<Route
				path="/StudentDashboard"
				element={
					<PrivateRoute allowedRole="Student">
						<StudentDashboard />
					</PrivateRoute>
				}
			/>
			<Route
				path="/FacultyDashboard"
				element={
					<PrivateRoute allowedRole="Faculty">
						<FacultyDashboard />
					</PrivateRoute>
				}
			/>
		</Routes>
	);
}

export default App;
