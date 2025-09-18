import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  createAddress,
  createOrder,
  getCart,
  getUserAddresses
} from "../../api";
import { useAuth } from "../../context/AuthContext";
import { AddressForm, AddressFormData } from "@/components/AddressForm";
import { ButtonStyles } from "@/styles/buttons";
import { commonColors, commonSpacing } from "@/styles/commonStyles";
import { PAYMENT_METHODS } from "@/constants/payment_methods";

interface CartItem {
  id: number;
  jewelleryId: number;
  quantity: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
}

interface CartData {
  id: number;
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
}

interface Address {
  id: number;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export default function CheckoutScreen() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  const [cartData, setCartData] = useState<CartData | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Address form modal
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressForm, setAddressForm] = useState({
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    isDefault: false
  });

  const fetchData = async () => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }

    try {
      const [cartResponse, addressResponse] = await Promise.all([
        getCart(),
        getUserAddresses()
      ]);

      setCartData(cartResponse);
      setAddresses(addressResponse);

      const defaultAddress = addressResponse.find((addr: Address) => addr.isDefault);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
      } else if (addressResponse.length > 0) {
        setSelectedAddressId(addressResponse[0].id);
      }

    } catch (error: any) {
      console.error("Error fetching checkout data:", error);
      Alert.alert("Error", "Failed to load checkout data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(
    useCallback(() => {
      fetchData();
    }, [router, isLoggedIn])
  );

  const getImageUrl = (imageUrl: string) => {
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    const fullUrl = `${process.env.API_IMAGE_BASE_URL}/images/jewelry/${imageUrl}`;
    console.log('Image URL:', fullUrl);
    return fullUrl;
  };

  const handleCreateAddress = async (data: AddressFormData) => {
    if (
      data.street.trim() === '' ||
      data.city.trim() === '' ||
      data.state.trim() === '' ||
      data.postalCode.trim() === '' ||
      data.country.trim() === ''
    ) {
      Alert.alert("Error", "Please fill in all address fields");
      return;
    }

    try {
      await createAddress(data);
      setShowAddressModal(false);
      setAddressForm({
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
        isDefault: false
      });

      const addressResponse = await getUserAddresses();
      setAddresses(addressResponse);

      const newAddress = addressResponse.find((addr: Address) =>
        addr.street === data.street && addr.city === data.city
      );
      if (newAddress && (data.isDefault || !selectedAddressId)) {
        setSelectedAddressId(newAddress.id);
      }

      Alert.alert("Success", "Address added successfully!");
    } catch (error: any) {
      console.error("Error creating address:", error);
      Alert.alert("Error", "Failed to create address");
    }
  };
  const validateCheckout = () => {
    if (!selectedAddressId) {
      Alert.alert("Error", "Please select a delivery address.");
      return false;
    }
    if (!selectedPaymentMethod) {
      Alert.alert("Error", "Please select a payment method.");
      return false;
    }
    if (!cartData?.items?.length) {
      Alert.alert("Error", "Your cart is empty.");
      return false;
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateCheckout()) return;

    setSubmitting(true);
    try {
      await createOrder({
        addressId: selectedAddressId!,
        paymentMethod: selectedPaymentMethod
      });

      Alert.alert(
        "Order Confirmed",
        "Your order has been confirmed successfully!",
        [{ text: "OK", onPress: () => router.replace('/main') }]
      );
    } catch (error: any) {
      console.error("Error placing order:", error);
      Alert.alert("Error", "Failed to place order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItem}>
      <Image source={{ uri: getImageUrl(item.imageUrl) }} style={styles.itemImage} />
      <View style={styles.itemDetails}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPrice}>${(item.price * item.quantity).toLocaleString()}</Text>
      </View>
    </View>
  );

  const renderAddressCard = (address: Address) => (
    <TouchableOpacity
      key={address.id}
      style={[styles.addressCard, selectedAddressId === address.id && styles.selectedCard]}
      onPress={() => setSelectedAddressId(address.id)}
    >
      <View style={styles.addressHeader}>
        <View style={ButtonStyles.radioButton}>
          {selectedAddressId === address.id && <View style={ButtonStyles.radioButtonInner} />}
        </View>
        {address.isDefault && (
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultBadgeText}>Default</Text>
          </View>
        )}
      </View>
      <Text style={styles.addressText}>
        {address.street}, {address.city}, {address.state} {address.postalCode}
      </Text>
      <Text style={styles.addressCountry}>{address.country}</Text>
    </TouchableOpacity>
  );

  const renderPaymentMethod = (method: typeof PAYMENT_METHODS[0]) => (
    <TouchableOpacity
      key={method.id}
      style={[styles.paymentCard, selectedPaymentMethod === method.id && styles.selectedCard]}
      onPress={() => setSelectedPaymentMethod(method.id)}
    >
      <View style={styles.paymentHeader}>
        <View style={ButtonStyles.radioButton}>
          {selectedPaymentMethod === method.id && <View style={ButtonStyles.radioButtonInner} />}
        </View>
        <Ionicons name={method.icon as any} size={24} color="#800080" />
        <Text style={styles.paymentText}>{method.name}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color="#800080" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isLoggedIn || !cartData?.items?.length) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color="#800080" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="bag-outline" size={80} color="#ccc" />
          <Text style={styles.emptyTitle}>No items to checkout</Text>
          <TouchableOpacity style={styles.shopButton} onPress={() => router.push('/main')}>
            <Text style={styles.shopButtonText}>Continue Shopping</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#800080" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <FlatList
            data={cartData.items}
            renderItem={renderCartItem}
            keyExtractor={item => item.id.toString()}
            scrollEnabled={false}
          />
          <View style={styles.totalContainer}>
            <Text style={styles.totalText}>Total: ${cartData.totalAmount.toLocaleString()}</Text>
          </View>
        </View>

        {/* Delivery Address */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <TouchableOpacity style={ButtonStyles.addButton} onPress={() => setShowAddressModal(true)}>
              <Ionicons name="add" size={20} color="#800080" />
              <Text style={ButtonStyles.addButtonText}>Add New</Text>
            </TouchableOpacity>
          </View>
          {addresses.length === 0 ? (
            <View style={styles.emptySection}>
              <Text style={styles.emptySectionText}>No addresses found</Text>
              <TouchableOpacity style={ButtonStyles.addFirstButton} onPress={() => setShowAddressModal(true)}>
                <Text style={ButtonStyles.addFirstButtonText}>Add Address</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.addressList}>{addresses.map(renderAddressCard)}</View>
          )}
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.paymentList}>{PAYMENT_METHODS.map(renderPaymentMethod)}</View>
        </View>
      </ScrollView>

      {/* Place Order Button */}
      <View style={ButtonStyles.footer}>
        <TouchableOpacity
          style={[ButtonStyles.placeOrderButton, (!selectedAddressId || !selectedPaymentMethod || submitting) && ButtonStyles.placeOrderButtonDisabled]}
          onPress={handlePlaceOrder}
          disabled={!selectedAddressId || !selectedPaymentMethod || submitting}
        >
          {submitting ? (
            <Text style={ButtonStyles.placeOrderButtonText}>Placing Order...</Text>
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={ButtonStyles.placeOrderButtonText}>Place Order</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Add Address Modal */}
      <Modal
        visible={showAddressModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddressModal(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 0, justifyContent: "center" }}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add New Address</Text>
                <TouchableOpacity onPress={() => setShowAddressModal(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              <ScrollView
                style={styles.modalBody}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <AddressForm
                  initialData={addressForm}
                  onSubmit={handleCreateAddress}
                  submitting={submitting}
                  onCancel={() => setShowAddressModal(false)}
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 15,
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
  },
  section: {
    marginTop: 20,
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  cartItem: {
    flexDirection: "row",
    padding: 15,
    backgroundColor: "#f8f8f8",
    borderRadius: 10,
    marginBottom: 10,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 15,
  },
  itemDetails: {
    flex: 1,
    justifyContent: "space-between",
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  itemQuantity: {
    fontSize: 14,
    color: "#666",
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#800080",
  },
  totalContainer: {
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 15,
    marginTop: 10,
  },
  totalText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    textAlign: "right",
  },
  emptySection: {
    alignItems: "center",
    paddingVertical: 30,
    backgroundColor: "#f8f8f8",
    borderRadius: 10,
  },
  emptySectionText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 15,
  },
  addressList: {
    gap: 10,
  },
  addressCard: {
    padding: 15,
    borderWidth: 2,
    borderColor: "#eee",
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  selectedCard: {
    borderColor: "#800080",
    backgroundColor: "#f8f4ff",
  },
  addressHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  defaultBadge: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: "auto",
  },
  defaultBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  addressText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  addressCountry: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  paymentList: {
    gap: 10,
  },
  paymentCard: {
    padding: 15,
    borderWidth: 2,
    borderColor: "#eee",
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  paymentHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  paymentText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
    marginLeft: 15,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 20,
    marginBottom: 30,
  },
  shopButton: {
    backgroundColor: "#800080",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
  },
  shopButtonText: {
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
  },
  input: {
    borderWidth: 1,
    borderColor: commonColors.border,
    borderRadius: 8,
    paddingHorizontal: commonSpacing.m,
    paddingVertical: commonSpacing.m,
    fontSize: 16,
    marginBottom: commonSpacing.m,
    backgroundColor: commonColors.background,
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