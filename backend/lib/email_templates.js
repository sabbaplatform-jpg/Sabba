// lib/email_templates.js
// Default templates — used as fallback when no custom template exists
// Variables: {{first_name}}, {{full_name}}, {{company_name}}, {{temp_password}},
//            {{package_title}}, {{destination}}, {{departure_date}},
//            {{total_amount}}, {{payment_method}}, {{spread}},
//            {{employee_name}}, {{hr_name}}, {{reason}}, {{reset_url}}

const DEFAULTS = {
  welcome_employee: {
    subject: 'Welcome to Sabba — your adventure benefit is ready',
    body_html: `<h1>Welcome to Sabba, {{first_name}}! 👋</h1>
<p>{{company_name}} has given you access to Sabba — your gateway to life-changing sabbaticals and adventures, funded through your payroll.</p>
<div class="info-box">
  <p><strong>Email:</strong> {{email}}</p>
  <p><strong>Temporary password:</strong> {{temp_password}}</p>
</div>
<p>Please change your password after your first login. Take the adventure quiz to get personalised recommendations matched to your travel type.</p>`,
  },
  welcome_hr: {
    subject: 'Your Sabba HR admin account is ready',
    body_html: `<h1>You're set up on Sabba, {{first_name}}</h1>
<p>Your HR admin account for <strong>{{company_name}}</strong> is ready. You can now manage employee benefits, approve bookings, and configure your adventure programme.</p>
<div class="info-box">
  <p><strong>Email:</strong> {{email}}</p>
  <p><strong>Temporary password:</strong> {{temp_password}}</p>
</div>
<p>First steps: import your employees via CSV, set spend limits, and configure your vendor access.</p>`,
  },
  booking_submitted: {
    subject: 'Booking submitted — pending HR approval',
    body_html: `<h1>Booking submitted ✓</h1>
<p>Hi {{first_name}}, your booking for <strong>{{package_title}}</strong> has been submitted and is awaiting HR approval. You'll receive an email as soon as it's reviewed — usually within 1–2 business days.</p>`,
  },
  booking_approved: {
    subject: 'Your booking for {{package_title}} has been approved',
    body_html: `<h1>Your adventure is approved! ✈️</h1>
<p>Great news, {{first_name}} — your HR team has approved your booking. The vendor will be in touch to confirm your place.</p>
<div class="info-box">
  <p><strong>Package:</strong> {{package_title}}</p>
  <p><strong>Destination:</strong> {{destination}}</p>
  <p><strong>Departure:</strong> {{departure_date}}</p>
  <p><strong>Total:</strong> £{{total_amount}}</p>
  <p><strong>Payment:</strong> {{payment_method}}</p>
</div>`,
  },
  hr_approval_request: {
    subject: '{{employee_name}} needs your approval for {{package_title}}',
    body_html: `<h1>New booking to review</h1>
<p>Hi {{first_name}}, <strong>{{employee_name}}</strong> has submitted an adventure booking that needs your approval.</p>
<div class="info-box">
  <p><strong>Package:</strong> {{package_title}}</p>
  <p><strong>Destination:</strong> {{destination}}</p>
  <p><strong>Total:</strong> £{{total_amount}}</p>
</div>`,
  },
  vendor_rejected: {
    subject: 'Update on your Sabba vendor application',
    body_html: `<h1>Application update</h1>
<p>Thank you for applying to join Sabba as a vendor partner. After reviewing <strong>{{company_name}}</strong>'s application, we're unable to approve it at this time.</p>
<div class="info-box" style="border-left: 4px solid #C0392B;">
  <p><strong>Reason:</strong> {{reason}}</p>
</div>
<p>If you'd like to discuss further, please contact <a href="mailto:vendors@sabbaplatform.com">vendors@sabbaplatform.com</a></p>`,
  },
  password_reset: {
    subject: 'Reset your Sabba password',
    body_html: `<h1>Reset your password</h1>
<p>Hi {{first_name}}, we received a request to reset your Sabba password. Click the button below — this link expires in 1 hour.</p>
<p>If you didn't request this, you can safely ignore this email.</p>`,
  },
};

const EMAIL_TYPE_META = {
  welcome_employee:    { label: 'Welcome — Employee',       vars: ['first_name','full_name','email','company_name','temp_password'] },
  welcome_hr:          { label: 'Welcome — HR Admin',       vars: ['first_name','full_name','email','company_name','temp_password'] },
  booking_submitted:   { label: 'Booking submitted',        vars: ['first_name','full_name','package_title','destination'] },
  booking_approved:    { label: 'Booking approved',         vars: ['first_name','full_name','package_title','destination','departure_date','total_amount','payment_method','spread'] },
  hr_approval_request: { label: 'HR approval request',      vars: ['first_name','hr_name','employee_name','package_title','destination','total_amount'] },
  vendor_rejected:     { label: 'Vendor rejected',          vars: ['company_name','reason'] },
  password_reset:      { label: 'Password reset',           vars: ['first_name','full_name','reset_url'] },
};

module.exports = { DEFAULTS, EMAIL_TYPE_META };
