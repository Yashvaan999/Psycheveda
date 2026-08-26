/** Razorpay Standard Web Checkout for Reset Plan — web only. */

const CHECKOUT_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js';

export function isRazorpayWebConfigured() {
  return Boolean((process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || '').trim());
}

function loadCheckoutScript() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Razorpay checkout is only available on web.'));
  }
  if (window.Razorpay) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${CHECKOUT_SCRIPT}"]`);
    if (existing) {
      if (window.Razorpay) {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Could not load Razorpay checkout.')));
      return;
    }

    const script = document.createElement('script');
    script.src = CHECKOUT_SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Could not load Razorpay checkout.'));
    document.body.appendChild(script);
  });
}

function formatPaymentError(response) {
  const reason = response?.error?.reason;
  const description = response?.error?.description;
  const code = response?.error?.code;
  const parts = [description, reason, code].filter(Boolean);
  if (parts.length) return parts.join(' — ');
  return 'Payment failed. Check that your Razorpay Key ID matches in mobile/.env and Supabase secrets.';
}

/**
 * Opens Razorpay Standard Checkout (order-based).
 * Use keyId from create-order response so backend/frontend keys always match.
 */
export async function openStandardRazorpayCheckout({
  orderId,
  keyId,
  planLabel,
  userEmail,
  userName,
}) {
  await loadCheckoutScript();

  const key = keyId || process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID;
  if (!key) throw new Error('Razorpay is not configured.');

  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key,
      order_id: orderId,
      name: 'Psycheveda',
      description: `Reset Plan · ${planLabel}`,
      prefill: {
        email: userEmail || '',
        name: userName || '',
      },
      theme: { color: '#B86B3A' },
      handler: (response) => resolve(response),
      modal: {
        ondismiss: () => {
          const err = new Error('Checkout closed.');
          err.userCancelled = true;
          reject(err);
        },
      },
    });

    rzp.on('payment.failed', (response) => {
      reject(new Error(formatPaymentError(response)));
    });

    rzp.open();
  });
}
