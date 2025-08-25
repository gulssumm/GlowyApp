import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { loginUser } from "../../api";

export default function Login() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Please fill in all fields");
      return;
    }

    try {
      const user = await loginUser(email, password);
      // Alert.alert("Login Success", JSON.stringify(name));
      router.replace("/main");
    } catch (err) {
      alert(err);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={styles.container}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace("/main")}>
          <Ionicons name="chevron-back" size={28} color="#800080" />
        </TouchableOpacity>

        {/* Title */}
        <Text style={styles.title}>Login</Text>

        {/* Inputs */}
        <TextInput
          style={styles.input}
          placeholder="Email Address"
          placeholderTextColor="#aaa"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#aaa"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {/* Login Button */}
        <TouchableOpacity style={styles.logInButton} onPress={handleLogin}>
          <Text style={styles.loginText}>Login</Text>
        </TouchableOpacity>

        {/* Forgot Password */}
        <TouchableOpacity 
        style={styles.forgotButton} 
        onPress={() => router.replace("/forgot-password")}
        >
        <Text style={styles.Link}>Forgot Password?</Text>
        </TouchableOpacity>

        {/* Sign up link */}
        <View style={styles.signupContainer}>
          <Text style={styles.Text}>Don’t you have an account? </Text>
          <TouchableOpacity onPress={() => router.replace("/signup")}>
            <Text style={styles.Link}>Sign Up</Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "stretch",
  },
  title: {
    fontSize: 35,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 20,
    textAlign: "center",
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
  logInButton: {
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
  loginText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  forgotButton: {
    alignSelf: "center",
    marginBottom: 20,
  },
  Link: {
    color: "#800080",
    fontSize: 14,
    textDecorationLine: "underline",
  },
  Text: {
    color: "#800080",
    fontSize: 14,
  },
  signupContainer:{
    flexDirection: "row",
    marginTop: 20,
    alignSelf: "center",
  }
});
