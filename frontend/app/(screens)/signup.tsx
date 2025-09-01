import { ButtonStyles } from "@/styles/buttons";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Keyboard,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";
import { registerUser } from "../../api";

export default function SignUpScreen() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [alert, setAlert] = useState({ visible: false, message: "", type: "success" as "success" | "error" });

  const isFormValid = username.trim() && email.trim() && password.trim();

  const handleSignUp = async () => {
  if (!isFormValid) {
    setAlert({ visible: true, message: "Please fill in all fields.", type: "error" });
    return;
  }

  // Email validation - check if email contains @ symbol
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    setAlert({ 
      visible: true, 
      message: "Please enter a valid email address with @ symbol.", 
      type: "error" 
    });
    return;
  }

  // Password length validation 
  if (password.length < 6) {
    setAlert({ 
      visible: true, 
      message: "Password must be at least 6 characters long.", 
      type: "error" 
    });
    return;
  }

  try {
    const newUser = await registerUser(username, email, password);
    console.log("Registration successful:", newUser); 
    setAlert({ visible: true, message: "User registered successfully!", type: "success" });
  } catch (err: any) {
    console.log("Registration failed:", err); 
    setAlert({ visible: true, message: "Registration Failed: " + err.toString(), type: "error" });
  }
};

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
        <View style={styles.container}>
          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
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
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="none"
            autoComplete="off"
            importantForAutofill="no"
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

        {/* Custom Alert Modal */}
        <Modal transparent={true} visible={alert.visible} animationType="fade">
          <View style={ButtonStyles.alertOverlay}>
            <View style={ButtonStyles.alertBox}>
              <View style={ButtonStyles.alertIcon}>
                <Ionicons
                  name={alert.type === "success" ? "checkmark-circle" : "alert-circle"}
                  size={50}
                  color={alert.type === "success" ? "#4CAF50" : "#ff4444"}
                />
              </View>
              <Text style={ButtonStyles.alertMessage}>{alert.message}</Text>
              <TouchableOpacity
                style={ButtonStyles.alertButton}
                onPress={() => {
                  setAlert({ ...alert, visible: false });
                  if (alert.type === "success") router.push("/login");
                }}
              >
                <Text style={ButtonStyles.alertButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "stretch",
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
