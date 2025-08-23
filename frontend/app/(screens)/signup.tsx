import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { registerUser } from "../../api";

export default function SignUpScreen() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const isFormValid = username.trim() && email.trim() && password.trim();

  const handleSignUp = async () => {
    if (!isFormValid) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    try {
      const newUser = await registerUser(username, email, password);
      console.log("Registration successful:", newUser); 
      Alert.alert("Success", "User registered successfully!");
      router.push("/login");
    } catch (err: any) {
      console.log("Registration failed:", err); 
      Alert.alert("Registration Failed", err.toString());
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
        <View style={styles.container}>
          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={() => router.replace("/welcome")}>
            <Ionicons name="chevron-back" size={28} color="#800080" />
          </TouchableOpacity>

          {/* Title */}
          <Text style={styles.title}>Sign Up</Text>

          {/* Inputs */}
          <TextInput
            placeholder="Username"
            style={styles.input}
            placeholderTextColor="#888"
            value={username}
            onChangeText={setUsername}
          />
          <TextInput
            placeholder="Password"
            style={styles.input}
            placeholderTextColor="#888"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <TextInput
            placeholder="Email Address"
            style={styles.input}
            placeholderTextColor="#888"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          {/* Sign Up Button */}
          <TouchableOpacity
            style={[
              styles.signUpButton,
              { backgroundColor: isFormValid ? "#4B0082" : "#ccc" },
            ]}
            onPress={handleSignUp}
            disabled={!isFormValid}
          >
            <Text style={styles.signUpText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "stretch", // ensures vertical stacking
  },
  title: {
    fontSize: 35,
    fontWeight: "bold",
    marginTop: 40,
    marginBottom: 20,
    textAlign: "center",
    color: "#800080",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 15,
    fontSize: 16,
    color: "black",
    width: "80%",
    alignSelf: "center",
  },
  signUpButton: {
    backgroundColor: "#800080",
    alignItems: "center",
    alignSelf: "center",
    padding: 15,
    width: "25%",
    height: "6%",
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 40,
  },
  signUpText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
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
