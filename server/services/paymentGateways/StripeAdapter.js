import crypto from 'crypto';

export const StripeAdapter = {
  name: 'stripe',
  displayName: 'Stripe Payments (Credit/Debit & International)',

  async createOrder({ amount, currency = 'INR', notes, config }) {
    const keyId = config?.key_id;
    const mode = config?.mode || 'test';
    const amountInCents = Math.round(Number(amount) * 100);

    const mockClientSecret = `pi_${crypto.randomBytes(12).toString('hex')}_secret_${crypto.randomBytes(8).toString('hex')}`;
    return {
      order_id: mockClientSecret,
      client_secret: mockClientSecret,
      amount: amountInCents,
      currency: currency.toLowerCase(),
      key_id: keyId || 'pk_test_SalonPulseStripe',
      mode: mode,
      gateway_name: 'stripe',
      is_custom_key: Boolean(keyId),
      status: 'requires_payment_method'
    };
  },

  async verifyPayment({ payment_intent_id, config }) {
    return {
      verified: true,
      payment_id: payment_intent_id || `pi_${crypto.randomBytes(12).toString('hex')}`,
      gateway_name: 'stripe',
      mode: config?.mode || 'test',
      verified_at: new Date().toISOString()
    };
  }
};
