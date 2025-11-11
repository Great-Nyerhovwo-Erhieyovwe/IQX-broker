// assets/js/admin.js

// --- Supabase Configuration ---
// IMPORTANT: These keys must match the ones used in your main dashboard script.
const SUPABASE_URL = 'https://wreyaigjuecupzqysvfo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyZXlhaWdqdWVjdXB6cXlzdmZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NTA2MzMsImV4cCI6MjA3ODQyNjYzM30.9ZKL97aUU_z1-b79JZIYUKTORRCsPt0yjZhuGRV48uY';

// Initialize Supabase Client using the globally loaded library
const supabase = window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

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
    if (!supabase) {
        showMessage('Error: Supabase client not initialized.', 'error');
        return;
    }

    try {
        // Check for an existing session/user
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            // Check if the authenticated user ID is listed in the 'admins' table
            const { data: adminData } = await supabase
                .from("admins")
                .select("id")
                .eq("id", user.id)
                .single();

            if (adminData) {
                // SUCCESS: Admin logged in, redirect to dashboard
                window.location.href = "./Admin-Dashboard/dashboard.html";
                return; 
            } else {
                // User logged in but not an authorized admin. Sign them out.
                await supabase.auth.signOut();
                showMessage('Unauthorized user signed out. Please use admin credentials.', 'error');
            }
        }
    } catch (e) {
        console.error("Auth check failed:", e);
        showMessage('An error occurred during authentication check.', 'error');
    }

    // Enable the login button once the check is complete and no redirect occurred
    if (adminLoginBtn) {
        adminLoginBtn.disabled = false;
        adminLoginBtn.textContent = 'Login';
    }
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
        // 1. Attempt to sign in with email and password
        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            showMessage(`Login failed: ${error.message}`, 'error');
            return;
        }
        
        // 2. If sign-in is successful, check admin status and redirect
        await checkAuthAndRedirect();

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
