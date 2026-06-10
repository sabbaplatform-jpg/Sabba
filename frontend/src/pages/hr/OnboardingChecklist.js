import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { colors, font } from '../../lib/styles';

const STEPS = [
  {
    id: 'profile',
    icon: '👤',
    title: 'Complete your HR profile',
    description: 'Add your name, job title and photo so employees know who to contact.',
    action: 'Go to profile',
    route: '/hr/profile',
    check: (data) => data?.hr_profile_complete,
  },
  {
    id: 'employees',
    icon: '👥',
    title: 'Import your employees',
    description: 'Upload a CSV of your employees to give them access to the platform. You can add up to 500 at once.',
    action: 'Import employees',
    route: '/hr/employees',
    check: (data) => data?.employee_count > 0,
  },
  {
    id: 'allowances',
    icon: '💰',
    title: 'Set employee allowances',
    description: 'Define how much each employee can spend on adventures per year via payroll.',
    action: 'Set allowances',
    route: '/hr/employees',
    check: (data) => data?.allowances_set,
  },
  {
    id: 'vendors',
    icon: '✈️',
    title: 'Approve your vendors',
    description: 'Review and approve the vendors who have submitted packages for your employees.',
    action: 'Review vendors',
    route: '/hr/vendors',
    check: (data) => data?.approved_vendor_count > 0,
  },
  {
    id: 'packages',
    icon: '🌍',
    title: 'Review available packages',
    description: 'Browse the marketplace to see what\'s available to your employees.',
    action: 'Browse packages',
    route: '/hr/marketplace',
    check: (data) => data?.package_count > 0,
  },
  {
    id: 'communications',
    icon: '📧',
    title: 'Announce Sabba to your team',
    description: 'Let your employees know the benefit is live. We\'ve prepared a template announcement email.',
    action: 'Get email template',
    route: null,
    isDownload: true,
    check: (data) => data?.announced,
  },
  {
    id: 'booking',
    icon: '🎉',
    title: 'Approve your first booking',
    description: 'Once employees start booking, you\'ll see requests here to approve or reject.',
    action: 'View bookings',
    route: '/hr/bookings',
    check: (data) => data?.approved_booking_count > 0,
  },
];

const ANNOUNCEMENT_EMAIL = `Subject: Introducing Sabba — your new adventure benefit

Hi team,

We're excited to announce that [Company Name] is now partnered with Sabba — a platform that lets you book sabbaticals and adventure experiences, paid directly through your payroll.

What this means for you:
• Access to curated adventure packages across travel, volunteering, courses and more
• Pay via payroll spread over 3, 6 or 12 months — no upfront cost
• Your annual allowance: £[ALLOWANCE]

Getting started:
1. Log in at [SABBA_URL]
2. Take the adventure quiz to get personalised recommendations
3. Browse packages and submit a booking request
4. I'll review and approve within [X] working days

Any questions, reply to this email.

[Your name]
[Title]`;

export default function OnboardingChecklist() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied,  setCopied]  = useState(false);
  const [dismissed, setDismissed] = useState(
    localStorage.getItem('sabba_onboarding_dismissed') === 'true'
  );

  useEffect(() => {
    Promise.all([
      api.get('/employees').catch(() => ({ data: [] })),
      api.get('/bookings/employer').catch(() => ({ data: [] })),
      api.get('/vendors').catch(() => ({ data: [] })),
    ]).then(([emps, bookings, vendors]) => {
      const empList      = emps.data || [];
      const bookingList  = bookings.data || [];
      const vendorList   = vendors.data || [];
      setData({
        employee_count:        empList.length,
        allowances_set:        empList.some(e => e.spend_limit_gbp > 0),
        approved_vendor_count: vendorList.filter(v => v.status === 'approved').length,
        package_count:         vendorList.length,
        approved_booking_count: bookingList.filter(b => b.status === 'approved').length,
        hr_profile_complete:   !!(user?.full_name && user?.job_title),
        announced:             localStorage.getItem('sabba_announced') === 'true',
      });
    }).finally(() => setLoading(false));
  }, [user]);

  const completedCount = data ? STEPS.filter(s => s.check(data)).length : 0;
  const progress = data ? Math.round((completedCount / STEPS.length) * 100) : 0;
  const isComplete = completedCount === STEPS.length;

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(ANNOUNCEMENT_EMAIL);
    localStorage.setItem('sabba_announced', 'true');
    setData(d => ({ ...d, announced: true }));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const dismiss = () => {
    localStorage.setItem('sabba_onboarding_dismissed', 'true');
    setDismissed(true);
  };

  if (loading || dismissed || isComplete) return null;

  return (
    <div style={{
      background: '#fff', border: '1px solid #eee', borderRadius: 18,
      overflow: 'hidden', marginBottom: 28, fontFamily: font.body,
      boxShadow: '0 2px 16px rgba(0,0,0,0.06)'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1A2E44, #243d58)',
        padding: '22px 28px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)',
            textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
            Getting started
          </p>
          <h2 style={{ fontFamily: font.display, fontSize: 22, fontWeight: 700,
            fontStyle: 'italic', color: '#fff', marginBottom: 8 }}>
            Set up Sabba for your team
          </h2>
          {/* Progress bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 200, height: 6, background: 'rgba(255,255,255,0.15)',
              borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`,
                background: progress === 100 ? '#10B981' : colors.orange,
                borderRadius: 3, transition: 'width 0.4s ease' }}/>
            </div>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
              {completedCount} of {STEPS.length} steps complete
            </span>
          </div>
        </div>
        <button onClick={dismiss}
          style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8,
            padding: '6px 12px', fontSize: 12, color: 'rgba(255,255,255,0.5)',
            cursor: 'pointer', fontFamily: font.body }}>
          Dismiss
        </button>
      </div>

      {/* Steps */}
      <div style={{ padding: '8px 0' }}>
        {STEPS.map((step, i) => {
          const done = data ? step.check(data) : false;
          return (
            <div key={step.id} style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '14px 28px',
              borderBottom: i < STEPS.length - 1 ? '1px solid #f5f5f5' : 'none',
              opacity: done ? 0.6 : 1,
              transition: 'opacity 0.2s',
            }}>
              {/* Check circle */}
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: done ? '#10B981' : '#F7F5F2',
                border: `2px solid ${done ? '#10B981' : '#eee'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: done ? 14 : 16, transition: 'all 0.2s'
              }}>
                {done ? '✓' : step.icon}
              </div>

              {/* Content */}
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: done ? colors.muted : colors.dark,
                  marginBottom: 2, textDecoration: done ? 'line-through' : 'none' }}>
                  {step.title}
                </p>
                <p style={{ fontSize: 12.5, color: colors.faint, lineHeight: 1.5 }}>
                  {step.description}
                </p>
              </div>

              {/* Action button */}
              {!done && (
                step.isDownload ? (
                  <button onClick={handleCopyEmail}
                    style={{ background: colors.orange, color: '#fff', border: 'none',
                      borderRadius: 8, padding: '8px 16px', fontSize: 12.5, fontWeight: 700,
                      cursor: 'pointer', fontFamily: font.body, flexShrink: 0, whiteSpace: 'nowrap' }}>
                    {copied ? '✓ Copied!' : '📋 Copy email'}
                  </button>
                ) : (
                  <button onClick={() => step.route && navigate(step.route)}
                    style={{ background: '#F7F5F2', color: colors.mid, border: '1px solid #eee',
                      borderRadius: 8, padding: '8px 16px', fontSize: 12.5, fontWeight: 700,
                      cursor: 'pointer', fontFamily: font.body, flexShrink: 0, whiteSpace: 'nowrap' }}>
                    {step.action} →
                  </button>
                )
              )}
              {done && (
                <span style={{ fontSize: 12, color: '#10B981', fontWeight: 700, flexShrink: 0 }}>
                  Done ✓
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
