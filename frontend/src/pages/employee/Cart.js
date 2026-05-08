import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { useCart } from '../../context/CartContext';
import { Button, Spinner, EmptyState } from '../../components/UI';
import { colors, font } from '../../lib/styles';

export function Cart() {
  const { items, removeFromCart, total, clearCart } = useCart();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState('payroll');
  const [payrollMonths, setPayrollMonths] = useState(6);
  const [checking, setChecking]           = useState(false);
  const [error, setError]                 = useState('');

  const checkout = async () => {
    setChecking(true); setError('');
    try {
      const { data } = await api.post('/cart/checkout', { payment_method: paymentMethod, payroll_months: payrollMonths });
      if (data.type === 'stripe' && data.url) {
        window.location.href = data.url;
      } else {
        clearCart();
        navigate('/checkout-success');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Checkout failed');
    } finally {
      setChecking(false);
    }
  };

  if (items.length === 0) {
    return (
      <div style={{ fontFamily: font.body, background: '#fff', minHeight: '100vh', padding: '48px 40px', maxWidth: 800, margin: '0 auto' }}>
        <EmptyState emoji="🛒" title="Your cart is empty" subtitle="Browse packages and add them to your cart"
          action={<Button onClick={() => navigate('/marketplace')}>Explore packages</Button>}/>
      </div>
    );
  }

  const monthlyTotal = (total / payrollMonths).toFixed(2);

  return (
    <div style={{ fontFamily: font.body, background: '#fff', minHeight: '100vh', padding: '36px 40px', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: colors.faint, letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 4 }}>Your Cart</p>
        <h1 style={{ fontFamily: font.display, fontSize: 30, color: colors.dark, fontWeight: 400 }}>Review your adventures</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 }}>
        {/* Cart items */}
        <div>
          {items.map((item, i) => (
            <div key={item.id} style={{ display: 'flex', gap: 16, padding: '20px 0', borderBottom: i < items.length-1 ? `1px solid ${colors.border}` : 'none', alignItems: 'center' }}>
              {/* Image */}
              <div style={{ width: 100, height: 80, borderRadius: 12, overflow: 'hidden', flexShrink: 0,
                background: 'linear-gradient(135deg, #667eea, #764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 32 }}>{item.emoji || '🌍'}</span>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: colors.dark, marginBottom: 3 }}>{item.title}</p>
                <p style={{ fontSize: 13, color: colors.muted, fontWeight: 500 }}>{item.vendor_name} · {item.destination} · {item.duration}</p>
                {item.departure_date && (
                  <p style={{ fontSize: 12, color: colors.faint, marginTop: 4 }}>Departure: {new Date(item.departure_date).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}</p>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontFamily: font.display, fontSize: 22, color: colors.dark }}>£{Number(item.price_gbp).toLocaleString()}</p>
                <button onClick={() => removeFromCart(item.id)} style={{ fontSize: 12, color: colors.red, background: 'none', border: 'none', cursor: 'pointer', fontFamily: font.body, fontWeight: 600, marginTop: 6 }}>Remove</button>
              </div>
            </div>
          ))}
        </div>

        {/* Checkout panel */}
        <div>
          <div className="card" style={{ padding: 24, position: 'sticky', top: 80 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: colors.dark, marginBottom: 20 }}>Order summary</h2>

            {/* Items summary */}
            {items.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 13, color: colors.mid, fontWeight: 500 }}>{item.emoji} {item.title}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: colors.dark }}>£{Number(item.price_gbp).toLocaleString()}</span>
              </div>
            ))}

            <div style={{ borderTop: `1px solid ${colors.border}`, margin: '16px 0', paddingTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: colors.dark }}>Total</span>
                <span style={{ fontFamily: font.display, fontSize: 22, color: colors.dark }}>£{total.toLocaleString()}</span>
              </div>
            </div>

            {/* Payment method */}
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 11.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Payment method</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { value: 'payroll', label: 'Payroll deduction', icon: '💳', desc: 'Spread via employer payroll' },
                  { value: 'card',    label: 'Pay now by card',   icon: '🏦', desc: 'Secure Stripe payment' },
                ].map(opt => (
                  <div key={opt.value} onClick={() => setPaymentMethod(opt.value)}
                    style={{ padding: '12px 14px', border: `2px solid ${paymentMethod === opt.value ? colors.orange : colors.border}`, borderRadius: 10, background: paymentMethod === opt.value ? colors.orangeLight : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.15s' }}>
                    <span style={{ fontSize: 20 }}>{opt.icon}</span>
                    <div>
                      <p style={{ fontSize: 13.5, fontWeight: paymentMethod === opt.value ? 700 : 500, color: paymentMethod === opt.value ? colors.orange : colors.dark }}>{opt.label}</p>
                      <p style={{ fontSize: 11.5, color: colors.muted }}>{opt.desc}</p>
                    </div>
                    {paymentMethod === opt.value && <span style={{ marginLeft: 'auto', color: colors.orange }}>✓</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Payroll spread selector */}
            {paymentMethod === 'payroll' && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 11.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Payroll spread</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[3, 6, 12].map(mo => (
                    <div key={mo} onClick={() => setPayrollMonths(mo)}
                      style={{ flex: 1, padding: '10px 8px', border: `2px solid ${payrollMonths === mo ? colors.orange : colors.border}`, borderRadius: 10, background: payrollMonths === mo ? colors.orangeLight : '#fff', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: payrollMonths === mo ? colors.orange : colors.mid }}>{mo}mo</p>
                      <p style={{ fontSize: 11, color: colors.dark, fontWeight: 600 }}>£{(total / mo).toFixed(0)}/mo</p>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 12, color: colors.muted, marginTop: 8, textAlign: 'center' }}>
                  {payrollMonths} monthly payments of £{monthlyTotal}
                </p>
              </div>
            )}

            {error && <p style={{ fontSize: 13, color: colors.red, fontWeight: 600, marginBottom: 12 }}>{error}</p>}

            <Button onClick={checkout} disabled={checking} style={{ width: '100%', justifyContent: 'center', padding: '13px 20px', fontSize: 14 }}>
              {checking ? 'Processing…' : paymentMethod === 'card' ? '🔒 Pay with Stripe' : '✓ Confirm via payroll'}
            </Button>

            <p style={{ fontSize: 11.5, color: colors.faint, textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>
              {paymentMethod === 'payroll' ? 'Your request will go to HR for approval before payroll deductions begin.' : 'You will be redirected to Stripe to complete payment securely.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CheckoutSuccess() {
  const navigate = useNavigate();
  return (
    <div style={{ fontFamily: font.body, background: '#fff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
        <h1 style={{ fontFamily: font.display, fontSize: 32, color: colors.dark, fontWeight: 400, marginBottom: 12 }}>Booking submitted!</h1>
        <p style={{ fontSize: 15, color: colors.muted, lineHeight: 1.6, marginBottom: 28 }}>
          Your adventure request has been submitted. Your HR team will review and approve it shortly. You'll receive a notification once it's confirmed.
        </p>
        <p style={{ fontSize: 13, color: colors.orange, fontWeight: 700, marginBottom: 28 }}>⭐ You've earned 100 Sabba Points for booking!</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Button onClick={() => navigate('/my-booking')}>View my bookings</Button>
          <Button variant="secondary" onClick={() => navigate('/marketplace')}>Keep exploring</Button>
        </div>
      </div>
    </div>
  );
}
