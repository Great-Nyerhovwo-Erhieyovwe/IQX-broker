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

// Login form submit
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
    // 1️⃣ Sign in with Supabase
    const { data: userData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInError || !userData || !userData.user) {
      throw signInError || new Error("Login failed");
    }

    // 2️⃣ Check if user exists in the admins table
    const { data: adminData, error: adminError } = await supabase
      .from("admins")
      .select("*")
      .eq("id", userData.user.id)
      .single();

    if (adminError || !adminData) {
      // Not an admin → sign out and show error
      await supabase.auth.signOut();
      errorDiv.textContent = "You are not authorized as an admin.";
      return;
    }

    // 3️⃣ Redirect to admin dashboard
    window.location.href = "./admin-dashboard.html";

  } catch (error) {
    console.error("Login failed:", error);
    errorDiv.textContent = "Invalid email or password.";
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Login";
  }
});