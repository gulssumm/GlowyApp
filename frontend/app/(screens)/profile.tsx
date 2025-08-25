import { getCurrentUser } from "@/api";
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

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState({
    id: 0,
    username: "",
    email: ""
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({
    username: "",
    email: ""
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
    const authStatus = await getCurrentUser();
    if (authStatus.isLoggedIn && authStatus.user) {
      setUser(authStatus.user);
      setEditedUser({
        username: authStatus.user.username,
        email: authStatus.user.email
      });
    }
    setLoading(false);
  } catch (error) {
    console.error("Error loading profile:", error);
    setLoading(false);
  }
};

  const handleSave = async () => {
    if (!editedUser.username.trim() || !editedUser.email.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    // Basic email validation
    if (!editedUser.email.includes("@")) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    try {
      // TODO: Add actual API call to update user profile
      // await updateUserProfile(user.id, editedUser);
      
      // Mock success for now
      setUser(prev => ({
        ...prev,
        username: editedUser.username,
        email: editedUser.email
      }));
      
      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile");
    }
  };

  const handleCancel = () => {
    setEditedUser({
      username: user.username,
      email: user.email
    });
    setIsEditing(false);
  };

  const handleChangePassword = () => {
    router.push("/forgot-password");
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          style: "destructive",
          onPress: () => {
            // TODO: Clear user session/token
            router.replace("/login");
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Back Button */}
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={28} color="#800080" />
        </TouchableOpacity>

        {/* Title */}
        <Text style={styles.title}>Profile</Text>

        {/* Profile Info Card */}
        <View style={styles.profileCard}>
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={40} color="#800080" />
            </View>
            <Text style={styles.userId}>ID: {user.id}</Text>
          </View>

          {/* User Info Form */}
          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={isEditing ? editedUser.username : user.username}
                onChangeText={(text) => setEditedUser(prev => ({...prev, username: text}))}
                editable={isEditing}
                placeholder="Enter username"
                placeholderTextColor="#aaa"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={isEditing ? editedUser.email : user.email}
                onChangeText={(text) => setEditedUser(prev => ({...prev, email: text}))}
                editable={isEditing}
                placeholder="Enter email"
                placeholderTextColor="#aaa"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonSection}>
            {isEditing ? (
              <View style={styles.editButtonsRow}>
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={handleCancel}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.saveButton} 
                  onPress={handleSave}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.editButton} 
                onPress={() => setIsEditing(true)}
              >
                <Ionicons name="create-outline" size={20} color="#fff" />
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Additional Options */}
        <View style={styles.optionsSection}>
          <TouchableOpacity 
            style={styles.optionButton}
            onPress={handleChangePassword}
          >
            <Ionicons name="key-outline" size={24} color="#800080" />
            <Text style={styles.optionText}>Change Password</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.optionButton, styles.logoutButton]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={24} color="#ff4444" />
            <Text style={[styles.optionText, styles.logoutText]}>Logout</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
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
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
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
});