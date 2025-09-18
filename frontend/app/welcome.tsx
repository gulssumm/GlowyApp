import { useRouter } from "expo-router";
import { Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={styles.container}>
      {/* Logo */}
      <Image source={require("../assets/images/4.png")} style={styles.logo} />
      {/* Title */}
      <Text style={styles.title}>Let's Get Started</Text>
      {/* Buttons */}
      <TouchableOpacity style={styles.exploreButton} onPress={() => router.push("/main")}>
        <Text style={styles.buttonText}>Explore</Text>
      </TouchableOpacity>

    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 20,
    textAlign: "center",
    color: "#800080",
  },
  exploreButton: {
    width: "50%",
    height: "8%",
    backgroundColor: "#800080",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  signUpButton: {
    width: "50%",
    height: "8%",
    backgroundColor: "#4B0082",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  logo: {
    width: 180,    
    height: 180,   
    resizeMode: "contain",
    marginBottom: 20,
  },
});
