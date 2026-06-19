import type { CapacitorConfig } from '@capacitor/cli'

/**
 * Capacitor config for the Android APK build of The Empire.
 *
 * The app is bundled fully offline (webDir = dist), so it runs with NO server —
 * client-side apps work out of the box. Backend-only apps (DataCenter, Files,
 * Hermes, the AI proxy) detect the missing server and let you point at one via
 * Agent → Settings ("Backend server"). allowMixedContent lets that be a plain
 * http:// box on your LAN (e.g. a PC or the Termux server) from the https WebView.
 */
const config: CapacitorConfig = {
  appId: 'com.jondridev.empire',
  appName: 'The Empire',
  webDir: 'dist',
  backgroundColor: '#03060e',
  android: {
    backgroundColor: '#03060e',
    allowMixedContent: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 600,
      backgroundColor: '#03060e',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#03060e',
    },
  },
}

export default config
