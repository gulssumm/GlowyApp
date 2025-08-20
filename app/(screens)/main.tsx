import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function MainScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace("/welcome")}>
          <Ionicons name="chevron-back" size={28} color="#800080" />
        </TouchableOpacity>
      <Text style={styles.text}>GlowyApp ✨</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  text: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#800080",
  },
  backButton: {
    position: "absolute",
    top: 50, 
    left: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
});
