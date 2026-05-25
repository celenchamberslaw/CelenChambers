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

    // Mapping for subjects to generate friendly email content
    const subjectMapping = {
      general: "General Inquiry",
      corporate: "Corporate and Commercial Law",
      employment: "Employment and Labour Law",
      healthcare: "Pharmaceutical and Healthcare Law",
      consumer: "Consumer Law",
      litigation: "Litigation",
      competition: "Competition Law",
      international: "International Law",
      tax: "Tax Law",
      career: "Career Opportunity",
      security: "Security Concern",
      other: "Other"
    };

    const friendlySubject = subjectMapping[data.subject] || data.subject || "General Inquiry";
    
    // Construct pre-filled email variables
    const emailTo = "celenchambers@outlook.com";
    const emailSubject = `[Celen LawFirm Inquiry] ${friendlySubject} — ${data.name}`;
    const emailBody = `Dear Celen LawFirm,

I am writing to inquire about your legal services. Below are my submission details:

• Full Name: ${data.name}
• Email Address: ${data.email}
• Phone Number: ${data.phone || 'Not provided'}
• Subject Area: ${friendlySubject}

Message Details:
${data.message}

---
Sent via the Celen LawFirm Digital Platform.`;

    const mailtoUrl = `mailto:${emailTo}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

    try {
      // Simulate network request for rich micro-animation feel (800ms)
      await new Promise(resolve => setTimeout(resolve, 800));

      setButtonState('success');
      successMsg.classList.add('visible');
      form.reset();

      // Trigger standard email client compose window
      window.location.href = mailtoUrl;

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
