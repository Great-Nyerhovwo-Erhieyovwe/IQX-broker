// login.js — Complete Supabase v2 version (Production Ready)
const SUPABASE_URL = 'https://wreyaigjuecupzqysvfo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyZXlhaWdqdWVjdXB6cXlzdmZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NTA2MzMsImV4cCI6MjA3ODQyNjYzM30.9ZKL97aUU_z1-b79JZIYUKTORRCsPt0yjZhuGRV48uY';

document.addEventListener('DOMContentLoaded', async () => {
  // --- Ensure Supabase loaded ---
  if (!window.supabase || !window.supabase.createClient) {
    console.error('Supabase library not loaded. Add this script in HTML head:');
    console.log('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>');
    return;
  }

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // --- DOM Elements ---
  const loginForm = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const togglePwd = document.getElementById('togglePwd');
  const forgotPasswordLink = document.getElementById('forgotPasswordLink');
  const rememberMeCheckbox = document.getElementById('remember-me');

  // Modal
  const modal = document.getElementById('modal');
  const modalTitle = document.getElementById('modalTitle');
  const modalMessage = document.getElementById('modalMessage');
  const modalIcon = document.getElementById('modalIcon');
  const modalSpinner = document.getElementById('modalSpinner');
  const closeModalBtn = document.getElementById('closeModal');

  // --- Password toggle ---
  if (togglePwd && passwordInput) {
    togglePwd.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      togglePwd.classList.toggle('fa-eye', !isPassword);
      togglePwd.classList.toggle('fa-eye-slash', isPassword);
    });
  }

  // --- Modal helper ---
  const showModal = (title = '', message = '', isError = true, showSpinner = false) => {
    if (modalTitle) modalTitle.textContent = title;
    if (modalMessage) modalMessage.textContent = message;

    if (modalIcon) {
      if (showSpinner) {
        modalIcon.style.display = 'none';
      } else {
        modalIcon.style.display = 'inline-block';
        modalIcon.className = isError ? 'fas fa-exclamation-circle' : 'fas fa-check-circle';
        modalIcon.style.color = isError ? 'red' : 'green';
      }
    }
    if (modalSpinner) modalSpinner.style.display = showSpinner ? 'block' : 'none';
    if (modal) modal.style.display = 'block';
  };

  if (closeModalBtn) closeModalBtn.addEventListener('click', () => (modal.style.display = 'none'));
  window.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });

  // --- Forgot Password ---
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', async e => {
      e.preventDefault();
      const email = emailInput.value.trim();
      if (!email) {
        showModal('Error', 'Please enter your email to reset password.', true);
        return;
      }

      showModal('Sending...', 'Sending password reset link...', false, true);
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + '/reset-password.html'
        });
        if (error) throw error;
        showModal('Success', `Password reset link sent to ${email}.`, false);
      } catch (err) {
        console.error(err);
        showModal('Error', err.message || 'Failed to send reset email.', true);
      }
    });
  }

  // --- Login Form Submission ---
  if (loginForm) {
    loginForm.addEventListener('submit', async e => {
      e.preventDefault();
      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();
      const rememberMe = rememberMeCheckbox?.checked ?? false;

      if (!email || !password) {
        showModal('Error', 'Email and password are required.', true);
        return;
      }

      showModal('Logging In...', 'Verifying credentials...', false, true);

      try {
        // ✅ Attempt sign in
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        const user = data?.user;
        const session = data?.session;

        if (!user) {
          showModal('Login Failed', 'Invalid email or password.', true);
          return;
        }

        // ✅ Save session
        if (rememberMe)
          localStorage.setItem('supabaseSession', JSON.stringify(session));
        else
          sessionStorage.setItem('supabaseSession', JSON.stringify(session));

        // ✅ Fetch user profile from "users" table
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) throw profileError;

        // --- If no profile found (edge case: auth user created but not in users table)
        if (!profile) {
          showModal('Incomplete Registration', 'No user profile found. Please register again.', true);
          await supabase.auth.signOut();
          return;
        }

        // --- If banned or frozen
        if (profile.is_banned) {
          showModal('Access Denied', 'Your account has been banned.', true);
          await supabase.auth.signOut();
          return;
        }

        if (profile.is_frozen) {
          showModal('Account Frozen', 'Your account is temporarily frozen. Contact support.', true);
          await supabase.auth.signOut();
          return;
        }

        // ✅ Success — Redirect
        showModal('Success', `Welcome back, ${profile.username || email}!`, false);
        setTimeout(() => window.location.href = '../dashboard/dashboard.html', 1500);

      } catch (err) {
        console.error('Login Error:', err);
        showModal('Login Failed', err.message || 'Invalid email or password.', true);
      }
    });
  }
});