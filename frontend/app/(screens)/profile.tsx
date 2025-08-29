import { useAuth } from "@/context/AuthContext";
import { ButtonStyles } from "@/styles/buttons";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { logoutUser as apiLogoutUser, testTokenValidation, updateUserProfile } from "../../api";

export default function Profile() {
  const router = useRouter();
  const { user: authUser, logout, updateUser, loading: authLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({ username: "", email: "" });
  const [saving, setSaving] = useState(false);
  const [warning, setWarning] = useState("");

  useEffect(() => {
    if (authUser) {
      setEditedUser({ username: authUser.username, email: authUser.email });
    }
  }, [authUser]);

  const handleSave = async () => {
    if (!editedUser.username.trim() || !editedUser.email.trim()) {
      setWarning("Please fill in all fields!"); // Set warning message
      return;
    }
    setWarning(""); // Clear warning message if validation passes
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editedUser.email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    setSaving(true);
    try {
      if (!authUser?.id) {
        throw new Error("User ID not found");
      }

      // Test token first
      console.log("Testing token before update...");
      await testTokenValidation();
      console.log("Token validation passed, proceeding with update...");

      const updatedUser = await updateUserProfile(authUser.id, {
        username: editedUser.username,
        email: editedUser.email
      });

      await updateUser(updatedUser);
      Alert.alert("Success", "Profile updated successfully!");
      setIsEditing(false);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        Alert.alert("Session Expired", "Please log in again", [
          {
            text: "OK",
            onPress: () => {
              logout();
              router.replace("/welcome");
            }
          }
        ]);
      } else if (error.response?.status === 409) {
        Alert.alert("Error", "Username or email already taken by another user");
      } else {
        const errorMessage = error.response?.data?.message || error.message || "Failed to update profile";
        Alert.alert("Error", errorMessage);
      }
      
      // Reset form to original values on error
      if (authUser) {
        setEditedUser({ username: authUser.username, email: authUser.email });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (authUser) {
      setEditedUser({ username: authUser.username, email: authUser.email });
    }
    setIsEditing(false);
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await apiLogoutUser();
            await logout();
            router.replace("/welcome");
          } catch (error) {
            console.error("Logout error:", error);
            await logout();
            router.replace("/welcome");
          }
        }
      }
    ]);
  };

  if (authLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!authUser) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Please log in to view your profile</Text>
          <TouchableOpacity 
            style={styles.loginButton} 
            onPress={() => router.replace("/login")}
          >
            <Text style={styles.loginButtonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#800080" />
        </TouchableOpacity>
        
        {warning ? (
        <TouchableOpacity style={[ButtonStyles.warning, { marginHorizontal: 20, marginBottom: 10 }]}>
          <Text style={ButtonStyles.text}>{warning}</Text>
        </TouchableOpacity>
      ) : null}

        <Text style={styles.title}>Profile</Text>

        <View style={styles.profileCard}>
          <View style={styles.avatarSection}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={40} color="#800080" />
            </View>
            <Text style={styles.userId}>
              {authUser.username}
            </Text>
          </View>

          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={editedUser.username}
                  onChangeText={text =>
                    setEditedUser(prev => ({ ...prev, username: text }))
                  }
                  editable={!saving}
                  placeholder="Enter username"
                  placeholderTextColor="#aaa"
                />
              ) : (
                <Text style={styles.infoText}>{authUser.username}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={editedUser.email}
                  onChangeText={text =>
                    setEditedUser(prev => ({ ...prev, email: text }))
                  }
                  editable={!saving}
                  placeholder="Enter email"
                  placeholderTextColor="#aaa"
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              ) : (
                <Text style={styles.infoText}>{authUser.email}</Text>
              )}
            </View>
          </View>

          <View style={styles.buttonSection}>
            {isEditing ? (
              <View style={styles.editButtonsRow}>
                <TouchableOpacity 
                  style={[styles.cancelButton, saving && styles.buttonDisabled]} 
                  onPress={handleCancel}
                  disabled={saving}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.saveButton, saving && styles.buttonDisabled]} 
                  onPress={handleSave}
                  disabled={saving}
                >
                  <Text style={styles.saveButtonText}>
                    {saving ? "Saving..." : "Save"}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
                <Ionicons name="create-outline" size={20} color="#fff" />
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.optionsSection}>
            <TouchableOpacity style={styles.optionButton} onPress={() => router.push("/forgot-password")}>
              <Ionicons name="key-outline" size={24} color="#800080" />
              <Text style={styles.optionText}>Change Password</Text>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.optionButton, styles.logoutButton]} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={24} color="#ff4444" />
              <Text style={[styles.optionText, styles.logoutText]}>Logout</Text>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: "#800080",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  title: {
    fontSize: 35,
    fontWeight: "bold",
    marginTop: 80,
    marginBottom: 30,
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
    zIndex: 1,
  },
  debugSection: {
    marginBottom: 20,
    alignItems: "center",
  },
  debugButton: {
    backgroundColor: "#ff6b6b",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  debugButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  profileCard: {
    backgroundColor: "#f8f4ff",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  userId: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
  },
  formSection: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#fff",
  },
  inputDisabled: {
    backgroundColor: "#f5f5f5",
    color: "#666",
  },
  buttonSection: {
    alignItems: "center",
  },
  editButton: {
    backgroundColor: "#800080",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    minWidth: 150,
  },
  editButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  editButtonsRow: {
    flexDirection: "row",
    gap: 15,
  },
  cancelButton: {
    backgroundColor: "#ccc",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    minWidth: 80,
  },
  cancelButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  saveButton: {
    backgroundColor: "#800080",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    minWidth: 80,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  optionsSection: {
    marginTop: 10,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginLeft: 15,
  },
  logoutButton: {
    marginTop: 10,
  },
  logoutText: {
    color: "#ff4444",
  },
  infoText: {
    fontSize: 16,
    color: "#333",
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
  }
});