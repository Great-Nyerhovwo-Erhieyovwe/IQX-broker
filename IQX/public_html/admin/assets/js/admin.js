// Use global supabase object (v2 library included in HTML)
const SUPABASE_URL = 'https://aqotnpbcrqaiqonpfshj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxb3RucGJjcnFhaXFvbnBmc2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MDUwNDMsImV4cCI6MjA3NTQ4MTA0M30.rqwwCxMp2PBydSE99QJOL-nt1UjxkI7-ea0Q8Wk5SVI';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM Elements
const loginBtn = document.getElementById("adminLoginBtn");
const emailInput = document.getElementById("adminEmail");
const passwordInput = document.getElementById("adminPassword");
const statusMsg = document.getElementById("adminLoginMsg");

// Login click handler
loginBtn.addEventListener("click", async () => {
  statusMsg.textContent = "";
  statusMsg.style.color = "black";

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    statusMsg.textContent = "Please enter both email and password.";
    statusMsg.style.color = "red";
    return;
  }

  loginBtn.disabled = true;
  loginBtn.textContent = "Logging in...";

  try {
    // 1️⃣ Sign in with Supabase
    const { data: userData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError || !userData.user) {
      throw signInError || new Error("Login failed");
    }

    // 2️⃣ Check if user exists in 'admins' table
    const { data: adminData, error: adminError } = await supabase
      .from("admins")
      .select("*")
      .eq("id", userData.user.id)
      .single();

    if (adminError || !adminData) {
      await supabase.auth.signOut();
      statusMsg.textContent = "You are not authorized as an admin.";
      statusMsg.style.color = "red";
      return;
    }

    // 3️⃣ Success → redirect
    window.location.href = "./admin-dashboard.html";

  } catch (err) {
    console.error("Login failed:", err);
    statusMsg.textContent = err.message || "Invalid email or password.";
    statusMsg.style.color = "red";
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = "Login";
  }
});