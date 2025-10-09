// login.js — Complete Supabase version
const SUPABASE_URL = 'https://aqotnpbcrqaiqonpfshj.supabase.co'; // <- replace if needed
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxb3RucGJjcnFhaXFvbnBmc2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MDUwNDMsImV4cCI6MjA3NTQ4MTA0M30.rqwwCxMp2PBydSE99QJOL-nt1UjxkI7-ea0Q8Wk5SVI';

document.addEventListener('DOMContentLoaded', () => {
  if (!window.supabase || !window.supabase.createClient) {
    console.error('Supabase library not loaded.');
    return;
  }
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // DOM elements
  const loginForm = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const togglePwd = document.getElementById('togglePwd');
  const forgotPasswordLink = document.getElementById('forgotPasswordLink');
  const rememberMeCheckbox = document.getElementById('remember-me');

  const modal = document.getElementById('modal');
  const modalTitle = document.getElementById('modalTitle');
  const modalMessage = document.getElementById('modalMessage');
  const modalIcon = document.getElementById('modalIcon');
  const modalSpinner = document.getElementById('modalSpinner');
  const closeModalBtn = document.getElementById('closeModal');

  // Toggle password visibility
  if (togglePwd && passwordInput) {
    togglePwd.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      togglePwd.classList.toggle('fa-eye-slash', isPassword);
      togglePwd.classList.toggle('fa-eye', !isPassword);
    });
  }

  // Modal helper
  const showModal = (title = '', message = '', isError = true, showSpinner = false) => {
    if (modalTitle) modalTitle.textContent = title;
    if (modalMessage) modalMessage.textContent = message;

    if (modalIcon) {
      if (showSpinner) modalIcon.style.display = 'none';
      else {
        modalIcon.style.display = 'inline-block';
        modalIcon.className = isError ? 'fas fa-exclamation-circle' : 'fas fa-check-circle';
        modalIcon.style.color = isError ? 'red' : 'green';
      }
    }
    if (modalSpinner) modalSpinner.style.display = showSpinner ? 'block' : 'none';
    if (modal) modal.style.display = 'block';
  };

  if (closeModalBtn) closeModalBtn.addEventListener('click', () => { if (modal) modal.style.display = 'none'; });
  window.addEventListener('click', (e) => { if (e.target === modal && modal) modal.style.display = 'none'; });

  // Forgot password
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', async (e) => {
      e.preventDefault();
      const email = emailInput.value.trim();
      if (!email) {
        showModal('Error', 'Please enter your email.');
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
        showModal('Error', err?.message || 'Failed to send reset email.', true);
      }
    });
  }

  // Login form submission
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();
      const rememberMe = rememberMeCheckbox?.checked ?? false;

      if (!email || !password) {
        showModal('Error', 'Email and password are required.');
        return;
      }

      showModal('Logging In...', 'Verifying credentials...', false, true);

      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        const user = data.user;
        if (!user) {
          showModal('Login Failed', 'Invalid email or password.', true);
          return;
        }

        // Store session
        const sessionData = data.session;
        if (rememberMe) localStorage.setItem('supabaseSession', JSON.stringify(sessionData));
        else sessionStorage.setItem('supabaseSession', JSON.stringify(sessionData));

        // Check banned status in "users" table
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        if (profileError) throw profileError;

        if (profile?.is_banned) {
          showModal('Access Denied', 'Your account is banned.', true);
          await supabase.auth.signOut();
          return;
        }

        showModal('Success', `Welcome back, ${profile?.username || email}!`, false);
        setTimeout(() => window.location.href = '../dashboard/dashboard.html', 1500);

      } catch (err) {
        showModal('Login Failed', err?.message || 'Invalid email or password.', true);
      }
    });
  }
});