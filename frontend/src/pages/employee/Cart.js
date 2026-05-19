import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { Button, EmptyState } from '../../components/UI';
import { colors, font } from '../../lib/styles';

export function Cart() {
  const { items, removeFromCart, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [paymentMethod,  setPaymentMethod]  = useState('payroll');
  const [payrollMonths,  setPayrollMonths]  = useState(6);
  const [checking,       setChecking]       = useState(false);
  const [error,          setError]          = useState('');
  const [pointsBalance,  setPointsBalance]  = useState(0);
  const [pointsToApply,  setPointsToApply]  = useState(0);
  const [pointsInput,    setPointsInput]    = useState('');
  const [spendLimit,     setSpendLimit]     = useState(null);

  // Points rate: 100 pts = £1
  const POINTS_PER_POUND = 100;

  useEffect(() => {
    api.get('/employees/me').then(r => {
      setPointsBalance(r.data.sabba_points || 0);
      setSpendLimit(r.data.spend_limit_gbp ? Number(r.data.spend_limit_gbp) : null);
    }).catch(() => {});
  }, []);

  const maxPointsForOrder  = Math.min(pointsBalance, Math.floor(total * POINTS_PER_POUND));
  const pointsDiscount     = pointsToApply / POINTS_PER_POUND;
  const discountedTotal    = Math.max(0, total - pointsDiscount);
  const monthlyTotal       = (discountedTotal / payrollMonths).toFixed(2);

  const applyPoints = () => {
    const pts = Math.min(parseInt(pointsInput) || 0, maxPointsForOrder);
    setPointsToApply(pts);
    setPointsInput(String(pts));
  };

  const removePoints = () => {
    setPointsToApply(0);
    setPointsInput('');
  };

  const checkout = async () => {
    // Spend limit only applies to payroll — card payments bypass it
    if (paymentMethod === 'payroll' && spendLimit !== null && discountedTotal > spendLimit) {
      setError(`Your spend limit is £${spendLimit.toLocaleString()}. Apply more Sabba Points to reduce the total, or pay by card instead.`);
      return;
    }
    setChecking(true); setError('');
    try {
      const { data } = await api.post('/cart/checkout', {
        payment_method: paymentMethod,
        payroll_months: payrollMonths,
        points_used: pointsToApply,
      });
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
      <div style={{ fontFamily: font.body, background: '#F7F5F2', minHeight: '100vh', padding: '48px 40px', maxWidth: 800, margin: '0 auto' }}>
        <EmptyState emoji="🛒" title="Your cart is empty" subtitle="Browse packages and add them to your cart"
          action={<Button onClick={() => navigate('/marketplace')}>Explore packages</Button>}/>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: font.body, background: '#F7F5F2', minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '28px 40px 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <p style={{ fontSize: 10.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Checkout</p>
          <h1 style={{ fontFamily: font.display, fontSize: 34, color: colors.dark, fontWeight: 700, fontStyle: 'italic' }}>Your cart</h1>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '28px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 }}>

          {/* Cart items */}
          <div>
            <div className="card" style={{ padding: '8px 0', marginBottom: 16 }}>
              {items.map((item, i) => (
                <div key={item.id} style={{ display: 'flex', gap: 16, padding: '18px 20px', borderBottom: i < items.length-1 ? '1px solid #f5f5f5' : 'none', alignItems: 'center' }}>
                  <div style={{ width: 90, height: 72, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: 'linear-gradient(135deg, #667eea, #764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.image_url
                      ? <img src={item.image_url} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                      : <span style={{ fontSize: 28 }}>{item.emoji || '🌍'}</span>
                    }
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: colors.dark, marginBottom: 3 }}>{item.title}</p>
                    <p style={{ fontSize: 13, color: colors.muted, fontWeight: 500 }}>{item.vendor_name} · {item.destination} · {item.duration}</p>
                    {item.departure_date && (
                      <p style={{ fontSize: 12, color: colors.faint, marginTop: 4 }}>
                        Departure: {new Date(item.departure_date).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}
                      </p>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontFamily: font.display, fontSize: 22, color: colors.dark }}>£{Number(item.price_gbp).toLocaleString()}</p>
                    <button onClick={() => removeFromCart(item.id)} style={{ fontSize: 12, color: colors.red, background: 'none', border: 'none', cursor: 'pointer', fontFamily: font.body, fontWeight: 600, marginTop: 6 }}>Remove</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Sabba Points section */}
            {pointsBalance > 0 && (
              <div className="card" style={{ padding: '20px 22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: colors.dark, marginBottom: 2 }}>⭐ Sabba Points</p>
                    <p style={{ fontSize: 12.5, color: colors.muted }}>You have <strong style={{ color: colors.orange }}>{pointsBalance.toLocaleString()} pts</strong> · 100 pts = £1 off</p>
                  </div>
                  {pointsToApply > 0 && (
                    <div style={{ background: colors.greenLight, borderRadius: 8, padding: '4px 12px', textAlign: 'right' }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: colors.green }}>−£{pointsDiscount.toFixed(2)}</p>
                      <p style={{ fontSize: 11, color: colors.green }}>{pointsToApply} pts applied</p>
                    </div>
                  )}
                </div>

                {pointsToApply > 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1, background: colors.greenLight, borderRadius: 10, padding: '10px 14px' }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: colors.green }}>
                        {pointsToApply.toLocaleString()} points applied — saving £{pointsDiscount.toFixed(2)}
                      </p>
                    </div>
                    <button onClick={removePoints} style={{ background: colors.redLight, color: colors.red, border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: font.body, flexShrink: 0 }}>
                      Remove
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      type="number"
                      value={pointsInput}
                      onChange={e => setPointsInput(e.target.value)}
                      placeholder={`Up to ${maxPointsForOrder.toLocaleString()} pts`}
                      min="0"
                      max={maxPointsForOrder}
                      style={{ flex: 1, border: '1.5px solid #eee', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: colors.dark, fontFamily: font.body, outline: 'none' }}
                    />
                    <button onClick={applyPoints} style={{ background: colors.orange, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: font.body, flexShrink: 0 }}>
                      Apply
                    </button>
                    <button onClick={() => { setPointsInput(String(maxPointsForOrder)); setPointsToApply(maxPointsForOrder); }} style={{ background: '#F7F5F2', color: colors.mid, border: '1px solid #eee', borderRadius: 10, padding: '10px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: font.body, flexShrink: 0 }}>
                      Use max
                    </button>
                  </div>
                )}
                <p style={{ fontSize: 11.5, color: colors.faint, marginTop: 8 }}>
                  Max redeemable: {maxPointsForOrder.toLocaleString()} pts (= £{(maxPointsForOrder/POINTS_PER_POUND).toFixed(2)} off)
                </p>
              </div>
            )}
          </div>

          {/* Checkout panel */}
          <div>
            <div className="card" style={{ padding: 24, position: 'sticky', top: 80 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: colors.dark, marginBottom: 20 }}>Order summary</h2>

              {items.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 13, color: colors.mid, fontWeight: 500 }}>{item.emoji} {item.title}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: colors.dark }}>£{Number(item.price_gbp).toLocaleString()}</span>
                </div>
              ))}

              {pointsToApply > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 13, color: colors.green, fontWeight: 600 }}>⭐ Points discount</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: colors.green }}>−£{pointsDiscount.toFixed(2)}</span>
                </div>
              )}

              <div style={{ borderTop: '1px solid #eee', margin: '14px 0', paddingTop: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: colors.dark }}>Total</span>
                  <div style={{ textAlign: 'right' }}>
                    {pointsToApply > 0 && (
                      <p style={{ fontSize: 12, color: colors.muted, textDecoration: 'line-through' }}>£{total.toLocaleString()}</p>
                    )}
                    <span style={{ fontFamily: font.display, fontSize: 26, color: colors.dark }}>£{discountedTotal.toLocaleString()}</span>
                  </div>
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
                      style={{ padding: '12px 14px', border: `2px solid ${paymentMethod === opt.value ? colors.orange : '#eee'}`, borderRadius: 10, background: paymentMethod === opt.value ? colors.orangeLight : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.15s' }}>
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

              {/* Payroll spread */}
              {paymentMethod === 'payroll' && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 11.5, fontWeight: 700, color: colors.faint, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Payroll spread</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[3, 6, 12].map(mo => (
                      <div key={mo} onClick={() => setPayrollMonths(mo)}
                        style={{ flex: 1, padding: '10px 8px', border: `2px solid ${payrollMonths === mo ? colors.orange : '#eee'}`, borderRadius: 10, background: payrollMonths === mo ? colors.orangeLight : '#fff', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: payrollMonths === mo ? colors.orange : colors.mid }}>{mo}mo</p>
                        <p style={{ fontSize: 11, color: colors.dark, fontWeight: 600 }}>£{(discountedTotal / mo).toFixed(0)}/mo</p>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: 12, color: colors.muted, marginTop: 8, textAlign: 'center' }}>
                    {payrollMonths} payments of £{monthlyTotal}/mo
                  </p>
                </div>
              )}

              {error && <p style={{ fontSize: 13, color: colors.red, fontWeight: 600, marginBottom: 12 }}>{error}</p>}

              {/* Spend limit warning for payroll */}
              {paymentMethod === 'payroll' && spendLimit !== null && discountedTotal > spendLimit && (
                <div style={{ background: colors.redLight, borderRadius: 10, padding: '10px 14px', marginBottom: 12 }}>
                  <p style={{ fontSize: 12.5, color: colors.red, fontWeight: 700, marginBottom: 2 }}>Exceeds your spend limit</p>
                  <p style={{ fontSize: 12, color: colors.red }}>Your payroll limit is £{spendLimit.toLocaleString()}. Apply Sabba Points to reduce the total, or switch to card payment.</p>
                </div>
              )}
              {paymentMethod === 'payroll' && spendLimit !== null && discountedTotal <= spendLimit && (
                <div style={{ background: colors.greenLight, borderRadius: 10, padding: '8px 14px', marginBottom: 12 }}>
                  <p style={{ fontSize: 12, color: colors.green, fontWeight: 600 }}>✓ Within your spend limit of £{spendLimit.toLocaleString()}</p>
                </div>
              )}
              {paymentMethod === 'card' && spendLimit !== null && (
                <div style={{ background: '#F7F5F2', borderRadius: 10, padding: '8px 14px', marginBottom: 12 }}>
                  <p style={{ fontSize: 12, color: colors.muted }}>Card payments are not subject to your payroll spend limit.</p>
                </div>
              )}

              <Button onClick={checkout} disabled={checking} style={{ width: '100%', justifyContent: 'center', padding: '13px 20px', fontSize: 14 }}>
                {checking ? 'Processing…' : paymentMethod === 'card' ? '🔒 Pay with Stripe' : '✓ Confirm via payroll'}
              </Button>

              <p style={{ fontSize: 11.5, color: colors.faint, textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>
                {paymentMethod === 'payroll' ? 'Your request goes to HR for approval before deductions begin.' : 'You will be redirected to Stripe to complete payment securely.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CheckoutSuccess() {
  const navigate = useNavigate();
  return (
    <div style={{ fontFamily: font.body, background: '#F7F5F2', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
        <h1 style={{ fontFamily: font.display, fontSize: 32, color: colors.dark, fontWeight: 700, fontStyle: 'italic', marginBottom: 12 }}>Booking submitted!</h1>
        <p style={{ fontSize: 15, color: colors.muted, lineHeight: 1.6, marginBottom: 16 }}>
          Your adventure request has been submitted. Your HR team will review and approve it shortly.
        </p>
        <p style={{ fontSize: 13.5, color: colors.orange, fontWeight: 700, marginBottom: 28 }}>⭐ You've earned 100 Sabba Points for booking!</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Button onClick={() => navigate('/my-booking')}>View my bookings</Button>
          <Button variant="secondary" onClick={() => navigate('/marketplace')}>Keep exploring</Button>
        </div>
      </div>
    </div>
  );
}
