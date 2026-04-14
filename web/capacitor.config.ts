import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.eduadapt.app',
  appName: 'EduAdapt',
  webDir: 'out',
  bundledWebRuntime: false,
  server: {
    // Android needs cleartext enabled for http:// APIs.
    // Prefer HTTPS in production (host your FastAPI over HTTPS).
    androidScheme: 'http',
  },
};

export default config;

