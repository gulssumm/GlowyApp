import { ButtonStyles } from "@/styles/buttons";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Modal, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { loginUser } from "../../api";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const [alert, setAlert] = useState({ visible: false, message: "" });

  const isFormValid = () => {
    return email.trim() !== "" && password.trim() !== "";
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setAlert({
        visible: true,
        message: "Please fill in all fields"
      });
      return;
    }

    try {
      const response = await loginUser(email, password);
      console.log("Login response:", response);

      if (response.user && response.token) {
        console.log("User data from API:", response.user);
        await login(response.user);
        router.replace("/main");
      } else {
        console.error("No user data in response:", response);
        setAlert({
          visible: true,
          message: "Login successful but user data is missing"
        });
      }
    } catch (err: any) {
      console.error("Login error:", err);
      
      setAlert({
        visible: true,
        message: "Invalid email or password. Please try again."
      });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#800080" />
        </TouchableOpacity>
        
        <Text style={styles.title}>Login</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Email Address"
          placeholderTextColor="#aaa"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#aaa"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          autoCapitalize="none"
        />
        
        <TouchableOpacity 
          style={[
            styles.logInButton,
            !isFormValid() && styles.disabledButton
          ]} 
          onPress={handleLogin}
          disabled={!isFormValid()}
        >
          <Text style={[
            styles.loginText,
            !isFormValid() && styles.disabledText
          ]}>Login</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.forgotButton} onPress={() => router.replace("/forgot-password")}>
          <Text style={styles.Link}>Forgot Password?</Text>
        </TouchableOpacity>
        
        <View style={styles.signupContainer}>
          <Text style={styles.Text}>Don't you have an account? </Text>
          <TouchableOpacity onPress={() => router.replace("/signup")}>
            <Text style={styles.Link}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Custom Alert Modal */}
      <Modal
        transparent={true}
        visible={alert.visible}
        animationType="fade"
      >
        <View style={ButtonStyles.alertOverlay}>
          <View style={ButtonStyles.alertBox}>
            <View style={ButtonStyles.alertIcon}>
              <Ionicons name="alert-circle" size={50} color="#ff4444" />
            </View>
            <Text style={ButtonStyles.alertMessage}>{alert.message}</Text>
            <TouchableOpacity 
              style={ButtonStyles.alertButton}
              onPress={() => setAlert({ visible: false, message: "" })}
            >
              <Text style={ButtonStyles.alertButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, justifyContent: "center", alignItems: "stretch" },
  title: { fontSize: 35, fontWeight: "bold", marginTop: 20, marginBottom: 20, textAlign: "center", color: "#800080" },
  backButton: { position: "absolute", top: 50, left: 20, backgroundColor: "white", borderRadius: 20, padding: 8, shadowColor: "#000", shadowOpacity: 0.1, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 3, zIndex: 1 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 15, fontSize: 16, color: "black", width: "80%", alignSelf: "center" },
  logInButton: { backgroundColor: "#800080", alignItems: "center", alignSelf: "center", padding: 15, width: "25%", height: "6%", borderRadius: 10, marginTop: 10, marginBottom: 40 },
  disabledButton: { backgroundColor: "#ccc" },
  loginText: { color: "#fff", fontSize: 16, fontWeight: "bold", textAlign: "center" },
  disabledText: { color: "#fff" },
  forgotButton: { alignSelf: "center", marginBottom: 20 },
  Link: { color: "#800080", fontSize: 14, textDecorationLine: "underline" },
  Text: { color: "#800080", fontSize: 14 },
  signupContainer: { flexDirection: "row", marginTop: 20, alignSelf: "center" },
});