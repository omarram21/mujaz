import type { ExpoConfig, ConfigContext } from 'expo/config';

// Release identifiers. Replace the placeholders before the first store build.
const BUNDLE_ID = process.env.APP_BUNDLE_ID ?? 'com.mujaz.app';
const EAS_PROJECT_ID = process.env.EAS_PROJECT_ID; // set after `eas init`

const CAMERA_EN =
  'Mujaz uses the camera so your sheikh can see you during live sessions, and to scan Ijazah QR codes.';
const MIC_EN =
  'Mujaz uses the microphone so your sheikh can hear your recitation during live sessions.';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Mujaz',
  slug: 'mujaz',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'mujaz',
  userInterfaceStyle: 'light', // dark tokens exist in src/theme; v1 ships light-only
  backgroundColor: '#FAF8F3',
  runtimeVersion: { policy: 'appVersion' },
  updates: EAS_PROJECT_ID ? { url: `https://u.expo.dev/${EAS_PROJECT_ID}` } : undefined,
  locales: {
    ar: './locales/ar.json',
    en: './locales/en.json',
  },
  ios: {
    bundleIdentifier: BUNDLE_ID,
    supportsTablet: false,
    infoPlist: {
      UIBackgroundModes: ['voip', 'audio'],
      NSCameraUsageDescription: CAMERA_EN,
      NSMicrophoneUsageDescription: MIC_EN,
      CFBundleAllowMixedLocalizations: true,
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: BUNDLE_ID,
    adaptiveIcon: {
      backgroundColor: '#0D3B2E',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    permissions: [
      'android.permission.CAMERA',
      'android.permission.RECORD_AUDIO',
      'android.permission.MODIFY_AUDIO_SETTINGS',
      'android.permission.POST_NOTIFICATIONS',
    ],
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: 'single',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    ['expo-localization', { supportsRTL: true, supportedLocales: ['ar', 'en'] }],
    [
      'expo-splash-screen',
      {
        backgroundColor: '#0D3B2E',
        image: './assets/images/splash-icon.png',
        imageWidth: 96,
      },
    ],
    ['expo-notifications', { color: '#0D3B2E' }],
    [
      'expo-camera',
      {
        cameraPermission: CAMERA_EN,
        microphonePermission: MIC_EN,
        recordAudioAndroid: true,
      },
    ],
    [
      '@daily-co/config-plugin-rn-daily-js',
      {
        enableCamera: true,
        enableMicrophone: true,
        enableScreenShare: false,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    router: {},
    eas: EAS_PROJECT_ID ? { projectId: EAS_PROJECT_ID } : undefined,
  },
});
