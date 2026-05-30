// Vercel Serverless Function: web/api/send-email.js
// Integrates with Resend API to send contact form submissions

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

    // Call Resend REST API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        // For Resend free sandbox tier, this MUST be onboarding@resend.dev
        from: 'Celen LawFirm <onboarding@resend.dev>',
        to: 'info@celenchambers.org',
        subject: `[Celen LawFirm Inquiry] ${friendlySubject} — ${name}`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <div style="background-color: #0f172a; color: #ffffff; padding: 20px; text-align: center;">
              <h2 style="margin: 0; font-size: 20px; font-weight: 500; letter-spacing: 1px;">CELEN LAW FIRM</h2>
              <p style="margin: 5px 0 0 0; font-size: 13px; color: #94a3b8;">New Contact Inquiry Received</p>
            </div>
            
            <div style="padding: 24px; background-color: #ffffff;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; width: 120px; color: #64748b;">Full Name:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a;">${name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #64748b;">Email:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a;"><a href="mailto:${email}" style="color: #c5a880; text-decoration: none;">${email}</a></td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #64748b;">Phone:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a;">${phone || 'Not provided'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #64748b;">Subject:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-weight: 500;">${friendlySubject}</td>
                </tr>
              </table>
              
              <div style="margin-top: 24px;">
                <h4 style="margin: 0 0 8px 0; color: #64748b;">Message Details:</h4>
                <div style="background-color: #f8fafc; border-left: 4px solid #c5a880; padding: 16px; border-radius: 0 4px 4px 0; white-space: pre-wrap; color: #334155; font-size: 14px;">${message}</div>
              </div>
            </div>
            
            <div style="background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 11px; color: #64748b;">
              This is an automated delivery from the Celen LawFirm Digital Platform.
            </div>
          </div>
        `
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
