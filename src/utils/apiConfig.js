import CryptoJS from "crypto-js";

// Secret key for encryption - in production, this should be more secure
const SECRET_KEY = "sociatrac_api_secret_key";
const SESSION_KEY = "sociatrac_encrypted_api_url";
const FALLBACK_API_URL = "http://10.92.52.215/sociatrack/backend";

/**
 * Set the encrypted API URL in session storage
 * @param {string} apiUrl - The API URL to encrypt and store
 */
export const setEncryptedApiUrl = (apiUrl) => {
	try {
		const encrypted = CryptoJS.AES.encrypt(apiUrl, SECRET_KEY).toString();
		sessionStorage.setItem(SESSION_KEY, encrypted);
		console.log("API URL encrypted and stored in session storage");
	} catch (error) {
		console.error("Error encrypting API URL:", error);
	}
};

/**
 * Get the decrypted API URL from session storage
 * @returns {string} - The decrypted API URL or fallback URL if not found/invalid
 */
export const getDecryptedApiUrl = () => {
	try {
		// Check if sessionStorage is available
		if (typeof sessionStorage === "undefined") {
			console.warn("Session storage not available, using fallback API URL");
			return FALLBACK_API_URL;
		}

		const encrypted = sessionStorage.getItem(SESSION_KEY);
		if (!encrypted) {
			console.warn(
				"No encrypted API URL found in session storage, initializing..."
			);
			// Auto-initialize if not found
			setEncryptedApiUrl(FALLBACK_API_URL);
			return FALLBACK_API_URL;
		}

		const bytes = CryptoJS.AES.decrypt(encrypted, SECRET_KEY);
		const decrypted = bytes.toString(CryptoJS.enc.Utf8);

		if (!decrypted) {
			console.error("Failed to decrypt API URL, using fallback");
			// Re-initialize with fallback
			setEncryptedApiUrl(FALLBACK_API_URL);
			return FALLBACK_API_URL;
		}

		return decrypted;
	} catch (error) {
		console.error("Error decrypting API URL, using fallback:", error);
		return FALLBACK_API_URL;
	}
};

/**
 * Remove the encrypted API URL from session storage
 */
export const removeEncryptedApiUrl = () => {
	try {
		if (typeof sessionStorage !== "undefined") {
			sessionStorage.removeItem(SESSION_KEY);
			console.log("Encrypted API URL removed from session storage");
		}
	} catch (error) {
		console.error("Error removing encrypted API URL:", error);
	}
};

/**
 * Initialize the API URL in session storage (call this once when the app starts)
 */
export const initializeApiUrl = () => {
	try {
		// Only initialize if session storage is available and not already set
		if (typeof sessionStorage !== "undefined") {
			const existing = sessionStorage.getItem(SESSION_KEY);
			if (!existing) {
				setEncryptedApiUrl(FALLBACK_API_URL);
				console.log("API URL initialized in session storage");
			} else {
				// console.log("API URL already exists in session storage");
			}
		}
	} catch (error) {
		console.error("Error initializing API URL:", error);
	}
};
