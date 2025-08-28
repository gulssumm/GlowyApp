import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { clearCart, getCart, removeFromCart, updateCartItem } from "../../api";
import { useAuth } from "../../context/AuthContext";

interface CartItem {
  id: number;
  jewelleryId: number;
  quantity: number;
  addedAt: string;
  // Direct properties (flattened from jewelry)
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

export default function CartScreen() {
  const router = useRouter();
  const { user, isLoggedIn } = useAuth();
  const [cartData, setCartData] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCart = async () => {
    if (!isLoggedIn) {
      setCartData(null);
      setLoading(false);
      return;
    }

  try {
      const data = await getCart();
      
      console.log("Cart data received:", JSON.stringify(data, null, 2));
      // Debug: Log the structure of cart items
      if (data?.items?.length > 0) {
        console.log("First cart item structure:", JSON.stringify(data.items[0], null, 2));
      }

      setCartData(data);
    } catch (error: any) {
      console.error("Error fetching cart:", error);
      if (error.response?.status === 401) {
        // Token expired or invalid
        Alert.alert("Session Expired", "Please log in again");
        router.replace("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCart();
    setRefreshing(false);
  }, [isLoggedIn]);

  useFocusEffect(
    useCallback(() => {
      fetchCart();
    }, [isLoggedIn])
  );

  const updateQuantity = async (itemId: number, change: number, currentQuantity: number) => {
    const newQuantity = currentQuantity + change;
    
    if (newQuantity < 1) return;

    try {
      await updateCartItem(itemId, newQuantity);
      await fetchCart(); // Refresh cart data
    } catch (error: any) {
      console.error("Error updating quantity:", error);
      Alert.alert("Error", "Failed to update item quantity");
    }
  };

  const removeItem = async (itemId: number, itemName: string) => {
    Alert.alert(
      "Remove Item",
      `Are you sure you want to remove "${itemName}" from your cart?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await removeFromCart(itemId);
              await fetchCart(); // Refresh cart data
            } catch (error: any) {
              console.error("Error removing item:", error);
              Alert.alert("Error", "Failed to remove item from cart");
            }
          },
        },
      ]
    );
  };

  const clearAllItems = async () => {
    if (!cartData?.items?.length) return;

    Alert.alert(
      "Clear Cart",
      "Are you sure you want to remove all items from your cart?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            try {
              await clearCart();
              await fetchCart(); // Refresh cart data
            } catch (error: any) {
              console.error("Error clearing cart:", error);
              Alert.alert("Error", "Failed to clear cart");
            }
          },
        },
      ]
    );
  };

  const handleCheckout = () => {
    if (!isLoggedIn) {
      Alert.alert(
        "Login Required",
        "Please log in to proceed with checkout.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Login",
            onPress: () => router.push("/login"),
          },
        ]
      );
      return;
    }

    if (!cartData?.items?.length) {
      Alert.alert("Empty Cart", "Your cart is empty. Add some items before checkout.");
      return;
    }

    // TODO: Navigate to a checkout screen
    Alert.alert("Checkout", "Checkout functionality will be implemented soon!");
  };

const renderCartItem = ({ item }: { item: CartItem }) => {
  // Construct full image URL if it's just a filename
  const getImageUrl = (imageUrl: string) => {
    if (imageUrl.startsWith('http')) {
      return imageUrl; // Already a full URL
    }
    return `http://192.168.1.130:5000/images/jewelry/${imageUrl}`; // Construct full URL
  };

  const imageUrl = getImageUrl(item.imageUrl);
  const name = item.name;
  const description = item.description;
  const price = item.price;
    
    console.log(`Rendering item: ${name}, Image URL: ${imageUrl}`);
    
    return (
      <View style={styles.cartItemContainer}>
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: imageUrl }} 
            style={styles.itemImage}
            onError={(e) => {
              console.log(`Image failed to load for ${name}:`, e.nativeEvent.error);
              console.log(`Failed URL: ${imageUrl}`);
            }}
            onLoad={() => {
              console.log(`Image loaded successfully for ${name}`);
            }}
          />
        </View>
        <View style={styles.itemDetails}>
          <Text style={styles.itemName}>{name}</Text>
          <Text style={styles.itemDescription}>{description}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.itemPrice}>${price.toLocaleString()}</Text>
          </View>
        </View>
        <View style={styles.quantityControls}>
          <View style={styles.quantityRow}>
            <TouchableOpacity
              style={[styles.quantityButton, item.quantity <= 1 && styles.quantityButtonDisabled]}
              onPress={() => updateQuantity(item.id, -1, item.quantity)}
              disabled={item.quantity <= 1}
            >
              <Ionicons
                name="remove"
                size={16}
                color={item.quantity <= 1 ? "#ccc" : "#800080"}
              />
            </TouchableOpacity>
            <Text style={styles.quantityText}>{item.quantity}</Text>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => updateQuantity(item.id, 1, item.quantity)}
            >
              <Ionicons name="add" size={16} color="#800080" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => removeItem(item.id, name)}
          >
            <Ionicons name="trash-outline" size={18} color="#ff4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmptyCart = () => (
    <View style={styles.emptyCartContainer}>
      <Ionicons name="bag-outline" size={80} color="#ccc" />
      <Text style={styles.emptyCartTitle}>
        {isLoggedIn ? "Your cart is empty" : "Please log in"}
      </Text>
      <Text style={styles.emptyCartSubtitle}>
        {isLoggedIn
        ? "Discover our beautiful jewelry collection and add items to your cart."
        : "Log in to view your cart and save items for later."}
      </Text>
      <TouchableOpacity
        style={styles.shopNowButton}
        onPress={() => isLoggedIn ? router.push("/main") : router.push("/login")}
      >
        <Text style={styles.shopNowButtonText}>
          {isLoggedIn ? "Shop Now" : "Login"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  if(loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={28} color="#800080" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Shopping Cart</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading cart...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={28} color="#800080" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shopping Cart</Text>
        {cartData?.items?.length ? (
          <TouchableOpacity style={styles.clearButton} onPress={clearAllItems}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      {/* Cart Content */}
      {!isLoggedIn || !cartData?.items?.length ? (
        renderEmptyCart()
      ) : (
        <>
          {/* Cart Items List */}
          <FlatList
            data={cartData.items}
            keyExtractor={item => item.id.toString()}
            renderItem={renderCartItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.cartList}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />

          {/* Cart Summary */}
          <View style={styles.cartSummary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Total Items: {cartData.totalItems}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalAmount}>
                ${cartData.totalAmount.toLocaleString()}
              </Text>
            </View>
            <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
              <Ionicons name="card-outline" size={20} color="#fff" />
              <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    textAlign: "center",
    marginRight: 40, // Compensate for clear button
  },
  clearButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  clearButtonText: {
    color: "#ff4444",
    fontSize: 16,
    fontWeight: "600",
  },
  cartList: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  cartItemContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f5f5f5",
  },
  imageContainer: {
    width: 90,
    height: 90,
    borderRadius: 8,
    overflow: "hidden",
    marginRight: 15,
    backgroundColor: "#f8f8f8", // Fallback background
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
    resizeMode: "cover", // This will crop the image to fit properly
  },
  itemDetails: {
    flex: 1,
    justifyContent: "space-between",
  },
  itemName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#800080",
  },
  quantityControls: {
    alignItems: "center",
    justifyContent: "space-between",
    marginLeft: 10,
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f4ff",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 10,
  },
  quantityButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  quantityButtonDisabled: {
    backgroundColor: "#f5f5f5",
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginHorizontal: 15,
    minWidth: 20,
    textAlign: "center",
  },
  removeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#fff5f5",
  },
  cartSummary: {
    backgroundColor: "#f8f4ff",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 16,
    color: "#666",
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#800080",
  },
  checkoutButton: {
    backgroundColor: "#800080",
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
    shadowColor: "#800080",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  checkoutButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
  },
  emptyCartContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyCartTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginTop: 20,
    marginBottom: 10,
    textAlign: "center",
  },
  emptyCartSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 30,
  },
  shopNowButton: {
    backgroundColor: "#800080",
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 30,
  },
  shopNowButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});