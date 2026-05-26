/**
 * CELEN CHAMBERS — Contact Form
 * Validation + Resend API integration
 * Pure vanilla JavaScript
 */

(function() {
  'use strict';

  const form = document.getElementById('contactForm');
  if (!form) return;

  const submitBtn = document.getElementById('submitBtn');
  const successMsg = document.getElementById('successMsg');

  // Email regex pattern
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /**
   * Validate a single field
   */
  function validateField(field) {
    const name = field.name;
    const value = field.value.trim();
    const errorEl = document.getElementById(`${name}-error`);
    let isValid = true;

    // Clear previous error
    field.classList.remove('error');
    if (errorEl) errorEl.classList.remove('visible');

    // Required check
    if (field.hasAttribute('required') && !value) {
      isValid = false;
    }

    // Email format check
    if (name === 'email' && value && !EMAIL_REGEX.test(value)) {
      isValid = false;
    }

    // Show error if invalid
    if (!isValid) {
      field.classList.add('error');
      if (errorEl) errorEl.classList.add('visible');
    }

    return isValid;
  }

  /**
   * Validate all fields
   */
  function validateForm() {
    const fields = form.querySelectorAll('.form-input, .form-textarea, .form-select');
    let isValid = true;

    fields.forEach(field => {
      if (field.hasAttribute('required') && !validateField(field)) {
        isValid = false;
      }
    });

    return isValid;
  }

  /**
   * Set button state
   */
  function setButtonState(state) {
    submitBtn.classList.remove('loading', 'success', 'error');
    const btnText = submitBtn.querySelector('.btn-text');

    switch (state) {
      case 'loading':
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
        btnText.textContent = 'Sending...';
        break;
      case 'success':
        submitBtn.classList.add('success');
        submitBtn.disabled = true;
        btnText.textContent = 'Message Sent \u2713';
        break;
      case 'error':
        submitBtn.classList.add('error');
        submitBtn.disabled = false;
        btnText.textContent = 'Error \u2014 Retry';
        break;
      default:
        submitBtn.disabled = false;
        btnText.textContent = 'Send Message';
    }
  }

  /**
   * Handle form submission
   */
  async function handleSubmit(e) {
    e.preventDefault();

    // Hide success message
    successMsg.classList.remove('visible');

    // Validate
    if (!validateForm()) return;

    // Check honeypot
    const honeypot = form.querySelector('input[name="website"]');
    if (honeypot && honeypot.value) return; // Bot detected

    setButtonState('loading');

    // Collect form data
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Server error');
      }

      setButtonState('success');
      successMsg.classList.add('visible');
      form.reset();

      // Reset button after 4 seconds
      setTimeout(() => {
        setButtonState('default');
        successMsg.classList.remove('visible');
      }, 4000);
      
    } catch (error) {
      console.error('Form submission error:', error);
      setButtonState('error');

      // Reset button after 3 seconds
      setTimeout(() => {
        setButtonState('default');
      }, 3000);
    }
  }

  // Real-time validation on blur
  form.querySelectorAll('.form-input, .form-textarea, .form-select').forEach(field => {
    field.addEventListener('blur', () => {
      if (field.hasAttribute('required')) {
        validateField(field);
      }
    });

    // Clear error on input
    field.addEventListener('input', () => {
      field.classList.remove('error');
      const errorEl = document.getElementById(`${field.name}-error`);
      if (errorEl) errorEl.classList.remove('visible');
    });
  });

  // Form submission
  form.addEventListener('submit', handleSubmit);

})();
