import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Keyboard,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { changePassword } from "../../api";
import { ButtonStyles } from "../../styles/buttons";

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [old_password, setOldPassword] = useState("");
  const [new_password, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // For custom alert
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const showAlert = (message: string) => {
    setAlertMessage(message);
    setAlertVisible(true);
  };

  const isFormValid =
    email.trim() !== "" && old_password.trim() !== "" && new_password.trim() !== "";

  const handleReset = async () => {
    if (!isFormValid) {
      showAlert("Please fill in all fields");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAlert("Please enter a valid email address.");
      return;
    }

    // Password length validation
    if (new_password.length < 6) {
      showAlert("New password must be at least 6 characters long.");
      return;
    }

    // Check if new password is different from old password
    if (old_password === new_password) {
      showAlert("New password must be different from current password.");
      return;
    }

    setLoading(true);

    try {
      await changePassword(email, old_password, new_password);

      showAlert("Password changed successfully!");
      // Clear and redirect on close
      setEmail("");
      setOldPassword("");
      setNewPassword("");
      setTimeout(() => router.push("/login"), 500);
    } catch (error: any) {
      showAlert(error?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
        <View style={styles.container}>
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            disabled={loading}
          >
            <Ionicons name="chevron-back" size={28} color="#800080" />
          </TouchableOpacity>

          {/* Title */}
          <Text style={styles.title}>Change Password</Text>

          {/* Instructions */}
          <Text style={styles.instructions}>
            Enter your email and current password to set a new password.
          </Text>

          {/* Inputs */}
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor="#aaa"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            editable={!loading}
          />
          <TextInput
            style={styles.input}
            placeholder="Current Password"
            placeholderTextColor="#aaa"
            secureTextEntry
            value={old_password}
            onChangeText={setOldPassword}
            editable={!loading}
          />
          <TextInput
            style={styles.input}
            placeholder="New Password (min 6 characters)"
            placeholderTextColor="#aaa"
            secureTextEntry
            value={new_password}
            onChangeText={setNewPassword}
            editable={!loading}
          />

          {/* Reset Password Button */}
          <TouchableOpacity
            style={[
              styles.resetPasswordButton,
              { backgroundColor: isFormValid && !loading ? "#800080" : "#ccc" },
            ]}
            onPress={handleReset}
            disabled={!isFormValid || loading}
          >
            <Text style={styles.resetPasswordText}>
              {loading ? "Changing..." : "Change Password"}
            </Text>
          </TouchableOpacity>

          {/* Custom Alert Modal */}
<Modal transparent visible={alertVisible} animationType="fade">
  <View style={ButtonStyles.alertOverlay}>
    <View style={ButtonStyles.alertBox}>
      <View style={ButtonStyles.alertIcon}>
        <Ionicons name="alert-circle" size={50} color="#ff4444" />
      </View>
      <Text style={ButtonStyles.alertMessage}>{alertMessage}</Text>
      <TouchableOpacity
        style={ButtonStyles.alertButton}
        onPress={() => setAlertVisible(false)}
      >
        <Text style={ButtonStyles.alertButtonText}>OK</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "stretch",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    color: "#800080",
  },
  instructions: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
    paddingHorizontal: 20,
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
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 15,
    fontSize: 16,
    color: "black",
    width: "90%",
    alignSelf: "center",
  },
  resetPasswordButton: {
    backgroundColor: "#800080",
    alignItems: "center",
    alignSelf: "center",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginTop: 20,
    marginBottom: 20,
    width: "60%",
  },
  resetPasswordText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});