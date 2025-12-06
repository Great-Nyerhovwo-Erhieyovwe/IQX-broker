document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const loginForm = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const togglePwd = document.getElementById('togglePwd');
  const rememberMeCheckbox = document.getElementById('remember-me');

  const modal = document.getElementById('modal');
  const modalTitle = document.getElementById('modalTitle');
  const modalMessage = document.getElementById('modalMessage');
  const modalIcon = document.getElementById('modalIcon');
  const modalSpinner = document.getElementById('modalSpinner');
  const closeModalBtn = document.getElementById('closeModal');

  // --- Modal Helper ---
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

  // Close modal handlers
  if (closeModalBtn) closeModalBtn.addEventListener('click', () => (modal.style.display = 'none'));
  window.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });

  // --- Password toggle ---
  if (togglePwd && passwordInput) {
    togglePwd.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      togglePwd.classList.toggle('fa-eye', !isPassword);
      togglePwd.classList.toggle('fa-eye-slash', isPassword);
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

      showModal('Logging in...', 'Verifying credentials...', false, true);

      try {
        // --- Query json-server for user by email+password ---
        const query = `email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
        const res = await fetch(`http://localhost:3000/users?${query}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        const data = await res.json();

        // json-server returns an array of matching users
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error('Invalid email or password.');
        }

        const user = data[0];

        // --- Create a lightweight fake token and save user info ---
        const token = `fake-jwt-${user.id}`;
        if (rememberMe) {
          localStorage.setItem('iqxToken', token);
        } else {
          sessionStorage.setItem('iqxToken', token);
        }
        // Also store minimal user info for convenience
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem('iqxUser', JSON.stringify({ id: user.id, username: user.username || user.email }));

        // --- Redirect on success ---
        showModal('Success', `Welcome back, ${user.username || email}!`, false);
        setTimeout(() => window.location.href = '../dashboard/dashboard.html', 1500);

      } catch (err) {
        console.error('Login Error:', err);
        showModal('Login Failed', err.message || 'Invalid email or password.', true);
      }
    });
  }

  // --- Optional: Check if already logged in ---
  const token = localStorage.getItem('iqxToken') || sessionStorage.getItem('iqxToken');
  if (token) {
    // If token matches our fake-jwt pattern, extract id and verify against json-server
    const m = token.match(/^fake-jwt-(\d+)$/);
    if (m) {
      const id = m[1];
      fetch(`http://localhost:3000/users/${id}`)
        .then(r => r.json())
        .then(user => {
          if (user?.id) window.location.href = '../dashboard/dashboard.html';
        })
        .catch(() => {});
    }
  }
});
