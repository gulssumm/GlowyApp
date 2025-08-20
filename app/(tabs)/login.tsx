import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function Login() {
  const navigation = useNavigation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    if (!username || !password) {
      alert("Please fill in all fields");
      return;
    }
    navigation.navigate("Main" as never);
  };

  return (
    <View style={styles.container}>
      {/* Title */}
      <Text style={styles.title}>Login</Text>

      {/* Back Button */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.goBack()} // goes to Main screen
      >
        <Text style={styles.backText}>{"<"}</Text>
      </TouchableOpacity>

      {/* Inputs */}
      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor="#aaa"
        value={username}
        onChangeText={setUsername}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 40,
    marginBottom: 30,
    textAlign: "center",
    color: "#800080",
  },
  backButton: {
  position: "absolute",
  top: 50,
  left: 20,
  width: 40,
  height: 40,
  borderRadius: 20, // makes it a circle
  backgroundColor: "#fff", // white background
  borderWidth: 2,
  borderColor: "#6a0dad", // purple border
  alignItems: "center",
  justifyContent: "center",
  shadowColor: "#000",
  shadowOpacity: 0.2,
  shadowRadius: 3,
  elevation: 4, // Android shadow
},
backIcon: {
  fontSize: 20,
  color: "#6a0dad",
  fontWeight: "bold",
},

  backText: {
    fontSize: 24,
    color: "#6a0dad",
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    color: "white",
  },
  logInButton: {
    backgroundColor: "#800080",
    padding: 20,
    alignItems: "center",
    borderRadius: 10,
    marginBottom: 40,
  },
  loginText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});
