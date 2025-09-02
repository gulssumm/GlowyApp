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
import { getUserOrders } from "../../api";
import { useAuth } from "../../context/AuthContext";

interface OrderItem {
  id: number;
  jewelleryId: number;
  name: string;
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
  status: string; // "Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled"
  orderDate: string;
  paymentMethod: string; // "CreditCard", "PayPal", "BankTransfer"
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

export default function MyOrder() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }

    try {
      const response = await getUserOrders();
      setOrders(response);
    } catch (error: any) {
      console.error("Error fetching orders:", error);
      Alert.alert("Error", "Failed to load orders");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
  };

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [isLoggedIn])
  );

  const getImageUrl = (imageUrl: string) => {
    if (imageUrl.startsWith('http')) {
    return imageUrl;
    }
    const fullUrl = `${process.env.API_IMAGE_BASE_URL}/images/jewelry/${imageUrl}`;
    console.log('Image URL:', fullUrl);
    return fullUrl;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
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

  const renderOrderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity 
      style={styles.orderCard}
      onPress={() => router.push(`/order-detail?orderId=${item.id}`)}
    >
      {/* Order Header */}
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderId}>Order #{item.id}</Text>
          <Text style={styles.orderDate}>{formatDate(item.orderDate)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status as keyof typeof STATUS_COLORS] }]}>
          <Ionicons 
            name={STATUS_ICONS[item.status as keyof typeof STATUS_ICONS] as any} 
            size={16} 
            color="#fff" 
          />
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      {/* Order Items Preview */}
      <View style={styles.itemsPreview}>
        <View style={styles.itemsContainer}>
          {item.items.slice(0, 3).map((orderItem, index) => (
            <Image 
              key={orderItem.id} 
              source={{ uri: getImageUrl(orderItem.imageUrl) }} 
              style={[
                styles.itemPreviewImage,
                index > 0 && { marginLeft: -10 }
              ]} 
            />
          ))}
          {item.items.length > 3 && (
            <View style={[styles.moreItemsIndicator, { marginLeft: -10 }]}>
              <Text style={styles.moreItemsText}>+{item.items.length - 3}</Text>
            </View>
          )}
        </View>
        <View style={styles.itemsInfo}>
          <Text style={styles.itemCount}>
            {item.items.length} item{item.items.length > 1 ? 's' : ''}
          </Text>
          <Text style={styles.totalAmount}>${item.totalAmount.toLocaleString()}</Text>
        </View>
      </View>

      {/* Order Details */}
      <View style={styles.orderDetails}>
        <View style={styles.detailRow}>
          <Ionicons name={PAYMENT_METHOD_ICONS[item.paymentMethod as keyof typeof PAYMENT_METHOD_ICONS] as any} size={16} color="#666" />
          <Text style={styles.detailText}>{getPaymentMethodName(item.paymentMethod)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.detailText} numberOfLines={1}>
            {item.address.city}, {item.address.state}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{formatTime(item.orderDate)}</Text>
        </View>
      </View>

      {/* Action Arrow */}
      <View style={styles.actionArrow}>
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="bag-outline" size={80} color="#ccc" />
      <Text style={styles.emptyTitle}>No Orders Yet</Text>
      <Text style={styles.emptySubtitle}>
        Your orders will appear here once you make a purchase
      </Text>
      <TouchableOpacity style={styles.shopButton} onPress={() => router.push('/main')}>
        <Text style={styles.shopButtonText}>Start Shopping</Text>
      </TouchableOpacity>
    </View>
  );

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color="#800080" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Orders</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="person-outline" size={80} color="#ccc" />
          <Text style={styles.emptyTitle}>Please Log In</Text>
          <Text style={styles.emptySubtitle}>
            Log in to view your order history
          </Text>
          <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/auth/login')}>
            <Text style={styles.loginButtonText}>Log In</Text>
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
        <Text style={styles.headerTitle}>My Orders</Text>
        <TouchableOpacity onPress={onRefresh} disabled={refreshing}>
          <Ionicons 
            name="refresh" 
            size={24} 
            color={refreshing ? "#ccc" : "#800080"} 
          />
        </TouchableOpacity>
      </View>

      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={orders.length === 0 ? styles.emptyList : styles.ordersList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#800080']}
            tintColor="#800080"
          />
        }
        ListEmptyComponent={!loading ? renderEmptyState : null}
      />

      {loading && orders.length === 0 && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      )}
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
    marginLeft: 15,
  },
  ordersList: {
    padding: 20,
  },
  emptyList: {
    flex: 1,
  },
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  orderDate: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  itemsPreview: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  itemsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemPreviewImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#fff",
  },
  moreItemsIndicator: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  moreItemsText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
  itemsInfo: {
    alignItems: "flex-end",
  },
  itemCount: {
    fontSize: 14,
    color: "#666",
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#800080",
    marginTop: 2,
  },
  orderDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  detailText: {
    fontSize: 12,
    color: "#666",
  },
  actionArrow: {
    position: "absolute",
    right: 16,
    top: "50%",
    transform: [{ translateY: -10 }],
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
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 24,
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
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.8)",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    marginTop: 10,
  },
});