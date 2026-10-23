// Arabic (RTL) is the app's default language. React Native only applies a layout
// direction at start-up, so on the very first launch we set RTL natively before
// React starts. Once the user picks a language, `I18nManager.forceRTL` stores the
// choice under the same key and this no longer overrides it.
//
// This replaces expo-localization's `supportsRTL`, which re-derives the direction
// from the device language on every launch (English phone => LTR), fighting the
// JS side and causing a reload loop that crashed release builds at launch.
const { withAppDelegate, withMainApplication } = require('expo/config-plugins');

const MARKER = 'Mujaz: default RTL';

function withIosDefaultRTL(config) {
  return withAppDelegate(config, (config) => {
    const src = config.modResults.contents;
    if (src.includes(MARKER)) return config;
    const anchor = '    let delegate = ReactNativeDelegate()';
    if (!src.includes(anchor)) throw new Error('withDefaultRTL: AppDelegate anchor not found');
    config.modResults.contents = src.replace(
      anchor,
      `    // ${MARKER} (first launch only; see plugins/withDefaultRTL.js)
    if UserDefaults.standard.object(forKey: "RCTI18nUtil_forceRTL") == nil {
      RCTI18nUtil.sharedInstance().allowRTL(true)
      RCTI18nUtil.sharedInstance().forceRTL(true)
    }
${anchor}`,
    );
    return config;
  });
}

function withAndroidDefaultRTL(config) {
  return withMainApplication(config, (config) => {
    const src = config.modResults.contents;
    if (src.includes(MARKER)) return config;
    const anchor = '    super.onCreate()\n';
    if (!src.includes(anchor)) throw new Error('withDefaultRTL: MainApplication anchor not found');
    config.modResults.contents = src.replace(
      anchor,
      `${anchor}    // ${MARKER} (first launch only; see plugins/withDefaultRTL.js)
    val rtlPrefs = getSharedPreferences("com.facebook.react.modules.i18nmanager.I18nUtil", MODE_PRIVATE)
    if (!rtlPrefs.contains("RCTI18nUtil_forceRTL")) {
      com.facebook.react.modules.i18nmanager.I18nUtil.instance.allowRTL(this, true)
      com.facebook.react.modules.i18nmanager.I18nUtil.instance.forceRTL(this, true)
    }
`,
    );
    return config;
  });
}

module.exports = function withDefaultRTL(config) {
  return withAndroidDefaultRTL(withIosDefaultRTL(config));
};
