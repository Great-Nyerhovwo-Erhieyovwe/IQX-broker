// assets/js/admin.js

// Using json-server locally for admin auth/authorization
const API_BASE = 'http://localhost:3000';
const TOKEN_KEY = 'iqxAdminToken';

// --- DOM Elements ---
const adminEmailInput = document.getElementById('adminEmail');
const adminPasswordInput = document.getElementById('adminPassword');
const adminLoginBtn = document.getElementById('adminLoginBtn');
const adminLoginMsg = document.getElementById('adminLoginMsg');
const adminLoginForm = document.getElementById('adminLoginForm');


// --- Utility Function ---
/** Displays a status message to the user using the .status-msg element. */
function showMessage(msg, type = 'error') {
    if (!adminLoginMsg) return;

    adminLoginMsg.textContent = msg;
    // Clears existing status classes and adds the new one for styling
    adminLoginMsg.classList.remove('success', 'error');
    adminLoginMsg.classList.add(type);
}

/** * Checks if the current user has an active session and is listed as an admin.
 * This function prevents the infinite redirect loop on the login page.
 */
async function checkAuthAndRedirect() {
    // Check for existing fake token saved in local/session storage
    const token = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
    if (!token) {
        if (adminLoginBtn) { adminLoginBtn.disabled = false; adminLoginBtn.textContent = 'Login'; }
        return;
    }

    const m = token.match(/^fake-jwt-(\d+)$/);
    if (!m) {
        localStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(TOKEN_KEY);
        if (adminLoginBtn) { adminLoginBtn.disabled = false; adminLoginBtn.textContent = 'Login'; }
        return;
    }

    const id = m[1];
    try {
        const res = await fetch(`${API_BASE}/admins?userId=${encodeURIComponent(id)}`);
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
            // Admin exists — redirect to dashboard
            window.location.href = "./Admin-Dashboard/dashboard.html";
            return;
        } else {
            // Not an admin: clear token and show message
            localStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(TOKEN_KEY);
            showMessage('Unauthorized user signed out. Please use admin credentials.', 'error');
        }
    } catch (e) {
        console.error('Auth check failed:', e);
        showMessage('An error occurred during authentication check.', 'error');
    }

    if (adminLoginBtn) { adminLoginBtn.disabled = false; adminLoginBtn.textContent = 'Login'; }
}

/** Handles the admin login process when the button or form is submitted. */
async function handleAdminLogin() {
    // Basic input validation
    if (!adminEmailInput.value || !adminPasswordInput.value) {
        showMessage('Please enter both email and password.', 'error');
        return;
    }

    adminLoginBtn.disabled = true;
    adminLoginBtn.textContent = 'Logging In...';
    showMessage(''); // Clear previous messages

    const email = adminEmailInput.value;
    const password = adminPasswordInput.value;

    try {
        // 1. Query json-server users resource for matching credentials
        const q = `email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
        const res = await fetch(`${API_BASE}/users?${q}`);
        const users = await res.json();
        if (!Array.isArray(users) || users.length === 0) {
            showMessage('Login failed: Invalid email or password.', 'error');
            return;
        }
        const user = users[0];

        // 2. Verify admin membership in /admins by userId
        const adminRes = await fetch(`${API_BASE}/admins?userId=${encodeURIComponent(user.id)}`);
        const adminData = await adminRes.json();
        if (!Array.isArray(adminData) || adminData.length === 0) {
            showMessage('Unauthorized user. You are not an admin.', 'error');
            return;
        }

        // 3. Successful admin login — store fake token and redirect
        const token = `fake-jwt-${user.id}`;
        localStorage.setItem(TOKEN_KEY, token);
        // Optional: store minimal admin info
        localStorage.setItem('iqxAdminUser', JSON.stringify({ id: user.id, email: user.email }));
        window.location.href = "./Admin-Dashboard/dashboard.html";

    } catch (e) {
        console.error("Login process error:", e);
        showMessage('An unexpected error occurred during login.', 'error');
    } finally {
        // Re-enable button if redirect didn't happen (i.e., login failed or unauthorized)
        // Check window.location to ensure we don't accidentally re-enable after a successful redirect
        if (window.location.pathname.endsWith('admin-login.html') || window.location.pathname.endsWith('admin.html')) {
            adminLoginBtn.disabled = false;
            adminLoginBtn.textContent = 'Login';
        }
    }
}

// --- Event Listeners ---
if (adminLoginBtn) {
    adminLoginBtn.addEventListener('click', handleAdminLogin);
}

// Listen for Enter key press on the form (since the button is type="button")
if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleAdminLogin();
    });
}

// --- Initialization ---
// Run the check to see if the user is already logged in as an admin
checkAuthAndRedirect();
