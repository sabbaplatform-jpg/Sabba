// lib/email.js — Sabba transactional email via SendGrid
const sgMail = require('@sendgrid/mail');
const { DEFAULTS } = require('./email_templates');

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

const FROM = {
  email: process.env.SENDGRID_FROM_EMAIL || 'hello@sabbaplatform.com',
  name:  'Sabba',
};

// ── Get template (DB custom → DB global → hardcoded default) ──
async function getTemplate(emailType, companyId) {
  try {
    const db = require('./db');
    // Try company-specific first
    if (companyId) {
      const r = await db.query(
        `SELECT subject, body_html FROM email_templates WHERE email_type=$1 AND company_id=$2 AND is_active=TRUE LIMIT 1`,
        [emailType, companyId]
      );
      if (r.rows.length) return r.rows[0];
    }
    // Fall back to global custom
    const g = await db.query(
      `SELECT subject, body_html FROM email_templates WHERE email_type=$1 AND company_id IS NULL AND is_active=TRUE LIMIT 1`,
      [emailType]
    );
    if (g.rows.length) return g.rows[0];
  } catch {}
  // Fall back to hardcoded default
  return DEFAULTS[emailType];
}

// ── Variable substitution ─────────────────────────────────────
function substitute(str, vars) {
  if (!str) return '';
  return Object.entries(vars).reduce((s, [k, v]) =>
    s.replace(new RegExp(`{{${k}}}`, 'g'), v || ''), str
  );
}

// ── Base HTML wrapper ─────────────────────────────────────────
function wrapHtml(title, bodyHtml, ctaLabel, ctaUrl) {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><title>${title}</title></head>
<body style="margin:0;padding:0;background:#F7F5F2;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F5F2;padding:40px 0;">
<tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

  <tr><td style="background:#1C1916;padding:28px 36px;border-radius:14px 14px 0 0;">
    <p style="margin:0;font-size:24px;font-weight:700;font-style:italic;color:#fff;font-family:Georgia,serif;">Sabba</p>
    <p style="margin:4px 0 0;font-size:11px;font-weight:700;color:#D4622A;text-transform:uppercase;letter-spacing:0.1em;">The Employee Adventure Benefit Platform</p>
  </td></tr>

  <tr><td style="background:#fff;padding:36px;border-left:1px solid #eee;border-right:1px solid #eee;">
    <style>.info-box{background:#F7F5F2;border-radius:10px;padding:16px 20px;margin:16px 0;} h1{color:#1C1916;font-size:24px;margin:0 0 16px;} p{color:#4A4440;font-size:14px;line-height:1.7;margin:0 0 12px;} strong{color:#1C1916;} a{color:#D4622A;}</style>
    ${bodyHtml}
  </td></tr>

  ${ctaLabel && ctaUrl ? `
  <tr><td style="background:#fff;padding:0 36px 36px;border-left:1px solid #eee;border-right:1px solid #eee;">
    <a href="${ctaUrl}" style="display:inline-block;background:#D4622A;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:700;">${ctaLabel}</a>
  </td></tr>` : ''}

  <tr><td style="background:#F7F5F2;padding:24px 36px;border-radius:0 0 14px 14px;border:1px solid #eee;border-top:none;">
    <p style="margin:0;font-size:12px;color:#9E8E7E;">© 2026 Sabba Platform Ltd · <a href="https://sabba-frontend.vercel.app" style="color:#D4622A;">sabba-frontend.vercel.app</a></p>
  </td></tr>

</table></td></tr></table></body></html>`;
}

// ── Core send function ────────────────────────────────────────
async function send({ to, subject, html }) {
  if (!process.env.SENDGRID_API_KEY) {
    console.log(`[EMAIL SKIPPED — no SENDGRID_API_KEY] To: ${to} | Subject: ${subject}`);
    return { skipped: true };
  }
  try {
    await sgMail.send({ to, from: FROM, subject, html });
    console.log(`[EMAIL SENT] To: ${to} | Subject: ${subject}`);
    return { sent: true };
  } catch (err) {
    console.error(`[EMAIL FAILED] To: ${to}`, err.response?.body || err.message);
    return { error: err.message };
  }
}

// ── Email senders ─────────────────────────────────────────────

async function sendWelcomeEmployee({ to, full_name, company_name, temp_password, company_id }) {
  const tmpl = await getTemplate('welcome_employee', company_id);
  const vars  = { first_name: full_name?.split(' ')[0], full_name, email: to, company_name, temp_password };
  const html  = wrapHtml('Welcome to Sabba', substitute(tmpl.body_html, vars), 'Log in to Sabba →', 'https://sabba-frontend.vercel.app/login');
  return send({ to, subject: substitute(tmpl.subject, vars), html });
}

async function sendWelcomeHR({ to, full_name, company_name, temp_password, company_id }) {
  const tmpl = await getTemplate('welcome_hr', company_id);
  const vars  = { first_name: full_name?.split(' ')[0], full_name, email: to, company_name, temp_password };
  const html  = wrapHtml('Welcome to Sabba', substitute(tmpl.body_html, vars), 'Open HR portal →', 'https://sabba-frontend.vercel.app/login');
  return send({ to, subject: substitute(tmpl.subject, vars), html });
}

async function sendBookingSubmitted({ to, full_name, package_title, destination, company_id }) {
  const tmpl = await getTemplate('booking_submitted', company_id);
  const vars  = { first_name: full_name?.split(' ')[0], full_name, package_title, destination };
  const html  = wrapHtml('Booking submitted', substitute(tmpl.body_html, vars), 'View my bookings →', 'https://sabba-frontend.vercel.app/my-booking');
  return send({ to, subject: substitute(tmpl.subject, vars), html });
}

async function sendBookingApproved({ to, full_name, package_title, destination, departure_date, total_amount, payment_method, spread, company_id }) {
  const tmpl = await getTemplate('booking_approved', company_id);
  const depStr = departure_date ? new Date(departure_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'TBC';
  const vars  = {
    first_name: full_name?.split(' ')[0], full_name, package_title, destination,
    departure_date: depStr,
    total_amount: Number(total_amount).toLocaleString(),
    payment_method: payment_method === 'card' ? 'Card payment' : `Payroll deduction over ${spread || 12} months`,
    spread,
  };
  const html  = wrapHtml('Booking approved', substitute(tmpl.body_html, vars), 'View my bookings →', 'https://sabba-frontend.vercel.app/my-booking');
  return send({ to, subject: substitute(tmpl.subject, vars), html });
}

async function sendHRApprovalRequest({ to, hr_name, employee_name, package_title, destination, total_amount, company_id }) {
  const tmpl = await getTemplate('hr_approval_request', company_id);
  const vars  = {
    first_name: hr_name?.split(' ')[0], hr_name, employee_name,
    package_title, destination,
    total_amount: Number(total_amount).toLocaleString(),
  };
  const html  = wrapHtml('Booking approval needed', substitute(tmpl.body_html, vars), 'Review in HR portal →', 'https://sabba-frontend.vercel.app/hr');
  return send({ to, subject: substitute(tmpl.subject, vars), html });
}

async function sendVendorRejected({ to, company_name, reason, company_id }) {
  const tmpl = await getTemplate('vendor_rejected', company_id);
  const vars  = { company_name, reason };
  const html  = wrapHtml('Application update', substitute(tmpl.body_html, vars), null, null);
  return send({ to, subject: substitute(tmpl.subject, vars), html });
}

async function sendPasswordReset({ to, full_name, reset_token }) {
  const tmpl  = await getTemplate('password_reset', null); // always global
  const resetUrl = `https://sabba-frontend.vercel.app/reset-password?token=${reset_token}`;
  const vars  = { first_name: full_name?.split(' ')[0], full_name, reset_url: resetUrl };
  const html  = wrapHtml('Password reset', substitute(tmpl.body_html, vars), 'Reset my password →', resetUrl);
  return send({ to, subject: substitute(tmpl.subject, vars), html });
}

// ── Preview renderer (used by admin template editor) ─────────
async function renderPreview(emailType, bodyHtml, subject, vars = {}) {
  const sampleVars = {
    first_name: 'James', full_name: 'James Thornton',
    email: 'james@company.com', company_name: 'Barclays PLC',
    temp_password: 'Welcome2Sabba!', package_title: 'Amazon Conservation Project',
    destination: 'Amazon, Brazil', departure_date: '1 September 2026',
    total_amount: '3,500', payment_method: 'Payroll deduction over 12 months',
    employee_name: 'James Thornton', hr_name: 'Sarah Chen',
    reason: 'Incomplete documentation', reset_url: 'https://sabba-frontend.vercel.app/reset-password?token=preview',
    spread: '12',
    ...vars,
  };
  return wrapHtml('Preview', substitute(bodyHtml, sampleVars), 'Example CTA →', '#');
}


async function sendNewVendorAlert({ vendor_name, vendor_email, category, full_name }) {
  if (!process.env.SENDGRID_API_KEY) { console.log('[EMAIL SKIPPED] sendNewVendorAlert'); return; }
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  await sgMail.send({
    to: 'vendor@sabbaplatform.com',
    from: 'hello@sabbaplatform.com',
    subject: `New vendor joined Sabba: ${vendor_name}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto">
        <div style="background:#1A2E44;padding:24px 32px;border-radius:12px 12px 0 0">
          <h1 style="color:#fff;font-size:22px;margin:0">New vendor joined Sabba 🎉</h1>
        </div>
        <div style="background:#F7F5F2;padding:24px 32px;border-radius:0 0 12px 12px">
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px 0;font-weight:700;color:#1A2E44;width:140px">Company:</td><td style="padding:8px 0;color:#444">${vendor_name}</td></tr>
            <tr><td style="padding:8px 0;font-weight:700;color:#1A2E44">Contact name:</td><td style="padding:8px 0;color:#444">${full_name}</td></tr>
            <tr><td style="padding:8px 0;font-weight:700;color:#1A2E44">Email:</td><td style="padding:8px 0;color:#444">${vendor_email}</td></tr>
            <tr><td style="padding:8px 0;font-weight:700;color:#1A2E44">Category:</td><td style="padding:8px 0;color:#444;text-transform:capitalize">${category}</td></tr>
          </table>
          <div style="margin-top:20px;padding-top:20px;border-top:1px solid #eee">
            <p style="color:#777;font-size:13px">Log in to the Super Admin portal to review and approve their vendor profile.</p>
            <a href="https://sabba.app/admin" style="display:inline-block;background:#E05A2B;color:#fff;padding:10px 22px;border-radius:8px;text-decoration:none;font-weight:700;margin-top:8px">Open Admin Portal →</a>
          </div>
        </div>
      </div>
    `,
  });
}

async function sendContactForm({ name, email: senderEmail, subject, message }) {
  if (!process.env.SENDGRID_API_KEY) { console.log('[EMAIL SKIPPED] sendContactForm'); return; }
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  await sgMail.send({
    to: 'hello@sabbaplatform.com',
    from: 'hello@sabbaplatform.com',
    replyTo: senderEmail,
    subject: `Contact form: ${subject || 'New message from sabba.app'}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto">
        <div style="background:#1A2E44;padding:24px 32px;border-radius:12px 12px 0 0">
          <h1 style="color:#fff;font-size:20px;margin:0">New contact form submission</h1>
        </div>
        <div style="background:#F7F5F2;padding:24px 32px;border-radius:0 0 12px 12px">
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px 0;font-weight:700;color:#1A2E44;width:100px">Name:</td><td style="padding:8px 0;color:#444">${name}</td></tr>
            <tr><td style="padding:8px 0;font-weight:700;color:#1A2E44">Email:</td><td style="padding:8px 0;color:#444">${senderEmail}</td></tr>
            <tr><td style="padding:8px 0;font-weight:700;color:#1A2E44">Subject:</td><td style="padding:8px 0;color:#444">${subject || '—'}</td></tr>
          </table>
          <div style="margin-top:16px;padding:16px;background:#fff;border-radius:8px;border:1px solid #eee">
            <p style="color:#444;font-size:14px;line-height:1.6;margin:0;white-space:pre-wrap">${message}</p>
          </div>
        </div>
      </div>
    `,
  });
}

module.exports = {
  sendWelcomeEmployee,
  sendWelcomeHR,
  sendBookingSubmitted,
  sendBookingApproved,
  sendHRApprovalRequest,
  sendVendorRejected,
  sendPasswordReset,
  renderPreview,
};
