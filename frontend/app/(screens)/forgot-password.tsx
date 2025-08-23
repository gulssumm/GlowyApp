import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { changePassword } from "../../api";

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [old_password, setOldPassword] = useState("");
  const [new_password, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const isFormValid = email.trim() && old_password.trim() && new_password.trim();

  const handleReset = async () => {
    if (!isFormValid) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Please enter a valid email address.");
      return;
    }

    // Password length validation
    if (new_password.length < 6) {
      Alert.alert("Error", "New password must be at least 6 characters long.");
      return;
    }

    // Check if new password is different from old password
    if (old_password === new_password) {
      Alert.alert("Error", "New password must be different from current password.");
      return;
    }

    setLoading(true);

    try {
      const result = await changePassword(email, old_password, new_password);
      
      Alert.alert(
        "Success", 
        "Password changed successfully!", 
        [
          {
            text: "OK",
            onPress: () => {
              // Clear form
              setEmail("");
              setOldPassword("");
              setNewPassword("");
              // Go to login screen
              router.push("/login");
            }
          }
        ]
      );
    } catch (error: any) {
      Alert.alert("Password Change Failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={styles.container}>
        {/* Back Button */}
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.replace("/welcome")}
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
            { backgroundColor: (isFormValid && !loading) ? "#800080" : "#ccc" }
          ]} 
          onPress={handleReset} 
          disabled={!isFormValid || loading}
        >
          <Text style={styles.resetPasswordText}>
            {loading ? "Changing..." : "Change Password"}
          </Text>
        </TouchableOpacity>

        {/* Back to Login Link */}
        <TouchableOpacity 
          style={styles.loginLink} 
          onPress={() => router.push("/login")}
          disabled={loading}
        >
          <Text style={styles.loginLinkText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
  loginLink: {
    alignSelf: "center",
    marginTop: 10,
  },
  loginLinkText: {
    color: "#800080",
    fontSize: 14,
    textDecorationLine: "underline",
  },
});