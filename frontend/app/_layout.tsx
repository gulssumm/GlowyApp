import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import { ActivityIndicator, View } from "react-native";
import { Slot } from "expo-router";
import { AuthProvider } from "../context/AuthContext"; 

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  if (!loaded) {
    return (
      <SafeAreaProvider>
        <View style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#800080"
        }}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Slot />
      </AuthProvider>
    </SafeAreaProvider>
  );
}