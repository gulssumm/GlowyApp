import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

export default function SignUpScreen() {
  const router = useRouter();

  // form state
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // check if all fields are filled
  const isFormValid = username.trim() && email.trim() && password.trim();

  const handleSignUp = () => {
    if (isFormValid) {
      router.push("/main"); // go to main screen
    } else {
      alert("Please fill in all fields.");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.container}>
          {/* Title */}
          <Text style={styles.title}>Create Account</Text>

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

          {/* Spacer */}
          <View style={{ flex: 1 }} />

          {/* Sign Up button */}
          <TouchableOpacity
            style={[
              styles.signUpButton,
              { backgroundColor: isFormValid ? "#800080" : "#ccc" }, 
            ]}
            onPress={handleSignUp}
            disabled={!isFormValid} // disables press if empty
          >
            <Text style={styles.signUpText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 40,
    marginBottom: 30,
    textAlign: "center",
    color: "#800080",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
  },
  signUpButton: {
    padding: 20,
    alignItems: "center",
    borderRadius: 0,
    marginBottom: 40, 
  },
  signUpText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
