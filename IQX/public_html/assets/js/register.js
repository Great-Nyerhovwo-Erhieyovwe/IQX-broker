// register.js — Node JS + Express + Neon (Complete, Real Version)

// ✅ Initialize after DOM loads
document.addEventListener('DOMContentLoaded', async () => {

  // === DOM elements ===
  const form = document.getElementById('registrationForm');
  const fullNameInput = document.getElementById('fullName');
  const usernameInput = document.getElementById('username');
  const emailInput = document.getElementById('email');
  const phoneInput = document.getElementById('phone');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const accountTypeInput = document.getElementById('accountType');
  const countryInput = document.getElementById('country');
  const currencyInput = document.getElementById('currency');
  const termsCheckbox = document.getElementById('terms');
  const agreeCheckbox = document.getElementById('agree');

  // Modal elements
  const modal = document.getElementById('modal');
  const closeModalBtn = document.getElementById('closeModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalMessage = document.getElementById('modalMessage');
  const modalIcon = document.getElementById('modalIcon');
  const modalSpinner = document.getElementById('modalSpinner');

  // Validation messages
  const fullNameError = document.getElementById('fullNameError');
  const usernameError = document.getElementById('usernameError');
  const emailError = document.getElementById('emailError');
  const passwordError = document.getElementById('passwordError');
  const confirmPasswordError = document.getElementById('confirmPasswordError');
  const termsError = document.getElementById('termsError');
  const ageAgreementError = document.getElementById('ageAgreementError');

  const usernameFeedback = document.getElementById('usernameFeedback');
  const usernameSuggestions = document.getElementById('usernameSuggestions');
  const phoneFeedback = document.getElementById('phoneFeedback');
  const strengthBar = document.getElementById('strengthBar');
  const strengthText = document.getElementById('strengthText');
  const psi = document.querySelector('.password-strength-indicator');

  let isSubmitting = false;
  let usernameCheckTimeout = null; // For debouncing

  // === Helper: Modal ===
  const showModal = (title, message, isError = true, loading = false) => {
    if (modalTitle) modalTitle.textContent = title;
    if (modalMessage) modalMessage.textContent = message;
    if (modalIcon) {
      modalIcon.className = isError ? 'fas fa-exclamation-circle' : 'fas fa-check-circle';
      modalIcon.style.color = isError ? 'red' : 'green';
      modalIcon.style.display = loading ? 'none' : 'inline-block';
    }
    if (modalSpinner) modalSpinner.style.display = loading ? 'block' : 'none';
    if (modal) modal.style.display = 'block';
  };

  if (closeModalBtn) closeModalBtn.addEventListener('click', () => (modal.style.display = 'none'));
  window.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });

  // === Validation Helpers ===
  const displayError = (el, msg) => { if (el) { el.textContent = msg; el.style.display = 'block'; } };
  const clearError = el => { if (el) { el.textContent = ''; el.style.display = 'none'; } };

  const validateFullName = () => {
    const v = fullNameInput.value.trim();
    if (!v) return displayError(fullNameError, 'Full name is required.'), false;
    if (v.length < 3) return displayError(fullNameError, 'Minimum 3 characters.'), false;
    clearError(fullNameError); return true;
  };

  const validateEmail = () => {
    const v = emailInput.value.trim();
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!v) return displayError(emailError, 'Email is required.'), false;
    if (!re.test(v)) return displayError(emailError, 'Invalid email.'), false;
    clearError(emailError); return true;
  };

  const validatePhone = () => {
    const v = phoneInput.value.trim();
    if (!v) return phoneFeedback.textContent = '', true;
    const re = /^\+?[0-9]{7,15}$/;
    if (!re.test(v)) { phoneFeedback.textContent = 'Invalid phone number'; phoneFeedback.classList.remove('valid'); return false; }
    phoneFeedback.textContent = 'Valid phone'; phoneFeedback.classList.add('valid'); return true;
  };

  const checkPasswordStrength = (pwd) => {
    let s = 0;
    if (pwd.length >= 8) s++;
    if (/[A-Z]/.test(pwd)) s++;
    if (/[a-z]/.test(pwd)) s++;
    if (/[0-9]/.test(pwd)) s++;
    if (/[^A-Za-z0-9]/.test(pwd)) s++;

    if (!strengthBar || !strengthText) return s;
    strengthBar.className = 'strength-bar'; strengthBar.style.width = '0%'; strengthText.textContent = '';
    if (s === 0) return s;
    if (s < 3) { strengthBar.style.width = '33%'; strengthBar.classList.add('weak'); strengthText.textContent = 'Weak'; strengthText.style.color = 'red'; }
    else if (s < 5) { strengthBar.style.width = '66%'; strengthBar.classList.add('moderate'); strengthText.textContent = 'Moderate'; strengthText.style.color = 'orange'; }
    else { strengthBar.style.width = '100%'; strengthBar.classList.add('strong'); strengthText.textContent = 'Strong'; strengthText.style.color = 'green'; }
    return s;
  };

  const validatePassword = () => {
    const pwd = passwordInput.value;
    const strength = checkPasswordStrength(pwd);
    if (!pwd) return displayError(passwordError, 'Password is required.'), false;
    if (strength < 4) return displayError(passwordError, 'Password too weak.'), false;
    clearError(passwordError); return true;
  };

  const validateConfirmPassword = () => {
    if (passwordInput.value !== confirmPasswordInput.value)
      return displayError(confirmPasswordError, 'Passwords do not match.'), false;
    clearError(confirmPasswordError); return true;
  };

  const validateTerms = () => {
    if (!termsCheckbox.checked)
      return displayError(termsError, 'You must agree to terms.'), false;
    clearError(termsError); return true;
  };

  const validateAgeAgreement = () => {
    if (!agreeCheckbox.checked)
      return displayError(ageAgreementError, 'You must confirm agreement.'), false;
    clearError(ageAgreementError); return true;
  };

  // === Username Availability ===
  const checkUsernameAvailability = async (name) => {
    // Clear previous feedback
    usernameFeedback.textContent = '';
    usernameSuggestions.innerHTML = '';
    usernameSuggestions.style.display = 'none';
    
    if (!name || name.length < 4) {
      displayError(usernameError, 'Username too short (min 4 characters).');
      return false;
    }

    // Clear error if we have a valid length
    clearError(usernameError);
    usernameFeedback.textContent = 'Checking...';
    usernameFeedback.classList.remove('valid');

    try {
      console.log('Checking username:', name); // Debug log
      const response = await fetch(`https://iqxbackendapi.onrender.com/api/check-username?username=${encodeURIComponent(name)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response status:', response.status); // Debug log
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Username check error response:', errorData);
        displayError(usernameError, errorData.message || 'Error checking username availability.');
        return false;
      }
      
      const data = await response.json();
      console.log('Username check response:', data); // Debug log
      
      if (data.exists) {
        displayError(usernameError, 'Username taken.');
        usernameFeedback.textContent = 'Taken';
        usernameFeedback.classList.remove('valid');
        const base = name.replace(/\d+$/, '');
        const suggestions = [base + Math.floor(Math.random() * 999), base + '_fx', base + '_2025'];
        usernameSuggestions.innerHTML = '<strong>Suggestions:</strong><br>' + suggestions.map(s => `<li>${s}</li>`).join('');
        usernameSuggestions.style.display = 'block';
        return false;
      } else {
        clearError(usernameError);
        usernameFeedback.textContent = 'Available';
        usernameFeedback.classList.add('valid');
        return true;
      }
    } catch (error) {
      console.error('Username check error:', error);
      displayError(usernameError, 'Network error. Please try again.');
      return false;
    }
  };

  // Debounced input handler
  usernameInput.addEventListener('input', (e) => {
    const name = e.target.value.trim();
    
    // Clear any existing timeout
    if (usernameCheckTimeout) {
      clearTimeout(usernameCheckTimeout);
    }
    
    // Only check if username is long enough
    if (name.length >= 4) {
      usernameCheckTimeout = setTimeout(() => {
        checkUsernameAvailability(name);
      }, 500); // Wait 500ms after user stops typing
    } else {
      // Clear feedback for short usernames
      usernameFeedback.textContent = '';
      usernameSuggestions.style.display = 'none';
      clearError(usernameError);
    }
  });

  // === Form Submit ===
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    isSubmitting = true;

    const valid =
      validateFullName() &
      validateEmail() &
      validatePhone() &
      validatePassword() &
      validateConfirmPassword() &
      validateTerms() &
      validateAgeAgreement();

    if (!valid) {
      showModal('Error', 'Please fix validation errors.', true);
      isSubmitting = false;
      return;
    }

    // Perform final username check before submission
    const usernameOK = await checkUsernameAvailability(usernameInput.value.trim());
    if (!usernameOK) { 
      isSubmitting = false; 
      return; 
    }

    const fullName = fullNameInput.value.trim();
    const email = emailInput.value.trim();
    const phone = phoneInput.value.trim();
    const password = passwordInput.value;
    const username = usernameInput.value.trim();
    const accountType = accountTypeInput?.value || '';
    const country = countryInput?.value || '';
    const currency = currencyInput?.value || '';

    showModal('Registering...', 'Please wait while we create your account.', false, true);

    try {
      // --- Call backend registration route
      const res = await fetch('https://iqxbackendapi.onrender.com/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          username,
          email,
          phone,
          password,
          accountType,
          country,
          currency
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed.');

      showModal('Success', `Welcome ${username}! Redirecting to login...`, false);
      form.reset();
      setTimeout(() => window.location.href = '../login/login.html', 2000);

    } catch (err) {
      console.error('Registration Error:', err);
      showModal('Registration Failed', err.message || 'Unexpected error.', true);
    }
    
    isSubmitting = false;
  });
});