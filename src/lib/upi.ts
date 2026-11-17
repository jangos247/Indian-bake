export interface UtrValidationResult {
  valid: boolean;
  cleaned: string;
  reason?: string;
}

const KNOWN_DUMMY_UTRS = new Set([
  '012345678901',
  '123456789012',
  '234567890123',
  '345678901234',
  '456789012345',
  '567890123456',
  '678901234567',
  '789012345678',
  '890123456789',
  '987654321098',
  '098765432109',
  '123456123456',
  '000000123456',
  '123456000000',
]);

export function sanitizeUtrInput(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 12);
}

export function validateUpiReference(raw: string): UtrValidationResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return {
      valid: false,
      cleaned: '',
      reason: 'Please complete the UPI payment and enter your 12-digit UTR / Reference number.',
    };
  }

  if (/[a-zA-Z]/.test(trimmed)) {
    return {
      valid: false,
      cleaned: sanitizeUtrInput(trimmed),
      reason: 'UPI Reference / UTR must contain numbers only (exactly 12 digits from your GPay, PhonePe, or Paytm receipt).',
    };
  }

  const cleaned = sanitizeUtrInput(trimmed);
  if (!/^[0-9]{12}$/.test(cleaned)) {
    return {
      valid: false,
      cleaned,
      reason: `Enter all 12 digits of your UPI UTR / Reference number (${cleaned.length}/12 entered).`,
    };
  }

  if (/^([0-9])\1{11}$/.test(cleaned)) {
    return {
      valid: false,
      cleaned,
      reason: 'Repeated digits are not a valid bank UTR. Please copy the 12-digit UTR from your UPI payment receipt.',
    };
  }

  if (KNOWN_DUMMY_UTRS.has(cleaned)) {
    return {
      valid: false,
      cleaned,
      reason: 'Sequential test numbers cannot be used. Please enter the actual 12-digit UPI UTR.',
    };
  }

  const uniqueDigits = new Set(cleaned.split('')).size;
  if (uniqueDigits < 4) {
    return {
      valid: false,
      cleaned,
      reason: 'That does not match a valid NPCI 12-digit UTR format. Please check your UPI transaction receipt.',
    };
  }

  return { valid: true, cleaned };
}

export function isValidUpiId(upiId: string): boolean {
  const cleaned = upiId.trim();
  if (!cleaned) return true;
  return /^[a-zA-Z0-9._-]{2,64}@[a-zA-Z0-9.-]{2,32}$/.test(cleaned);
}

export function buildUpiPaymentUri(params: {
  upiId: string;
  merchantName: string;
  amount: number;
  orderId: string;
}): string {
  const { upiId, merchantName, amount, orderId } = params;
  return `upi://pay?pa=${encodeURIComponent(upiId.trim())}&pn=${encodeURIComponent(
    merchantName
  )}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(
    `Order ${orderId}`
  )}&tr=${encodeURIComponent(orderId)}`;
}

export function formatFriendlyFirestoreError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  try {
    const parsed = JSON.parse(raw) as { error?: string; path?: string | null };
    if (parsed && typeof parsed.error === 'string') {
      if (parsed.error.includes('Missing or insufficient permissions')) {
        if (parsed.path?.startsWith('utr_claims/') || parsed.path?.startsWith('orders/')) {
          return 'This 12-digit UPI UTR has already been used or could not be verified. Check your UPI receipt and try again.';
        }
        return 'Your session could not be verified. Please sign out, sign back in, and try again.';
      }
      return parsed.error;
    }
  } catch {
    // Plain error string
  }
  if (raw.includes('Missing or insufficient permissions')) {
    return 'Unable to verify your order request. Ensure your 12-digit UPI UTR is unused and you are signed in.';
  }
  return raw || 'Unable to complete your request right now.';
}
