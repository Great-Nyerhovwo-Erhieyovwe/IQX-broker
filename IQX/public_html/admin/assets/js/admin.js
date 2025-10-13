// assets/js/admin.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// Replace with your Supabase credentials
const SUPABASE_URL = 'https://aqotnpbcrqaiqonpfshj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxb3RucGJjcnFhaXFvbnBmc2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MDUwNDMsImV4cCI6MjA3NTQ4MTA0M30.rqwwCxMp2PBydSE99QJOL-nt1UjxkI7-ea0Q8Wk5SVI';


const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM Elements
const loginForm = document.getElementById("adminLoginForm");
const emailInput = document.getElementById("adminEmail");
const passwordInput = document.getElementById("adminPassword");
const errorDiv = document.getElementById("adminLoginError");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorDiv.textContent = "";

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    errorDiv.textContent = "Please enter both email and password.";
    return;
  }

  const submitButton = loginForm.querySelector("button[type='submit']");
  submitButton.disabled = true;
  submitButton.textContent = "Logging in...";

  try {
    // Sign in with Supabase
    const { data: user, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInError || !user) {
      throw signInError || new Error("Login failed");
    }

    // Check if user is admin (assuming you have a 'role' column)
    const { data: adminData, error: adminError } = await supabase
      .from("users")  // or "admins" table if you separate
      .select("*")
      .eq("id", user.user.id)
      .eq("role", "admin")
      .single();

    if (adminError || !adminData) {
      await supabase.auth.signOut();
      errorDiv.textContent = "You are not authorized as an admin.";
      return;
    }

    // ✅ Redirect to admin dashboard
    window.location.href = "./admin-dashboard.html";

  } catch (error) {
    console.error("Login failed:", error);
    errorDiv.textContent = "Invalid email or password.";
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Login";
  }
});