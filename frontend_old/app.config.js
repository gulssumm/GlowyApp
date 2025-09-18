import 'dotenv/config';

export default {
  expo: {
    name: "Glowy App",
    slug: "glowy-app",
    version: "1.0.0",
    // SDK 54 for Expo Go compatibility
    sdkVersion: "54.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "glowyapp",
    userInterfaceStyle: "automatic",
    // Disable new architecture for Expo Go compatibility
    newArchEnabled: false,
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      }
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      "expo-font",
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#ffffff"
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      API_URL: process.env.API_URL,
      API_IMAGE_BASE_URL: process.env.API_IMAGE_BASE_URL
    },
  },
};
