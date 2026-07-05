import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, font } from '../lib/styles';
import { Button } from '../components/UI';

export function NotFound() {
  const navigate = useNavigate();
  return (
    <div style={{ fontFamily: font.body, background: '#F7F5F2', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <p style={{ fontFamily: font.display, fontSize: 96, color: colors.orange, fontWeight: 700, fontStyle: 'italic', lineHeight: 1 }}>404</p>
        <h1 style={{ fontFamily: font.display, fontSize: 32, color: colors.dark, fontWeight: 700, fontStyle: 'italic', marginBottom: 12, marginTop: 8 }}>Page not found</h1>
        <p style={{ fontSize: 15, color: colors.muted, lineHeight: 1.6, marginBottom: 28 }}>The page you're looking for doesn't exist or has been moved.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Button onClick={() => navigate(-1)} variant="secondary">← Go back</Button>
          <Button onClick={() => navigate('/')}>Go home</Button>
        </div>
      </div>
    </div>
  );
}

export function Contact() {
  const [form, setForm]       = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState('');

  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      setError('Please fill in your name, email and message.'); return;
    }
    setSending(true); setError('');
    try {
      await fetch('https://api.sabba.app/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      }).then(r => { if (!r.ok) throw new Error('Failed'); return r.json(); });
      setSent(true);
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch {
      setError('Message could not be sent. Please email hello@sabbaplatform.com directly.');
    } finally { setSending(false); }
  };
  return (
    <div style={{ fontFamily: font.body, background: '#F7F5F2', minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '28px 40px 24px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <p style={{ fontSize: 10.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Sabba</p>
          <h1 style={{ fontFamily: font.display, fontSize: 34, color: colors.dark, fontWeight: 700, fontStyle: 'italic' }}>Contact us</h1>
          <p style={{ color: colors.muted, fontSize: 14, marginTop: 4, fontWeight: 500 }}>We'd love to hear from you.</p>
        </div>
      </div>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '36px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          {[
            { icon: '📧', label: 'General enquiries', value: 'hello@sabbaplatform.com' },
            { icon: '💼', label: 'Employer partnerships', value: 'employers@sabbaplatform.com' },
            { icon: '🌍', label: 'Vendor onboarding', value: 'vendors@sabbaplatform.com' },
            { icon: '🛟', label: 'Support', value: 'support@sabbaplatform.com' },
          ].map((item, i) => (
            <div key={i} className="card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: colors.orangeLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{item.icon}</div>
              <div>
                <p style={{ fontSize: 11.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>{item.label}</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: colors.orange }}>{item.value}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="card" style={{ padding: '28px 32px' }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: colors.dark, marginBottom: 20 }}>Send us a message</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            {['Full name', 'Email address', 'Company', 'Subject'].map(label => (
              <div key={label}>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>{label}</label>
                <input placeholder={label} style={{ width: '100%', border: '1.5px solid #eee', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: colors.dark, background: '#fff', outline: 'none', fontFamily: font.body }}/>
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 11.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Message</label>
            <textarea placeholder="How can we help?" rows={5} style={{ width: '100%', border: '1.5px solid #eee', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: colors.dark, background: '#fff', outline: 'none', fontFamily: font.body, resize: 'vertical' }}/>
          </div>
          {sent ? (
              <div style={{ background: '#ECFDF5', border: '1px solid #10B981', borderRadius: 10, padding: '14px 18px', textAlign: 'center', marginTop: 8 }}>
                <p style={{ color: '#10B981', fontWeight: 700, fontSize: 14 }}>✓ Message sent! We'll be in touch within one business day.</p>
              </div>
            ) : (
              <>
                {error && <p style={{ color: colors.red, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{error}</p>}
                <Button onClick={handleSend} disabled={sending} style={{ width: '100%', marginTop: 8, opacity: sending ? 0.7 : 1 }}>
                  {sending ? 'Sending…' : 'Send message'}
                </Button>
              </>
            )}
        </div>
      </div>
    </div>
  );
}

export function FAQ() {
  const faqs = [
    { q: 'What is Sabba?', a: 'Sabba is a B2B2C marketplace that connects employers, employees, and vendors around adventure travel and sabbatical leave. Employees can book curated packages — travel, volunteering, courses, and more — paid via employer payroll deduction.' },
    { q: 'How does payroll deduction work?', a: 'When an employee selects a package, they choose a payroll spread of 3, 6, or 12 months. The cost is deducted from their salary in equal monthly instalments over that period, making adventures affordable without upfront cost.' },
    { q: 'Do employers need to approve bookings?', a: 'Yes. All payroll bookings go through an HR approval workflow. HR admins receive a notification, review the request, and approve or reject it via their dashboard. Card payments go through Stripe directly.' },
    { q: 'How do I join as a vendor?', a: 'Click "Create an account" on the login page and register as a vendor. Once registered, you can add packages immediately. Your account will need to be verified by a Sabba HR admin before your packages appear on the public marketplace.' },
    { q: 'What is the Sabba Points system?', a: 'Employees earn Sabba Points for completing their adventure quiz (+25 pts), making bookings (+100 pts), and leaving package reviews (+50 pts). Points accumulate and can be redeemed as booking credit.' },
    { q: 'Is my payment information secure?', a: 'Yes. Card payments are processed entirely through Stripe — Sabba never stores or handles card details directly. Payroll deductions are handled through your employer\'s existing payroll integration.' },
    { q: 'Can I cancel a booking?', a: 'Cancellation policies vary by vendor. Contact your vendor directly for their specific terms. HR admins can also cancel pending bookings from the Adventures dashboard before they are confirmed.' },
    { q: 'How do I contact support?', a: 'Email support@sabbaplatform.com or use the contact form on our Contact page. We aim to respond within one business day.' },
  ];

  return (
    <div style={{ fontFamily: font.body, background: '#F7F5F2', minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '28px 40px 24px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <p style={{ fontSize: 10.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Sabba</p>
          <h1 style={{ fontFamily: font.display, fontSize: 34, color: colors.dark, fontWeight: 700, fontStyle: 'italic' }}>Frequently asked questions</h1>
          <p style={{ color: colors.muted, fontSize: 14, marginTop: 4, fontWeight: 500 }}>Everything you need to know about Sabba.</p>
        </div>
      </div>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '36px 40px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {faqs.map((faq, i) => <FAQItem key={i} q={faq.q} a={faq.a}/>)}
        </div>
        <div style={{ marginTop: 32, background: colors.orangeLight, border: `1px solid ${colors.orangePale}`, borderRadius: 16, padding: '24px 28px', display: 'flex', gap: 20, alignItems: 'center' }}>
          <span style={{ fontSize: 32 }}>💬</span>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: colors.dark, marginBottom: 4 }}>Still have questions?</p>
            <p style={{ fontSize: 13.5, color: colors.mid, fontWeight: 500 }}>Can't find what you're looking for? Get in touch and we'll get back to you within a day.</p>
          </div>
          <Button onClick={() => window.location.href = '/contact'} style={{ flexShrink: 0 }}>Contact us</Button>
        </div>
      </div>
    </div>
  );
}

function FAQItem({ q, a }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: font.body, textAlign: 'left' }}>
        <span style={{ fontSize: 14.5, fontWeight: 700, color: colors.dark, paddingRight: 16 }}>{q}</span>
        <span style={{ fontSize: 18, color: colors.orange, flexShrink: 0, transition: 'transform 0.2s', transform: open ? 'rotate(45deg)' : 'none' }}>+</span>
      </button>
      {open && (
        <div style={{ padding: '0 24px 18px' }}>
          <p style={{ fontSize: 14, color: colors.mid, lineHeight: 1.7 }}>{a}</p>
        </div>
      )}
    </div>
  );
}

// Need React for FAQItem useState
import React from 'react';
