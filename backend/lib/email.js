// lib/email.js — Sabba transactional email via SendGrid
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const FROM = {
  email: process.env.SENDGRID_FROM_EMAIL || 'hello@sabbaplatform.com',
  name:  'Sabba',
};

// ── Base template ─────────────────────────────────────────────
function baseHtml(title, content, ctaLabel, ctaUrl) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#F7F5F2;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F5F2;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="background:#1C1916;padding:28px 36px;border-radius:14px 14px 0 0;">
          <p style="margin:0;font-size:24px;font-weight:700;font-style:italic;color:#fff;font-family:Georgia,serif;">Sabba</p>
          <p style="margin:4px 0 0;font-size:11px;font-weight:700;color:#D4622A;text-transform:uppercase;letter-spacing:0.1em;">The Employee Adventure Benefit Platform</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#fff;padding:36px;border-left:1px solid #eee;border-right:1px solid #eee;">
          ${content}
        </td></tr>

        <!-- CTA -->
        ${ctaLabel && ctaUrl ? `
        <tr><td style="background:#fff;padding:0 36px 36px;border-left:1px solid #eee;border-right:1px solid #eee;">
          <a href="${ctaUrl}" style="display:inline-block;background:#D4622A;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:700;">${ctaLabel}</a>
        </td></tr>` : ''}

        <!-- Footer -->
        <tr><td style="background:#F7F5F2;padding:24px 36px;border-radius:0 0 14px 14px;border:1px solid #eee;border-top:none;">
          <p style="margin:0;font-size:12px;color:#9E8E7E;">You're receiving this because you have an account on the Sabba platform.</p>
          <p style="margin:8px 0 0;font-size:12px;color:#9E8E7E;">© 2026 Sabba Platform Ltd · <a href="https://sabba-frontend.vercel.app" style="color:#D4622A;text-decoration:none;">sabba-frontend.vercel.app</a></p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Email senders ─────────────────────────────────────────────

// 1. Welcome email for new employee (imported via CSV or created)
async function sendWelcomeEmployee({ to, full_name, company_name, temp_password }) {
  const content = `
    <h1 style="margin:0 0 8px;font-size:26px;color:#1C1916;font-weight:700;font-style:italic;font-family:Georgia,serif;">Welcome to Sabba, ${full_name.split(' ')[0]}! 👋</h1>
    <p style="margin:0 0 20px;font-size:15px;color:#4A4440;line-height:1.7;">${company_name} has given you access to Sabba — your gateway to life-changing sabbaticals and adventures, funded through your payroll.</p>
    <div style="background:#F7F5F2;border-radius:10px;padding:20px 24px;margin-bottom:24px;">
      <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#9E8E7E;text-transform:uppercase;letter-spacing:0.07em;">Your login details</p>
      <p style="margin:0 0 6px;font-size:14px;color:#1C1916;"><strong>Email:</strong> ${to}</p>
      <p style="margin:0;font-size:14px;color:#1C1916;"><strong>Temp password:</strong> <code style="background:#eee;padding:2px 8px;border-radius:4px;font-size:13px;">${temp_password}</code></p>
    </div>
    <p style="margin:0 0 24px;font-size:14px;color:#4A4440;line-height:1.7;">Please change your password after your first login. Take the adventure quiz to get personalised recommendations matched to your travel type.</p>
  `;
  return send({ to, subject: `Welcome to Sabba — your adventure benefit is ready`, html: baseHtml('Welcome to Sabba', content, 'Log in to Sabba →', 'https://sabba-frontend.vercel.app/login') });
}

// 2. Welcome email for new HR admin
async function sendWelcomeHR({ to, full_name, company_name, temp_password }) {
  const content = `
    <h1 style="margin:0 0 8px;font-size:26px;color:#1C1916;font-weight:700;font-style:italic;font-family:Georgia,serif;">You're set up on Sabba, ${full_name.split(' ')[0]}</h1>
    <p style="margin:0 0 20px;font-size:15px;color:#4A4440;line-height:1.7;">Your HR admin account for <strong>${company_name}</strong> is ready. You can now manage employee benefits, approve bookings, and configure your adventure programme.</p>
    <div style="background:#F7F5F2;border-radius:10px;padding:20px 24px;margin-bottom:24px;">
      <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#9E8E7E;text-transform:uppercase;letter-spacing:0.07em;">Your login details</p>
      <p style="margin:0 0 6px;font-size:14px;color:#1C1916;"><strong>Email:</strong> ${to}</p>
      <p style="margin:0;font-size:14px;color:#1C1916;"><strong>Temp password:</strong> <code style="background:#eee;padding:2px 8px;border-radius:4px;font-size:13px;">${temp_password}</code></p>
    </div>
    <p style="margin:0 0 24px;font-size:14px;color:#4A4440;line-height:1.7;">First steps: import your employees via CSV, set spend limits, and configure your vendor access. Your team will receive welcome emails automatically when you import them.</p>
  `;
  return send({ to, subject: `Your Sabba HR admin account is ready`, html: baseHtml('Welcome to Sabba', content, 'Open HR portal →', 'https://sabba-frontend.vercel.app/login') });
}

// 3. Booking approved notification (employee)
async function sendBookingApproved({ to, full_name, package_title, destination, departure_date, total_amount, payment_method, spread }) {
  const depStr = departure_date ? new Date(departure_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'TBC';
  const content = `
    <h1 style="margin:0 0 8px;font-size:26px;color:#1C1916;font-weight:700;font-style:italic;font-family:Georgia,serif;">Your adventure is approved! ✈️</h1>
    <p style="margin:0 0 20px;font-size:15px;color:#4A4440;line-height:1.7;">Great news, ${full_name.split(' ')[0]} — your HR team has approved your booking. The vendor will be in touch to confirm your place.</p>
    <div style="background:#F7F5F2;border-radius:10px;padding:20px 24px;margin-bottom:24px;">
      <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#9E8E7E;text-transform:uppercase;letter-spacing:0.07em;">Booking summary</p>
      <p style="margin:0 0 6px;font-size:14px;color:#1C1916;"><strong>Package:</strong> ${package_title}</p>
      <p style="margin:0 0 6px;font-size:14px;color:#1C1916;"><strong>Destination:</strong> ${destination}</p>
      <p style="margin:0 0 6px;font-size:14px;color:#1C1916;"><strong>Departure:</strong> ${depStr}</p>
      <p style="margin:0 0 6px;font-size:14px;color:#1C1916;"><strong>Total:</strong> £${Number(total_amount).toLocaleString()}</p>
      <p style="margin:0;font-size:14px;color:#1C1916;"><strong>Payment:</strong> ${payment_method === 'card' ? 'Card payment' : `Payroll deduction over ${spread || 12} months`}</p>
    </div>
  `;
  return send({ to, subject: `Your booking for ${package_title} has been approved`, html: baseHtml('Booking approved', content, 'View my bookings →', 'https://sabba-frontend.vercel.app/my-booking') });
}

// 4. Booking pending — HR needs to approve (employee)
async function sendBookingPending({ to, full_name, package_title }) {
  const content = `
    <h1 style="margin:0 0 8px;font-size:26px;color:#1C1916;font-weight:700;font-style:italic;font-family:Georgia,serif;">Booking submitted ✓</h1>
    <p style="margin:0 0 20px;font-size:15px;color:#4A4440;line-height:1.7;">Hi ${full_name.split(' ')[0]}, your booking for <strong>${package_title}</strong> has been submitted and is awaiting HR approval. You'll receive an email as soon as it's reviewed — usually within 1–2 business days.</p>
  `;
  return send({ to, subject: `Booking submitted — pending HR approval`, html: baseHtml('Booking submitted', content, 'View my bookings →', 'https://sabba-frontend.vercel.app/my-booking') });
}

// 5. HR notification — new booking needs approval
async function sendHRApprovalRequest({ to, hr_name, employee_name, package_title, destination, total_amount }) {
  const content = `
    <h1 style="margin:0 0 8px;font-size:26px;color:#1C1916;font-weight:700;font-style:italic;font-family:Georgia,serif;">New booking to review</h1>
    <p style="margin:0 0 20px;font-size:15px;color:#4A4440;line-height:1.7;">Hi ${hr_name.split(' ')[0]}, <strong>${employee_name}</strong> has submitted an adventure booking that needs your approval.</p>
    <div style="background:#F7F5F2;border-radius:10px;padding:20px 24px;margin-bottom:24px;">
      <p style="margin:0 0 6px;font-size:14px;color:#1C1916;"><strong>Package:</strong> ${package_title}</p>
      <p style="margin:0 0 6px;font-size:14px;color:#1C1916;"><strong>Destination:</strong> ${destination}</p>
      <p style="margin:0;font-size:14px;color:#1C1916;"><strong>Total:</strong> £${Number(total_amount).toLocaleString()}</p>
    </div>
  `;
  return send({ to, subject: `${employee_name} needs your approval for ${package_title}`, html: baseHtml('Booking approval needed', content, 'Review in HR portal →', 'https://sabba-frontend.vercel.app/hr') });
}

// 6. Password reset email
async function sendPasswordReset({ to, full_name, reset_token }) {
  const resetUrl = `https://sabba-frontend.vercel.app/reset-password?token=${reset_token}`;
  const content = `
    <h1 style="margin:0 0 8px;font-size:26px;color:#1C1916;font-weight:700;font-style:italic;font-family:Georgia,serif;">Reset your password</h1>
    <p style="margin:0 0 20px;font-size:15px;color:#4A4440;line-height:1.7;">Hi ${full_name?.split(' ')[0] || 'there'}, we received a request to reset your Sabba password. Click the button below — this link expires in 1 hour.</p>
    <p style="margin:0 0 24px;font-size:13.5px;color:#9E8E7E;">If you didn't request this, you can safely ignore this email.</p>
  `;
  return send({ to, subject: `Reset your Sabba password`, html: baseHtml('Password reset', content, 'Reset my password →', resetUrl) });
}

// 7. Vendor application rejected
async function sendVendorRejected({ to, company_name, reason }) {
  const content = `
    <h1 style="margin:0 0 8px;font-size:26px;color:#1C1916;font-weight:700;font-style:italic;font-family:Georgia,serif;">Application update</h1>
    <p style="margin:0 0 20px;font-size:15px;color:#4A4440;line-height:1.7;">Thank you for applying to join Sabba as a vendor partner. After reviewing <strong>${company_name}</strong>'s application, we're unable to approve it at this time.</p>
    <div style="background:#FDECEA;border-radius:10px;padding:16px 20px;margin-bottom:20px;border-left:4px solid #C0392B;">
      <p style="margin:0;font-size:14px;color:#C0392B;"><strong>Reason:</strong> ${reason}</p>
    </div>
    <p style="margin:0 0 24px;font-size:14px;color:#4A4440;line-height:1.7;">If you believe this is an error or would like to discuss further, please contact us at <a href="mailto:vendors@sabbaplatform.com" style="color:#D4622A;">vendors@sabbaplatform.com</a></p>
  `;
  return send({ to, subject: `Update on your Sabba vendor application`, html: baseHtml('Application update', content, null, null) });
}

// ── Core send function ────────────────────────────────────────
async function send({ to, subject, html }) {
  if (!process.env.SENDGRID_API_KEY) {
    console.log(`[EMAIL SKIPPED — no SENDGRID_API_KEY] To: ${to} Subject: ${subject}`);
    return { skipped: true };
  }
  try {
    await sgMail.send({ to, from: FROM, subject, html });
    console.log(`[EMAIL SENT] To: ${to} Subject: ${subject}`);
    return { sent: true };
  } catch (err) {
    console.error(`[EMAIL FAILED] To: ${to}`, err.response?.body || err.message);
    return { error: err.message };
  }
}

module.exports = {
  sendWelcomeEmployee,
  sendWelcomeHR,
  sendBookingApproved,
  sendBookingPending,
  sendHRApprovalRequest,
  sendPasswordReset,
  sendVendorRejected,
};
