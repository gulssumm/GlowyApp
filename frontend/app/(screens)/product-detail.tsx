import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Dimensions,
    Image,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { addToCart as apiAddToCart, getAllJewelries } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { ButtonStyles } from "../../styles/buttons";

const { width: screenWidth } = Dimensions.get('window');

interface Jewellery {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
}

// Custom Alert Component (same as in main.tsx)
interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  buttons: Array<{
    text: string;
    onPress: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }>;
  onClose: () => void;
  icon?: string;
}

const CustomAlert: React.FC<CustomAlertProps> = ({ visible, title, message, buttons, onClose, icon }) => {
  if (!visible) return null;

  const getButtonStyle = (style?: string) => {
    switch (style) {
      case 'destructive':
        return ButtonStyles.warning;
      case 'cancel':
        return ButtonStyles.secondary;
      default:
        return ButtonStyles.primary;
    }
  };

  const getButtonTextStyle = (style?: string) => {
    switch (style) {
      case 'cancel':
        return { ...ButtonStyles.text, color: '#333' };
      default:
        return ButtonStyles.text;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={ButtonStyles.alertOverlay}>
        <View style={ButtonStyles.alertBox}>
          {icon && (
            <Ionicons 
              name={icon as any} 
              size={50} 
              color="#800080" 
              style={ButtonStyles.alertIcon}
            />
          )}
          <Text style={[ButtonStyles.alertMessage, { fontWeight: 'bold', fontSize: 18, marginBottom: 10 }]}>
            {title}
          </Text>
          <Text style={ButtonStyles.alertMessage}>
            {message}
          </Text>
          
          {buttons.length === 1 ? (
            <TouchableOpacity 
              style={ButtonStyles.alertButton} 
              onPress={() => {
                buttons[0].onPress();
                onClose();
              }}
            >
              <Text style={ButtonStyles.alertButtonText}>{buttons[0].text}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.alertButtonContainer}>
              {buttons.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    getButtonStyle(button.style),
                    {
                      flex: 1,
                      marginHorizontal: 5,
                      marginTop: 10,
                    }
                  ]}
                  onPress={() => {
                    button.onPress();
                    onClose();
                  }}
                >
                  <Text style={getButtonTextStyle(button.style)}>
                    {button.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { isLoggedIn } = useAuth();
  const [product, setProduct] = useState<Jewellery | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  
  // Custom Alert State
  const [customAlert, setCustomAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons: Array<{
      text: string;
      onPress: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }>;
    icon?: string;
  }>({
    visible: false,
    title: '',
    message: '',
    buttons: [],
  });

  // Custom Alert Helper Function
  const showCustomAlert = (
    title: string, 
    message: string, 
    buttons: Array<{
      text: string;
      onPress: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }>,
    icon?: string
  ) => {
    setCustomAlert({
      visible: true,
      title,
      message,
      buttons,
      icon,
    });
  };

  const hideCustomAlert = () => {
    setCustomAlert(prev => ({ ...prev, visible: false }));
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const jewelries = await getAllJewelries();
        const foundProduct = jewelries.find((item: Jewellery) => item.id === parseInt(id as string));
        
        if (foundProduct) {
          setProduct(foundProduct);
        } else {
          showCustomAlert(
            "Product Not Found",
            "The product you're looking for doesn't exist.",
            [{ text: "Go Back", onPress: () => router.back() }],
            "warning-outline"
          );
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        showCustomAlert(
          "Error",
          "Failed to load product details.",
          [{ text: "Go Back", onPress: () => router.back() }],
          "warning-outline"
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  const handleAddToCart = async () => {
    if (!product) return;

    if (!isLoggedIn) {
      showCustomAlert(
        "Login Required",
        "Please log in to add items to your cart.",
        [
          { text: "Cancel", onPress: () => {}, style: "cancel" },
          { text: "Login", onPress: () => router.push('/login') }
        ],
        "bag-add-outline"
      );
      return;
    }

    setAddingToCart(true);

    try {
      await apiAddToCart(product.id, 1);
      
      showCustomAlert(
        "Added to Cart",
        `${product.name} has been added to your cart!`,
        [
          { text: "Continue Shopping", onPress: () => {}, style: "cancel" },
          { text: "View Cart", onPress: () => router.push('/cart') }
        ],
        "checkmark-circle-outline"
      );
    } catch (error: any) {
      console.error("Failed to add to cart:", error);
      
      if (error.response?.status === 401) {
        showCustomAlert(
          "Session Expired",
          "Please log in again.",
          [{ text: "OK", onPress: () => router.push('/login') }],
          "warning-outline"
        );
      } else {
        showCustomAlert(
          "Error",
          error.response?.data?.message || "Failed to add item to cart. Please try again.",
          [{ text: "OK", onPress: () => {} }],
          "warning-outline"
        );
      }
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#800080" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Product Details</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading product...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#800080" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Product Details</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={80} color="#ccc" />
          <Text style={styles.errorText}>Product not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#800080" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
        <TouchableOpacity onPress={() => router.push('/cart')} style={styles.cartButton}>
          <Ionicons name="bag-outline" size={28} color="#800080" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Product Image */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: product.imageUrl }} 
            style={styles.productImage}
            resizeMode="cover"
          />
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productPrice}>${product.price.toLocaleString()}</Text>
          
          <View style={styles.divider} />
          
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.productDescription}>{product.description}</Text>
          
          <View style={styles.divider} />
          
          {/* Features Section */}
          <Text style={styles.sectionTitle}>Features</Text>
          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <Ionicons name="diamond-outline" size={20} color="#800080" />
              <Text style={styles.featureText}>Premium Quality</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#800080" />
              <Text style={styles.featureText}>Authentic Materials</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="refresh-outline" size={20} color="#800080" />
              <Text style={styles.featureText}>30-Day Return Policy</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="car-outline" size={20} color="#800080" />
              <Text style={styles.featureText}>Free Shipping</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Bottom Add to Cart Button */}
      <View style={styles.bottomContainer}>
        <View style={styles.priceSection}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalPrice}>${product.price.toLocaleString()}</Text>
        </View>
        <TouchableOpacity 
          style={[styles.addToCartButton, addingToCart && { opacity: 0.7 }]}
          onPress={handleAddToCart}
          disabled={addingToCart}
        >
          <Ionicons 
            name={addingToCart ? "time-outline" : "bag-add"} 
            size={24} 
            color="#fff" 
          />
          <Text style={styles.addToCartText}>
            {addingToCart ? "Adding..." : "Add to Cart"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Custom Alert */}
      <CustomAlert
        visible={customAlert.visible}
        title={customAlert.title}
        message={customAlert.message}
        buttons={customAlert.buttons}
        onClose={hideCustomAlert}
        icon={customAlert.icon}
      />
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
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    textAlign: "center",
  },
  cartButton: {
    padding: 5,
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    width: screenWidth,
    height: screenWidth,
    backgroundColor: "#f8f8f8",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  productInfo: {
    padding: 20,
    paddingBottom: 120, // Space for bottom button
  },
  productName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    lineHeight: 34,
  },
  productPrice: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#800080",
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  productDescription: {
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
    marginBottom: 10,
  },
  featuresContainer: {
    marginTop: 10,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  featureText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 12,
    fontWeight: "500",
  },
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 10,
  },
  priceSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  totalPrice: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#800080",
  },
  addToCartButton: {
    backgroundColor: "#800080",
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#800080",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  addToCartText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
  },
  alertButtonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingBottom: 15,
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 20,
    color: "#666",
    marginTop: 20,
  },
});