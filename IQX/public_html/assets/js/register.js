// register.js — Complete Supabase version
// Replace the placeholders below with your actual Supabase project URL and anon key.
const SUPABASE_URL = 'https://aqotnpbcrqaiqonpfshj.supabase.co'; // <- replace
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxb3RucGJjcnFhaXFvbnBmc2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MDUwNDMsImV4cCI6MjA3NTQ4MTA0M30.rqwwCxMp2PBydSE99QJOL-nt1UjxkI7-ea0Q8Wk5SVI'; // <- replace

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Supabase client (via CDN global)
  if (!window.supabase || !window.supabase.createClient) {
    console.error('Supabase library not loaded. Add: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>');
    return;
  }
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // --- DOM Elements (guard each in case markup differs) ---
  const form = document.getElementById('registrationForm');
  const fullNameInput = document.getElementById('fullName');
  const usernameInput = document.getElementById('username');
  const emailInput = document.getElementById('email');
  const phoneInput = document.getElementById('phone');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const termsCheckbox = document.getElementById('terms');
  const agreeCheckbox = document.getElementById('agree');
  const accountTypeInput = document.getElementById('accountType');
  const countryInput = document.getElementById('country');
  const currencyInput = document.getElementById('currency');

  // Modal and feedback elements
  const modal = document.getElementById('modal');
  const closeModalBtn = document.getElementById('closeModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalMessage = document.getElementById('modalMessage');
  const modalIcon = document.getElementById('modalIcon');
  const modalSpinner = document.getElementById('modalSpinner');

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

  // Safety: ensure form exists
  if (!form) {
    console.error('No element with id "registrationForm" found.');
    return;
  }

  // Prevent double submissions
  let isSubmitting = false;

  // ---------- Modal helper ----------
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

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => { if (modal) modal.style.display = 'none'; });
  }
  window.addEventListener('click', (e) => { if (e.target === modal && modal) modal.style.display = 'none'; });

  // ---------- Error helpers ----------
  const displayError = (errorEl, message) => {
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.style.display = 'block';
    // try to find associated input (convention: error id = inputId + "Error")
    const guessedInputId = errorEl.id ? errorEl.id.replace(/Error$/, '') : null;
    const input = guessedInputId ? document.getElementById(guessedInputId) : null;
    if (input) {
      input.classList.add('invalid');
      input.classList.remove('valid');
    }
  };

  const clearError = (errorEl) => {
    if (!errorEl) return;
    errorEl.textContent = '';
    errorEl.style.display = 'none';
    const guessedInputId = errorEl.id ? errorEl.id.replace(/Error$/, '') : null;
    const input = guessedInputId ? document.getElementById(guessedInputId) : null;
    if (input) {
      input.classList.remove('invalid');
      input.classList.add('valid');
    }
  };

  // ---------- Validation ----------
  const validateFullName = () => {
    if (!fullNameInput) return true;
    const v = fullNameInput.value.trim();
    if (!v) { displayError(fullNameError, 'Full Name is required.'); return false; }
    if (v.length < 3) { displayError(fullNameError, 'Full Name must be at least 3 characters.'); return false; }
    clearError(fullNameError); return true;
  };

  const validateEmail = () => {
    if (!emailInput) return true;
    const v = emailInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!v) { displayError(emailError, 'Email is required.'); return false; }
    if (!emailRegex.test(v)) { displayError(emailError, 'Please enter a valid email address.'); return false; }
    clearError(emailError); return true;
  };

  const validatePhone = () => {
    if (!phoneInput || !phoneFeedback) return true;
    const v = phoneInput.value.trim();
    if (!v) { phoneFeedback.textContent = ''; phoneFeedback.classList.remove('valid'); return true; }
    const phoneRegex = /^\+?[0-9]{7,15}$/;
    if (!phoneRegex.test(v)) { phoneFeedback.textContent = 'Enter valid phone (e.g. +1234567890)'; phoneFeedback.classList.remove('valid'); return false; }
    phoneFeedback.textContent = 'Valid phone number'; phoneFeedback.classList.add('valid'); return true;
  };

  const checkPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/.test(password)) strength++;

    if (psi) psi.style.display = password ? 'block' : 'none';
    if (!strengthBar || !strengthText) return strength;

    // reset classes
    strengthBar.className = 'strength-bar';
    strengthBar.style.width = '0%';
    strengthText.textContent = '';

    if (!password) return strength;
    if (strength < 3) {
      strengthBar.style.width = '33%';
      strengthBar.classList.add('weak');
      strengthText.textContent = 'Weak';
      strengthText.style.color = '#dc3545';
    } else if (strength < 5) {
      strengthBar.style.width = '66%';
      strengthBar.classList.add('moderate');
      strengthText.textContent = 'Moderate';
      strengthText.style.color = '#ffc107';
    } else {
      strengthBar.style.width = '100%';
      strengthBar.classList.add('strong');
      strengthText.textContent = 'Strong';
      strengthText.style.color = '#28a745';
    }
    return strength;
  };

  const validatePassword = () => {
    if (!passwordInput || !confirmPasswordInput) return true;
    const pwd = passwordInput.value;
    const strength = checkPasswordStrength(pwd);
    if (!pwd) { displayError(passwordError, 'Password is required.'); return false; }
    if (strength < 5) { displayError(passwordError, 'Password is too weak. Include uppercase, lowercase, number & special char.'); return false; }
    clearError(passwordError); return true;
  };

  const validateConfirmPassword = () => {
    if (!passwordInput || !confirmPasswordInput) return true;
    const pwd = passwordInput.value;
    const confirm = confirmPasswordInput.value;
    if (!confirm) { displayError(confirmPasswordError, 'Confirm Password is required.'); return false; }
    if (pwd !== confirm) { displayError(confirmPasswordError, 'Passwords do not match.'); return false; }
    clearError(confirmPasswordError); return true;
  };

  const validateTerms = () => {
    if (!termsCheckbox) return true;
    if (!termsCheckbox.checked) { displayError(termsError, 'You must agree to the Terms and Conditions.'); return false; }
    clearError(termsError); return true;
  };

  const validateAgeAgreement = () => {
    if (!agreeCheckbox) return true;
    if (!agreeCheckbox.checked) { displayError(ageAgreementError, 'You must confirm your age and accept the Service Agreement.'); return false; }
    clearError(ageAgreementError); return true;
  };

  // ---------- Username availability (Supabase) ----------
  const checkUsernameAvailability = async (username) => {
    if (!usernameInput || !usernameFeedback || !usernameSuggestions) return false;
    usernameFeedback.textContent = '';
    usernameSuggestions.innerHTML = '';
    usernameSuggestions.style.display = 'none';
    usernameInput.classList.remove('valid', 'invalid');

    const name = String(username || '').trim();
    if (!name) { displayError(usernameError, 'Username is required.'); return false; }
    if (name.length < 6) { displayError(usernameError, 'Username must be at least 6 characters.'); usernameFeedback.textContent = 'Minimum 6 characters required.'; return false; }

    usernameFeedback.textContent = 'Checking availability...';
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username')
        .eq('username', name)
        .limit(1);

      if (error) throw error;
      if (!data || data.length === 0) {
        usernameFeedback.textContent = 'Username available.';
        usernameFeedback.classList.add('valid');
        usernameInput.classList.add('valid');
        clearError(usernameError);
        return true;
      } else {
        displayError(usernameError, 'This username is already taken.');
        usernameFeedback.textContent = 'Username taken.';
        usernameInput.classList.add('invalid');

        // suggestions
        const base = name.replace(/\d+$/, '') || name;
        const suggestions = [
          base + Math.floor(100 + Math.random() * 900),
          base + '_trader',
          base + '2025'
        ].filter(s => s.length >= 6);

        usernameSuggestions.innerHTML = '<strong>Suggestions:</strong>';
        suggestions.forEach(s => {
          const li = document.createElement('li');
          li.textContent = s;
          li.style.padding = '4px 8px';
          li.style.cursor = 'pointer';
          li.style.borderRadius = '4px';
          li.onmouseover = () => li.style.backgroundColor = '#f0f0f0';
          li.onmouseout = () => li.style.backgroundColor = '';
          li.onclick = () => {
            usernameInput.value = s;
            usernameInput.dispatchEvent(new Event('input'));
          };
          usernameSuggestions.appendChild(li);
        });
        usernameSuggestions.style.display = 'block';
        return false;
      }
    } catch (err) {
      console.error('Username check error:', err);
      displayError(usernameError, 'Error checking availability. Try again.');
      usernameFeedback.textContent = '';
      return false;
    }
  };

  // ---------- Real-time validation listeners ----------
  if (fullNameInput) fullNameInput.addEventListener('input', validateFullName);
  if (emailInput) emailInput.addEventListener('input', validateEmail);
  if (phoneInput) phoneInput.addEventListener('input', validatePhone);
  if (passwordInput) passwordInput.addEventListener('input', () => { validatePassword(); validateConfirmPassword(); });
  if (confirmPasswordInput) confirmPasswordInput.addEventListener('input', validateConfirmPassword);
  if (termsCheckbox) termsCheckbox.addEventListener('change', validateTerms);
  if (agreeCheckbox) agreeCheckbox.addEventListener('change', validateAgeAgreement);

  if (usernameInput) {
    usernameInput.addEventListener('input', () => {
      const v = usernameInput.value.trim();
      if (v.length > 0) checkUsernameAvailability(v);
      else {
        clearError(usernameError);
        if (usernameFeedback) usernameFeedback.textContent = '';
        if (usernameSuggestions) usernameSuggestions.style.display = 'none';
      }
    });
    usernameInput.addEventListener('blur', () => {
      const v = usernameInput.value.trim();
      if (v) checkUsernameAvailability(v);
    });
  }

  // ---------- Form submission ----------
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    isSubmitting = true;

    // run validations
    const okFull = validateFullName();
    const okEmail = validateEmail();
    const okPhone = validatePhone();
    const okPwd = validatePassword();
    const okConf = validateConfirmPassword();
    const okTerms = validateTerms();
    const okAge = validateAgeAgreement();

    if (!okFull || !okEmail || !okPhone || !okPwd || !okConf || !okTerms || !okAge) {
      showModal('Validation Error', 'Please correct all form errors.', true);
      isSubmitting = false;
      return;
    }

    const username = usernameInput ? usernameInput.value.trim() : '';
    const usernameAvailable = await checkUsernameAvailability(username);
    if (!usernameAvailable) {
      isSubmitting = false;
      return;
    }

    // collect values
    const fullName = fullNameInput ? fullNameInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value : '';
    const accountType = accountTypeInput ? accountTypeInput.value : '';
    const country = countryInput ? countryInput.value : '';
    const currency = currencyInput ? currencyInput.value : '';

    showModal('Registering...', 'Creating your account...', false, true);

    try {
      // Supabase sign up
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: { full_name: fullName, username } // adds to auth.user.user_metadata
        }
      });

      if (signUpError) {
        throw signUpError;
      }

      // Attempt to get user id from response (most setups return the user object)
      const userId = signUpData?.user?.id ?? null;

      // If userId is available, insert into users table using that id
      // If not available (email confirm flow), insert without id (will be unlinked) OR skip insertion and prompt user to confirm email.
      if (!userId) {
        // common when email confirm is required before account exists server-side
        showModal('Check Email', 'Please confirm your email to complete registration. After confirming, log in.', false);
        form.reset();
        isSubmitting = false;
        return;
      }

      // Insert profile row into users table (id = auth user id)
      const { error: insertError } = await supabase.from('users').insert([{
        id: userId,
        full_name: fullName,
        username: username,
        email: email,
        phone: phone || null,
        account_type: accountType || null,
        country: country || null,
        currency: currency || null,
        balance: 0.0,
        roi: 0.0,
        deposits: 0.0,
        active_trades: 0,
        is_frozen: false,
        is_banned: false,
        created_at: new Date().toISOString()
      }]);

      if (insertError) {
        // handle race / unique errors (e.g., username already inserted)
        console.error('Insert error:', insertError);
        // If insert failed because username already exists, try to cleanup the auth user?
        // We'll inform the user and abort.
        showModal('Database Error', insertError.message || 'Failed to save user data.', true);
        isSubmitting = false;
        return;
      }

      showModal('Registration Successful', `Welcome, ${username}! Redirecting to login...`, false);
      form.reset();
      setTimeout(() => { window.location.href = '../login/login.html'; }, 1800);
    } catch (err) {
      console.error('Registration error:', err);
      const msg = err?.message || 'An unexpected error occurred during registration.';
      showModal('Registration Failed', msg, true);
    } finally {
      isSubmitting = false;
    }
  });
});