import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [old_password, setold_Password] = useState("");
  const [new_password, setnew_Password] = useState("");

  const handleLogin = () => {
    if (!username || !old_password || !new_password) {
      alert("Please fill in all fields");
      return;
    }
    router.push("/main");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={styles.container}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace("/welcome")}>
          <Ionicons name="chevron-back" size={28} color="#800080" />
        </TouchableOpacity>

        {/* Title */}
        <Text style={styles.title}>New Password</Text>

        {/* Inputs */}
        <TextInput
          style={styles.input}
          placeholder="Old Password"
          placeholderTextColor="#aaa"
          value={old_password}
          onChangeText={setold_Password}
        />
        <TextInput
          style={styles.input}
          placeholder="New Password"
          placeholderTextColor="#aaa"
          secureTextEntry
          value={new_password}
          onChangeText={setnew_Password}
        />

        {/* Reset Password Button */}
        <TouchableOpacity style={styles.resetPasswordButton} onPress={handleLogin}>
          <Text style={styles.resetPasswordText}>Reset</Text>
        </TouchableOpacity>
        
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
  resetPasswordButton: {
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
  resetPasswordText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },

  forgotButton: {
    alignSelf: "center",
    marginBottom: 20,
  },
  forgotText: {
    color: "#800080",
    fontSize: 14,
    textDecorationLine: "underline",
  },

});
