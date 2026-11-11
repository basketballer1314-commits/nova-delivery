import type { ExpoConfig } from "expo/config";

// Le nom "NOVA" est provisoire : nom, slug et schéma viennent de l'environnement.
const APP_NAME = process.env.APP_NAME ?? "NOVA";
const APP_SLUG = process.env.APP_SLUG ?? "nova-delivery";
const APP_SCHEME = process.env.APP_SCHEME ?? "nova";
const ANDROID_PACKAGE = process.env.ANDROID_PACKAGE ?? "com.novadelivery.app.dev";

const NAVY_900 = "#0E2A47";
const SAND_100 = "#F7F1E8";

const config: ExpoConfig = {
  name: APP_NAME,
  slug: APP_SLUG,
  scheme: APP_SCHEME,
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  userInterfaceStyle: "light",
  newArchEnabled: true,
  ios: { supportsTablet: false },
  android: {
    package: ANDROID_PACKAGE,
    adaptiveIcon: {
      backgroundColor: NAVY_900,
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },
  web: { output: "static", favicon: "./assets/images/favicon.png" },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: SAND_100,
      },
    ],
  ],
  experiments: { typedRoutes: true, reactCompiler: true },
};

export default config;
