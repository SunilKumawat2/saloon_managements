import { RazorpayAdapter } from './RazorpayAdapter.js';
import { StripeAdapter } from './StripeAdapter.js';

const adapters = {
  razorpay: RazorpayAdapter,
  stripe: StripeAdapter
};

export const GatewayFactory = {
  getAdapter(gatewayName = 'razorpay') {
    const key = String(gatewayName).toLowerCase().trim();
    const adapter = adapters[key];
    if (!adapter) {
      throw new Error(`Unsupported payment gateway provider: '${gatewayName}'`);
    }
    return adapter;
  },

  registerAdapter(name, adapter) {
    adapters[name.toLowerCase()] = adapter;
  },

  getSupportedGateways() {
    return Object.keys(adapters).map(key => ({
      id: key,
      name: adapters[key].displayName || key,
      supportsUPI: key === 'razorpay'
    }));
  }
};
