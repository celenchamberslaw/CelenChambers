// Vercel Serverless Function: web/api/send-email.js
// Integrates with Resend API to send contact form submissions

// Helper to sanitize HTML inputs to prevent XSS/Injection
const escapeHTML = (str) => {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
};

export default async function handler(req, res) {
  // Handle CORS Preflight request
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { name, email, phone, subject, message } = req.body;

    // Validate inputs
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Sanitize user inputs to prevent HTML injection
    const safeName = escapeHTML(name);
    const safeEmail = escapeHTML(email);
    const safePhone = escapeHTML(phone);
    const safeMessage = escapeHTML(message);

    // Prioritize the Vercel Environment Variable, fallback to the provided key
    const apiKey = process.env.RESEND_API_KEY || 're_2QWpiVdV_CcnxBhvrWvuKjZW9Edxj3FPe';

    // Map subject codes to human-readable strings
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
    const friendlySubject = subjectMapping[subject] || subject || "General Inquiry";
    const safeSubject = escapeHTML(friendlySubject);

    // Construct the professional text/HTML email template
    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a; line-height: 1.5; font-size: 14px;">
        <h2 style="font-size: 18px; font-weight: 600; border-bottom: 1px solid #e5e5e5; padding-bottom: 12px; margin-bottom: 24px; color: #000000;">
          New Client Inquiry
        </h2>
        
        <p style="margin: 0 0 8px 0;"><strong>Name:</strong><br>${safeName}</p>
        <p style="margin: 0 0 8px 0;"><strong>Email:</strong><br><a href="mailto:${safeEmail}" style="color: #0066cc; text-decoration: none;">${safeEmail}</a></p>
        <p style="margin: 0 0 8px 0;"><strong>Phone:</strong><br>${safePhone || 'Not provided'}</p>
        <p style="margin: 0 0 24px 0;"><strong>Matter Type:</strong><br>${safeSubject}</p>
        
        <p style="margin: 0 0 8px 0;"><strong>Message:</strong></p>
        <div style="background-color: #f9fafb; padding: 16px; border-left: 3px solid #d1d5db; white-space: pre-wrap; font-family: inherit; color: #374151; border-radius: 0 4px 4px 0;">${safeMessage}</div>
        
        <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e5e5; font-size: 12px; color: #6b7280;">
          Received via celenchambers.org
        </div>
      </div>
    `;

    // Call Resend REST API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        // For Resend free sandbox tier, this MUST be onboarding@resend.dev
        from: 'Celen Chambers <onboarding@resend.dev>',
        to: 'info@celenchambers.org',
        reply_to: safeEmail,
        subject: `[Celen Chambers Inquiry] ${safeSubject} — ${safeName}`,
        html: emailHtml
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Resend API Error details:', data);
      return res.status(response.status).json({ error: data.message || 'Failed to send email via Resend' });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
