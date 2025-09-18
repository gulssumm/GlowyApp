import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { createAddress, deleteAddress, getUserAddresses, updateAddress } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { AddressForm, AddressFormData } from "@/components/AddressForm";
import { ButtonStyles } from "@/styles/buttons";

interface Address {
  id: number;
  userId: number;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AddressesScreen() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<AddressFormData>({
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    isDefault: false
  });

  const fetchAddresses = async () => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }

    try {
      const addressData = await getUserAddresses();
      setAddresses(addressData);
    } catch (error: any) {
      console.error("Error fetching addresses:", error);
      if (error.response?.status === 401) {
        Alert.alert("Session Expired", "Please log in again");
        router.replace("/login");
      } else {
        Alert.alert("Error", "Failed to load addresses");
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAddresses();
    setRefreshing(false);
  }, [isLoggedIn]);

  useEffect(
    useCallback(() => {
      fetchAddresses();
    }, [router, isLoggedIn])
  );

  const resetForm = () => {
    setFormData({
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      isDefault: false
    });
    setEditingAddress(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (address: Address) => {
    setFormData({
      street: address.street,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      isDefault: address.isDefault
    });
    setEditingAddress(address);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const isFormValid = () => {
    return formData.street.trim() !== '' &&
      formData.city.trim() !== '' &&
      formData.state.trim() !== '' &&
      formData.postalCode.trim() !== '' &&
      formData.country.trim() !== '';
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setSubmitting(true);
    try {
      if (editingAddress) {
        // Update existing address
        await updateAddress(editingAddress.id, formData);
        Alert.alert("Success", "Address updated successfully!");
      } else {
        // Create new address
        await createAddress(formData);
        Alert.alert("Success", "Address added successfully!");
      }

      closeModal();
      await fetchAddresses();
    } catch (error: any) {
      console.error("Error saving address:", error);
      Alert.alert("Error", "Failed to save address");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (address: Address) => {
    Alert.alert(
      "Delete Address",
      `Are you sure you want to delete this address?\n\n${address.street}, ${address.city}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAddress(address.id);
              Alert.alert("Success", "Address deleted successfully!");
              await fetchAddresses();
            } catch (error: any) {
              console.error("Error deleting address:", error);
              Alert.alert("Error", "Failed to delete address");
            }
          }
        }
      ]
    );
  };

  const renderAddress = (address: Address) => (
    <View key={address.id} style={styles.addressCard}>
      <View style={styles.addressHeader}>
        <View style={styles.addressInfo}>
          {address.isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultBadgeText}>Default</Text>
            </View>
          )}
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => openEditModal(address)}
          >
            <Ionicons name="create-outline" size={20} color="#800080" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(address)}
          >
            <Ionicons name="trash-outline" size={20} color="#ff4444" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.addressContent}>
        <Text style={styles.addressText}>{address.street}</Text>
        <Text style={styles.addressText}>
          {address.city}, {address.state} {address.postalCode}
        </Text>
        <Text style={styles.addressCountry}>{address.country}</Text>
      </View>

      <View style={styles.addressMeta}>
        <Text style={styles.metaText}>
          Added: {new Date(address.createdAt).toLocaleDateString()}
        </Text>
        {address.createdAt !== address.updatedAt && (
          <Text style={styles.metaText}>
            Updated: {new Date(address.updatedAt).toLocaleDateString()}
          </Text>
        )}
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="location-outline" size={80} color="#ccc" />
      <Text style={styles.emptyTitle}>No Addresses Found</Text>
      <Text style={styles.emptySubtitle}>
        Add your first address to get started with faster checkout.
      </Text>
      <TouchableOpacity style={styles.addFirstButton} onPress={openCreateModal}>
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.addFirstButtonText}>Add Address</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color="#800080" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Addresses</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading addresses...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color="#800080" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Addresses</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Please log in</Text>
          <TouchableOpacity style={styles.loginButton} onPress={() => router.push("/login")}>
            <Text style={styles.loginButtonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#800080" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Addresses</Text>
        {addresses.length > 0 && (
          <TouchableOpacity style={ButtonStyles.addButton} onPress={openCreateModal}>
            <Ionicons name="add" size={24} color="#800080" />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {addresses.length === 0 ? (
        renderEmptyState()
      ) : (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {addresses.map(renderAddress)}

          {/* Add New Button */}
          <TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
            <Ionicons name="add-circle-outline" size={24} color="#800080" />
            <Text style={styles.addButtonText}>Add New Address</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Add/Edit Address Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 0, justifyContent: "center" }}
          >
            <View style={styles.modalContent}>
              <View style={[styles.modalHeader, { borderBottomWidth: 0 }]}>
                <Text style={styles.modalTitle}>Add New Address</Text>
                <TouchableOpacity onPress={closeModal}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalBody}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <AddressForm
                  initialData={formData}
                  onSubmit={handleSubmit}
                  submitting={submitting}
                  onCancel={closeModal}
                  inputStyle={styles.input}
                  inputRowStyle={styles.inputRow}
                  halfInputStyle={styles.halfInput}
                  checkboxContainerStyle={styles.checkboxContainer}
                  checkboxStyle={styles.checkbox}
                  checkboxTextStyle={styles.checkboxText}
                />
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 20,
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  addressCard: {
    backgroundColor: "#f8f4ff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  addressInfo: {
    flex: 1,
  },
  defaultBadge: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  defaultBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 10,
  },
  editButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
  },
  deleteButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#fff5f5",
  },
  addressContent: {
    marginBottom: 10,
  },
  addressText: {
    fontSize: 16,
    color: "#333",
    marginBottom: 2,
  },
  addressCountry: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
  },
  addressMeta: {
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metaText: {
    fontSize: 12,
    color: "#666",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    backgroundColor: "#f8f4ff",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#800080",
    borderStyle: "dashed",
    marginBottom: 20,
  },
  addButtonText: {
    fontSize: 16,
    color: "#800080",
    fontWeight: "600",
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginTop: 20,
    marginBottom: 10,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 30,
  },
  addFirstButton: {
    backgroundColor: "#800080",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 12,
  },
  addFirstButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  loginButton: {
    backgroundColor: "#800080",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "100%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  inputRow: {
    flexDirection: "row",
    gap: 10,
  },
  halfInput: {
    flex: 1,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: "#800080",
    borderRadius: 4,
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxText: {
    fontSize: 16,
    color: "#333",
  },
  modalFooter: {
    flexDirection: "row",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    gap: 10,
  },
});