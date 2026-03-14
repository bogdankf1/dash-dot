import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dashdot.app',
  appName: 'DashDot',
  webDir: 'out',
  server: {
    url: 'https://dash-dot-five.vercel.app',
    cleartext: false,
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    scheme: 'DashDot',
  },
};

export default config;
