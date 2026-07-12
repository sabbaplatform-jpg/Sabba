import { useState } from 'react';

const font = { display: "'Georgia', serif", body: "'Calibri', sans-serif" };
const colors = { navy: "#1A2E44", coral: "#E05A2B", teal: "#1A7A6E", slate: "#4A5568", muted: "#8A9AB0", line: "#E8E4DE", offwhite: "#FAFAF8" };

const SECTIONS = [
  {
    id: "who-we-are",
    title: "1. Who we are",
    content: `Sabba Platform Ltd ("Sabba", "we", "us", "our") operates the Sabba adventure benefit platform accessible at sabba-frontend.vercel.app. We are a data controller under the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.

If you have questions about this policy or how we handle your data, contact us at: privacy@sabbaplatform.com`
  },
  {
    id: "data-we-collect",
    title: "2. Data we collect",
    content: `We collect and process the following personal data:

**From employees:**
• Name, email address, job title, department, employee number
• Adventure preferences and travel quiz responses
• Booking history, payment method preferences and payroll spread selections
• Avatar images (if uploaded voluntarily)
• Platform usage data (pages visited, features used)

**From HR administrators:**
• Name, email address, employer organisation
• Login credentials (password stored as a bcrypt hash — never in plain text)
• Actions taken within the platform (audit log)

**From vendors:**
• Business name, contact email, business description
• Package listings and pricing
• Booking fulfilment data

**Automatically collected:**
• IP address and browser type (for security and abuse prevention)
• Session tokens (stored in browser localStorage, used for authentication only)`
  },
  {
    id: "how-we-use-data",
    title: "3. How we use your data",
    content: `We use your personal data for the following purposes:

**Contract performance (Art. 6(1)(b) UK GDPR):**
• Creating and managing your account
• Processing adventure bookings and payroll deductions
• Sending booking confirmation and status update emails
• Providing customer support

**Legitimate interests (Art. 6(1)(f) UK GDPR):**
• Maintaining platform security and preventing fraud
• Keeping audit logs of HR admin actions
• Improving the platform based on usage patterns
• Sending service-related communications

**Legal obligations (Art. 6(1)(c) UK GDPR):**
• Maintaining records for tax and accounting purposes
• Responding to lawful requests from authorities`
  },
  {
    id: "data-sharing",
    title: "4. Who we share data with",
    content: `We share personal data only where necessary:

**Your employer:** HR administrators at your employer can see your name, email, department, bookings and spend. This is inherent to the nature of an employer-funded benefit platform.

**Vendors:** When you confirm a booking, the vendor receives your name, contact email and booking details needed to fulfil the adventure.

**Service providers (data processors):**
• Supabase — database hosting (EU-West region)
• Vercel — platform hosting and deployment (US-based, adequacy decision applies)
• SendGrid (Twilio) — transactional email delivery
• Stripe — payment processing (PCI-DSS compliant)

We do not sell your personal data to third parties. We do not share data with advertisers.

All service providers are bound by data processing agreements and are required to handle data in accordance with UK GDPR.`
  },
  {
    id: "data-retention",
    title: "5. How long we keep your data",
    content: `We retain personal data for as long as necessary for the purposes described above:

• **Active accounts:** For the duration of your employer's subscription with Sabba
• **Booking records:** 6 years after the booking (UK tax record-keeping requirements)
• **Audit logs:** 2 years from the date of the action
• **Deleted accounts:** Within 30 days of an account deletion request, personal data is removed from active systems. Anonymised statistical data may be retained indefinitely.

When an employer ends their subscription, employee data is deleted within 60 days unless legally required to be retained longer.`
  },
  {
    id: "your-rights",
    title: "6. Your rights",
    content: `Under UK GDPR you have the following rights regarding your personal data:

• **Right of access** — request a copy of the personal data we hold about you
• **Right to rectification** — request correction of inaccurate data
• **Right to erasure** — request deletion of your data (subject to legal obligations)
• **Right to restrict processing** — request that we limit how we use your data
• **Right to data portability** — receive your data in a structured, machine-readable format
• **Right to object** — object to processing based on legitimate interests
• **Rights related to automated decision-making** — we do not make solely automated decisions that significantly affect you

To exercise any of these rights, email us at privacy@sabbaplatform.com. We will respond within 30 days.

If you are unsatisfied with our response, you have the right to lodge a complaint with the UK Information Commissioner's Office (ICO) at ico.org.uk.`
  },
  {
    id: "cookies",
    title: "7. Cookies and local storage",
    content: `Sabba uses browser localStorage (not cookies) to store your authentication token. This is necessary for the platform to function and does not require consent under the UK Privacy and Electronic Communications Regulations (PECR) as it is strictly necessary for a service you have requested.

We do not use third-party tracking cookies. We do not use advertising cookies. We do not use analytics cookies that identify individual users.

If you clear your browser's localStorage, you will be logged out of Sabba.`
  },
  {
    id: "security",
    title: "8. Security",
    content: `We take appropriate technical and organisational measures to protect your personal data:

• All data transmitted to and from Sabba is encrypted in transit using TLS 1.2+
• Passwords are hashed using bcrypt (industry-standard, irreversible hashing)
• Database access is restricted and encrypted at rest via Supabase
• Authentication tokens expire and must be renewed
• HR admin actions are logged in an immutable audit trail
• We perform regular security reviews

No system is completely secure. If you discover a security vulnerability, please report it responsibly to security@sabbaplatform.com.`
  },
  {
    id: "international-transfers",
    title: "9. International transfers",
    content: `Some of our service providers are based outside the UK. Where we transfer personal data internationally, we ensure appropriate safeguards are in place:

• Vercel (USA) — transfers rely on the UK-US adequacy framework or standard contractual clauses
• SendGrid/Twilio (USA) — standard contractual clauses apply

We do not transfer data to countries without adequate protection without appropriate safeguards.`
  },
  {
    id: "changes",
    title: "10. Changes to this policy",
    content: `We may update this privacy policy from time to time. When we make significant changes, we will notify you by email or by displaying a notice within the platform. The date at the top of this page shows when it was last updated.

Continued use of Sabba after changes are posted constitutes acceptance of the updated policy.`
  },
  {
    id: "contact",
    title: "11. Contact us",
    content: `For any privacy-related queries, to exercise your rights, or to make a complaint:

**Email:** privacy@sabbaplatform.com
**Data Controller:** Sabba Platform Ltd
**Website:** sabba-frontend.vercel.app

**UK Supervisory Authority:**
Information Commissioner's Office (ICO)
Wycliffe House, Water Lane, Wilmslow, Cheshire, SK9 5AF
ico.org.uk | 0303 123 1113`
  }
];

function renderContent(text) {
  return text.split('\n').map((line, i) => {
    if (line.startsWith('**') && line.endsWith('**')) {
      return <p key={i} style={{ fontWeight: 700, color: colors.navy, marginTop: 14, marginBottom: 4, fontSize: 14 }}>{line.replace(/\*\*/g, '')}</p>;
    }
    if (line.startsWith('• ')) {
      return <p key={i} style={{ paddingLeft: 16, color: colors.slate, fontSize: 13.5, lineHeight: 1.65, marginBottom: 4, position: 'relative' }}>
        <span style={{ position: 'absolute', left: 0, color: colors.coral }}>•</span>
        <span dangerouslySetInnerHTML={{ __html: line.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}/>
      </p>;
    }
    if (line === '') return <div key={i} style={{ height: 8 }}/>;
    return <p key={i} style={{ color: colors.slate, fontSize: 13.5, lineHeight: 1.65, marginBottom: 6 }}
      dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#1A2E44">$1</strong>') }}/>;
  });
}

export default function PrivacyPage() {
  const [active, setActive] = useState(null);

  return (
    <div style={{ fontFamily: font.body, background: colors.offwhite, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: colors.navy, padding: '40px 0 32px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 32px' }}>
          <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600, textDecoration: 'none', marginBottom: 12, fontFamily: font.body }}>← Back to Sabba</a>
          <p style={{ fontSize: 10, fontWeight: 700, color: colors.coral, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>Sabba Platform</p>
          <h1 style={{ fontFamily: font.display, fontSize: 36, fontStyle: 'italic', color: '#fff', marginBottom: 10 }}>Privacy Policy</h1>
          <p style={{ fontSize: 13, color: colors.muted }}>Last updated: 26 May 2026 · Applies to sabba.app</p>
        </div>
      </div>

      {/* Intro banner */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${colors.line}` }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 32px' }}>
          <p style={{ fontSize: 13.5, color: colors.slate, lineHeight: 1.7 }}>
            This policy explains how Sabba Platform Ltd collects, uses and protects your personal data. We are committed to being transparent about our data practices and complying with the UK General Data Protection Regulation (UK GDPR).
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 32px 80px', display: 'grid', gridTemplateColumns: '220px 1fr', gap: 32, alignItems: 'start' }}>

        {/* Sidebar nav */}
        <div style={{ position: 'sticky', top: 24, background: '#fff', borderRadius: 12, border: `1px solid ${colors.line}`, padding: '16px 0', overflow: 'hidden' }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: colors.coral, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 16px 10px', borderBottom: `1px solid ${colors.line}` }}>Contents</p>
          {SECTIONS.map(s => (
            <a key={s.id} href={`#${s.id}`}
              onClick={() => setActive(s.id)}
              style={{ display: 'block', padding: '8px 16px', fontSize: 12.5, color: active === s.id ? colors.coral : colors.slate, fontWeight: active === s.id ? 700 : 400, textDecoration: 'none', borderLeft: active === s.id ? `3px solid ${colors.coral}` : '3px solid transparent', background: active === s.id ? '#FEF3E8' : 'transparent', transition: 'all 0.1s' }}>
              {s.title}
            </a>
          ))}
        </div>

        {/* Main content */}
        <div>
          {SECTIONS.map(s => (
            <div key={s.id} id={s.id} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${colors.line}`, padding: '24px 28px', marginBottom: 16 }}>
              <h2 style={{ fontFamily: font.display, fontSize: 18, fontStyle: 'italic', color: colors.navy, marginBottom: 14, paddingBottom: 12, borderBottom: `1px solid ${colors.line}` }}>
                {s.title}
              </h2>
              <div>{renderContent(s.content)}</div>
            </div>
          ))}

          {/* Footer note */}
          <div style={{ background: colors.navy, borderRadius: 12, padding: '20px 24px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>🔒</span>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Your data is handled with care</p>
              <p style={{ fontSize: 12.5, color: colors.muted, lineHeight: 1.6 }}>
                We never sell your data. We never use it for advertising. Questions? Email <a href="mailto:privacy@sabbaplatform.com" style={{ color: colors.coral }}>privacy@sabbaplatform.com</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
