import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Alert,
    FlatList,
    Image,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { getOrderById } from "../../api";
import { useAuth } from "../../context/AuthContext";

interface OrderItem {
  id: number;
  jewelleryId: number;
  name: string;
  description: string;
  imageUrl: string;
  quantity: number;
  price: number;
}

interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface Order {
  id: number;
  totalAmount: number;
  status: string;
  orderDate: string;
  paymentMethod: string;
  address: Address;
  items: OrderItem[];
}

const STATUS_COLORS = {
  'Pending': '#FF9800',
  'Confirmed': '#4CAF50',
  'Processing': '#2196F3',
  'Shipped': '#9C27B0',
  'Delivered': '#4CAF50',
  'Cancelled': '#F44336'
};

const STATUS_ICONS = {
  'Pending': 'time-outline',
  'Confirmed': 'checkmark-circle-outline',
  'Processing': 'build-outline',
  'Shipped': 'airplane-outline',
  'Delivered': 'checkmark-done-circle-outline',
  'Cancelled': 'close-circle-outline'
};

const PAYMENT_METHOD_ICONS = {
  'CreditCard': 'card-outline',
  'PayPal': 'logo-paypal',
  'BankTransfer': 'business-outline'
};

export default function OrderDetailScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams();
  const { isLoggedIn } = useAuth();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrderDetails = async () => {
    if (!isLoggedIn || !orderId) {
      setLoading(false);
      return;
    }

    try {
      const response = await getOrderById(parseInt(orderId as string));
      setOrder(response);
    } catch (error: any) {
      console.error("Error fetching order details:", error);
      Alert.alert("Error", "Failed to load order details");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId, isLoggedIn]);

  const getImageUrl = (imageUrl: string) => {
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    const baseUrl = process.env.API_IMAGE_BASE_URL || 'http://localhost:5000';
    return `${baseUrl}/images/jewelry/${imageUrl}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case 'CreditCard': return 'Credit Card';
      case 'PayPal': return 'PayPal';
      case 'BankTransfer': return 'Bank Transfer';
      default: return method;
    }
  };

  const renderOrderItem = ({ item }: { item: OrderItem }) => (
    <TouchableOpacity 
      style={styles.orderItemCard}
      onPress={() => router.push(`/product-detail?id=${item.jewelleryId}`)}
    >
      <Image source={{ uri: getImageUrl(item.imageUrl) }} style={styles.itemImage} />
      <View style={styles.itemDetails}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.itemPriceRow}>
          <Text style={styles.itemPrice}>${item.price.toLocaleString()}</Text>
          <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
        </View>
        <Text style={styles.itemTotal}>
          Total: ${(item.price * item.quantity).toLocaleString()}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color="#800080" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Details</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color="#800080" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Details</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="warning-outline" size={80} color="#ccc" />
          <Text style={styles.emptyTitle}>Order Not Found</Text>
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
        <Text style={styles.headerTitle}>Order #{order.id}</Text>
      </View>

      <FlatList
        data={order.items}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <View>
            {/* Order Status */}
            <View style={styles.statusSection}>
              <View style={[
                styles.statusBadge, 
                { backgroundColor: STATUS_COLORS[order.status as keyof typeof STATUS_COLORS] }
              ]}>
                <Ionicons 
                  name={STATUS_ICONS[order.status as keyof typeof STATUS_ICONS] as any} 
                  size={24} 
                  color="#fff" 
                />
                <Text style={styles.statusText}>{order.status}</Text>
              </View>
              <Text style={styles.orderDate}>{formatDate(order.orderDate)}</Text>
            </View>

            {/* Order Summary */}
            <View style={styles.summaryCard}>
              <Text style={styles.sectionTitle}>Order Summary</Text>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Items ({order.items.length})</Text>
                <Text style={styles.summaryValue}>
                  ${order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()}
                </Text>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>${order.totalAmount.toLocaleString()}</Text>
              </View>
            </View>

            {/* Payment Method */}
            <View style={styles.infoCard}>
              <Text style={styles.sectionTitle}>Payment Method</Text>
              <View style={styles.paymentRow}>
                <Ionicons 
                  name={PAYMENT_METHOD_ICONS[order.paymentMethod as keyof typeof PAYMENT_METHOD_ICONS] as any} 
                  size={24} 
                  color="#666" 
                />
                <Text style={styles.paymentText}>{getPaymentMethodName(order.paymentMethod)}</Text>
              </View>
            </View>

            {/* Shipping Address */}
            <View style={styles.infoCard}>
              <Text style={styles.sectionTitle}>Shipping Address</Text>
              <View style={styles.addressContainer}>
                <Text style={styles.addressText}>{order.address.street}</Text>
                <Text style={styles.addressText}>
                  {order.address.city}, {order.address.state} {order.address.postalCode}
                </Text>
                <Text style={styles.addressText}>{order.address.country}</Text>
              </View>
            </View>

            {/* Order Items Header */}
            <View style={styles.itemsHeader}>
              <Text style={styles.sectionTitle}>Order Items</Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 15,
  },
  content: {
    padding: 20,
  },
  statusSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    marginBottom: 10,
  },
  statusText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  orderDate: {
    fontSize: 16,
    color: "#666",
  },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 4,
  },
  summaryLabel: {
    fontSize: 16,
    color: "#666",
  },
  summaryValue: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#800080",
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  paymentText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  addressContainer: {
    gap: 4,
  },
  addressText: {
    fontSize: 16,
    color: "#333",
    lineHeight: 22,
  },
  itemsHeader: {
    marginBottom: 12,
  },
  orderItemCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  itemDetails: {
    flex: 1,
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
  itemPriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  itemQuantity: {
    fontSize: 14,
    color: "#666",
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#800080",
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
  },
});