import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect } from "react";
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
import { headerStyles, commonColors, commonSpacing } from "../../styles/commonStyles";

interface CartItem {
  id: number;
  jewelleryId: number;
  quantity: number;
  addedAt: string;
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

// Reusable Header Component
const ScreenHeader = ({ 
  onBackPress, 
  title, 
  rightAction 
}: {
  onBackPress: () => void;
  title: string;
  rightAction?: { onPress: () => void; text: string } | null;
}) => (
  <View style={headerStyles.container}>
    <View style={headerStyles.leftSection}>
      <TouchableOpacity style={headerStyles.backButton} onPress={onBackPress}>
        <Ionicons name="chevron-back" size={28} color={commonColors.primary} />
      </TouchableOpacity>
    </View>
    <View style={headerStyles.centerSection}>
      <Text style={headerStyles.title}>{title}</Text>
    </View>
    <View style={headerStyles.rightSection}>
      {rightAction ? (
        <TouchableOpacity onPress={rightAction.onPress}>
          <Text style={headerStyles.rightButtonText}>{rightAction.text}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  </View>
);

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
      setCartData(data);
    } catch (error: any) {
      console.error("Error fetching cart:", error);
      if (error.response?.status === 401) {
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

  useEffect(
    useCallback(() => {
      fetchCart();
    }, [router, isLoggedIn])
  );

  const updateQuantity = async (jewelleryId: number, change: number, currentQuantity: number) => {
    const newQuantity = currentQuantity + change;
    
    if (newQuantity < 1) return;

    try {
      await updateCartItem(jewelleryId, newQuantity);
      await fetchCart();
    } catch (error: any) {
      console.error("Error updating quantity:", error);
      Alert.alert("Error", "Failed to update item quantity");
    }
  };

  const removeItem = async (jewelleryId: number, itemName: string) => {
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
              await removeFromCart(jewelleryId);
              await fetchCart();
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
              await fetchCart();
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
          { text: "Login", onPress: () => router.push("/login") },
        ]
      );
      return;
    }

    if (!cartData?.items?.length) {
      Alert.alert("Empty Cart", "Your cart is empty. Add some items before checkout.");
      return;
    }

    router.push('/checkout');
  };

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <TouchableOpacity 
      style={styles.cartItemContainer} 
      onPress={() => router.push(`/product-detail?id=${item.jewelleryId}`)} 
    >
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: item.imageUrl }} 
          style={styles.itemImage}
        />
      </View>
      <View style={styles.itemDetails}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemDescription}>{item.description}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.itemPrice}>${item.price.toLocaleString()}</Text>
        </View>
      </View>
      <View style={styles.quantityControls}>
        <View style={styles.quantityRow}>
          <TouchableOpacity
            style={[styles.quantityButton, item.quantity <= 1 && styles.quantityButtonDisabled]}
            onPress={() => updateQuantity(item.jewelleryId, -1, item.quantity)}
            disabled={item.quantity <= 1}
          >
            <Ionicons
              name="remove"
              size={16}
              color={item.quantity <= 1 ? "#ccc" : commonColors.primary}
            />
          </TouchableOpacity>
          <Text style={styles.quantityText}>{item.quantity}</Text>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => updateQuantity(item.jewelleryId, 1, item.quantity)}
          >
            <Ionicons name="add" size={16} color={commonColors.primary} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeItem(item.jewelleryId, item.name)}
        >
          <Ionicons name="trash-outline" size={18} color={commonColors.error} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader
          onBackPress={() => router.back()}
          title="Shopping Cart"
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading cart...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        onBackPress={() => router.back()}
        title="Shopping Cart"
        rightAction={cartData?.items?.length ? { onPress: clearAllItems, text: "Clear" } : null}
      />

      {!isLoggedIn || !cartData?.items?.length ? (
        renderEmptyCart()
      ) : (
        <>
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
              <Ionicons name="card-outline" size={20} color={commonColors.text.white} />
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
    backgroundColor: commonColors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: commonColors.text.secondary,
  },
  cartList: {
    paddingHorizontal: commonSpacing.l,
    paddingTop: 10,
  },
  cartItemContainer: {
    flexDirection: "row",
    backgroundColor: commonColors.background,
    borderRadius: 12,
    padding: commonSpacing.m,
    marginBottom: commonSpacing.m,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
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
    marginRight: commonSpacing.m,
    backgroundColor: "#f8f8f8",
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: commonSpacing.m,
    resizeMode: "cover",
  },
  itemDetails: {
    flex: 1,
    justifyContent: "space-between",
  },
  itemName: {
    fontSize: 16,
    fontWeight: "bold",
    color: commonColors.text.primary,
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: commonColors.text.secondary,
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
    color: commonColors.primary,
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
    backgroundColor: commonColors.background,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
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
    color: commonColors.text.primary,
    marginHorizontal: commonSpacing.m,
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
    padding: commonSpacing.l,
    borderTopWidth: 1,
    borderTopColor: commonColors.border,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 16,
    color: commonColors.text.secondary,
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: "bold",
    color: commonColors.text.primary,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: "bold",
    color: commonColors.primary,
  },
  checkoutButton: {
    backgroundColor: commonColors.primary,
    borderRadius: 12,
    paddingVertical: commonSpacing.m,
    paddingHorizontal: commonSpacing.l,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: commonSpacing.m,
    shadowColor: commonColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  checkoutButtonText: {
    color: commonColors.text.white,
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
    color: commonColors.text.primary,
    marginTop: 20,
    marginBottom: 10,
    textAlign: "center",
  },
  emptyCartSubtitle: {
    fontSize: 16,
    color: commonColors.text.secondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 30,
  },
  shopNowButton: {
    backgroundColor: commonColors.primary,
    borderRadius: 12,
    paddingVertical: commonSpacing.m,
    paddingHorizontal: 30,
  },
  shopNowButtonText: {
    color: commonColors.text.white,
    fontSize: 16,
    fontWeight: "bold",
  },
});