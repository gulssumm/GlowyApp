import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Animated,
  FlatList,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { addToFavorites, addToCart as apiAddToCart, logoutUser as apiLogoutUser, getAllJewelries, getBatchFavoriteStatus, getCart, removeFromFavorites } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { ButtonStyles } from "../../styles/buttons"; // Import the button styles

interface Jewellery { id: number; name: string; description: string; price: number; imageUrl: string; }
interface MenuItem { id: string; title: string; icon: string; action: () => void; color?: string; dividerAfter?: boolean; }

// Custom Alert Component
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
interface FavoriteStatus {
  [key: number]: boolean;
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
                      marginHorizontal: 8,
                      marginTop: 1,
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

export default function MainScreen() {
  const router = useRouter();
  const { user: currentUser, isLoggedIn, logout, loading } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);
  const [jewelries, setJewelries] = useState<Jewellery[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [slideAnim] = useState(new Animated.Value(-300));
  const [addingToCart, setAddingToCart] = useState<number | null>(null);
  const [favoriteStatuses, setFavoriteStatuses] = useState<FavoriteStatus>({});
  const [togglingFavorite, setTogglingFavorite] = useState<number | null>(null);
  
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

  // Fetch cart count when component mounts and when user logs in
  const fetchCartCount = async () => {
    if (!isLoggedIn) {
      setCartCount(0);
      return;
    }

    try {
      const cartData = await getCart();
      setCartCount(cartData?.totalItems || 0);
    } catch (error) {
      console.error("Failed to fetch cart count:", error);
    }
  };

  useEffect(() => {
    fetchCartCount();
  }, [isLoggedIn]);

  useEffect(() => {
    const fetchJewelries = async () => {
      try {
        console.log('Starting to fetch jewelries...');
        const data = await getAllJewelries();
        console.log('Fetched jewelries data:', data);
        console.log('Number of items:', data?.length || 0);
        
        if (data && Array.isArray(data)) {
          setJewelries(data);
          console.log('Successfully set jewelries state');
        } else {
          console.log('Data is not an array:', typeof data, data);
        }
      } catch (error) {
        console.error("Failed to fetch jewelries:", error);
        showCustomAlert(
          "Network Error",
          "Unable to load products. Please check your connection and try again.",
          [{ text: "OK", onPress: () => {} }],
          "warning-outline"
        );
      }
    };

    fetchJewelries();
  }, []);

  console.log('Current jewelries state:', jewelries);
  console.log('Jewelries length:', jewelries.length);
  console.log('Current cart count:', cartCount);

  const toggleMenu = () => {
    if (menuVisible) {
      Animated.timing(slideAnim, { toValue: -300, duration: 300, useNativeDriver: true }).start(() => setMenuVisible(false));
    } else {
      setMenuVisible(true);
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  const handleNavigation = (route: string) => {
    router.push(route);
    setMenuVisible(false);
  };

  const handleComingSoon = (feature: string) => {
    showCustomAlert(
      "Coming Soon",
      `${feature} feature will be available soon!`,
      [{ text: "OK", onPress: () => {} }],
      "time-outline"
    );
    setMenuVisible(false);
  };

  const handleLogout = () => {
    showCustomAlert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", onPress: () => {}, style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await apiLogoutUser();
              logout();
              setMenuVisible(false);
              setCartCount(0);
              showCustomAlert(
                "Success",
                "Logged out successfully!",
                [{ text: "OK", onPress: () => {} }],
                "checkmark-circle-outline"
              );
            } catch (error) {
              console.error("Logout error:", error);
              showCustomAlert(
                "Error",
                "Failed to logout",
                [{ text: "OK", onPress: () => {} }],
                "warning-outline"
              );
            }
          },
        },
      ],
      "log-out-outline"
    );
  };

  const getMenuItems = (): MenuItem[] => {
    const commonItems: MenuItem[] = [
      { id: 'home', title: 'Home', icon: 'home', action: () => setMenuVisible(false)},
      { id: 'products', title: 'All Products', icon: 'diamond', action: () => handleComingSoon('All Products') },
      { id: 'categories', title: 'Categories', icon: 'grid', action: () => handleComingSoon('Categories') },
    ];

    if (isLoggedIn) {
      return [
        ...commonItems,
        { id: 'favorites', title: 'Favorites', icon: 'heart', action: () => handleNavigation('/favorites') },
        { id: 'orders', title: 'My Orders', icon: 'bag', action: () => handleNavigation('/myorders'), dividerAfter: true },
        { id: 'profile', title: 'Profile', icon: 'person', action: () => handleNavigation('/profile') },
        { id: 'settings', title: 'Settings', icon: 'settings', action: () => handleComingSoon('Settings') },
        { id: 'support', title: 'Help & Support', icon: 'help-circle', action: () => handleComingSoon('Help & Support'), dividerAfter: true },
        { id: 'logout', title: 'Logout', icon: 'log-out', action: handleLogout, color: '#ff4444' },
      ];
    }

    return [
      ...commonItems,
      { id: 'support', title: 'Help & Support', icon: 'help-circle', action: () => handleComingSoon('Help & Support'), dividerAfter: true },
      { id: 'login', title: 'Sign In / Register', icon: 'log-in', action: () => handleNavigation('/login'), color: '#800080' },
    ];
  };

  const menuItems = useMemo(() => getMenuItems(), [currentUser]);

  const getBottomNavButtons = () => {
    return [
      {
        id: 'home',
        icon: 'home',
        action: () => handleNavigation('/main'),
        isActive: true
      },
      {
        id: 'favorites',
        icon: 'heart',
        action: () => isLoggedIn ? handleNavigation('/favorites') : showCustomAlert(
          "Login Required",
          "Please log in to see your favorites.",
          [
            { text: "Cancel", onPress: () => {}, style: "cancel" },
            { text: "Login", onPress: () => router.push('/login') }
          ],
          "heart-outline"
        )
      },
      {
        id: 'orders',
        icon: 'bag',
        action: () => isLoggedIn ? handleNavigation('/myorders') : showCustomAlert(
          "Login Required",
          "Please log in to see your orders.",
          [
            { text: "Cancel", onPress: () => {}, style: "cancel" },
            { text: "Login", onPress: () => router.push('/login') }
          ],
          "bag-outline"
        )
      },
      {
        id: 'profile',
        icon: 'person',
        action: () => isLoggedIn ? handleNavigation('/profile') : showCustomAlert(
          "Login Required",
          "Please log in to see your profile.",
          [
            { text: "Cancel", onPress: () => {}, style: "cancel" },
            { text: "Login", onPress: () => router.push('/login') }
          ],
          "person-outline"
        )
      },
    ];
  };

  // Add to cart function
  const addToCart = async (item: Jewellery) => {
    // 1. Check if user is logged in
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

    // Show loading state
    setAddingToCart(item.id);

    try {
      // 2. Call the real API
      await apiAddToCart(item.id, 1);
      
      // 3. Update cart count
      setCartCount(prev => prev + 1);
      
      // 4. Show success message with option to view
      showCustomAlert(
        "Added to Cart",
        `${item.name} has been added to your cart!`,
        [
          { text: "Continue Shopping", onPress: () => {}, style: "cancel" },
          { text: "View Cart", onPress: () => router.push('/cart') }
        ],
        "checkmark-circle-outline"
      );
    } catch (error: any) {
      console.error("Failed to add to cart:", error);
      
      // Handle specific error cases
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
      // Clear loading state
      setAddingToCart(null);
    }
  };

  const renderJewelryCard = ({ item }: { item: Jewellery }) => {
  const isFavorited = favoriteStatuses[item.id] || false;
  const isTogglingThis = togglingFavorite === item.id;
  
  return (
    <TouchableOpacity style={styles.productCard} onPress={() => router.push(`/product-detail?id=${item.id}`)}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
        <TouchableOpacity 
          style={[styles.favoriteButton, isTogglingThis && { opacity: 0.7 }]}
          onPress={(e) => toggleFavorite(item, e)}
          disabled={isTogglingThis}
        >
          <Ionicons 
            name={
              isTogglingThis 
                ? "time-outline" 
                : isFavorited 
                  ? "heart" 
                  : "heart-outline"
            } 
            size={20} 
            color={isFavorited ? "#ff4444" : "#666"} 
          />
        </TouchableOpacity>
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productDescription}>{item.description}</Text>
        <Text style={styles.productPrice}>${item.price.toLocaleString()}</Text>
        <TouchableOpacity 
          style={[
            styles.addToCartButton, 
            addingToCart === item.id && { opacity: 0.7 }
          ]} 
          onPress={(e) => {
            e.stopPropagation(); // Prevent navigation when clicking add to cart
            addToCart(item);
          }}
          disabled={addingToCart === item.id}
        >
          <Ionicons 
            name={addingToCart === item.id ? "time-outline" : "bag-add"} 
            size={20} 
            color="#fff" 
          />
          <Text style={styles.addToCartText}>
            {addingToCart === item.id ? "Adding..." : "Add to Cart"}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

  const renderMenuItem = (item: MenuItem) => (
    <View key={item.id}>
      <TouchableOpacity style={styles.menuItem} onPress={item.action}>
        <Ionicons name={item.icon as any} size={24} color={item.color || "#666"} />
        <Text style={[styles.menuItemText, item.color && { color: item.color }]}>{item.title}</Text>
      </TouchableOpacity>
      {item.dividerAfter && <View style={styles.menuDivider} />}
    </View>
  );

  const renderBottomNavButton = (button: any) => (
    <TouchableOpacity
      key={button.id}
      style={styles.bottomNavButton}
      onPress={button.action}
    >
      <Ionicons
        name={button.isActive ? button.icon : `${button.icon}-outline`}
        size={24}
        color={button.isActive ? "#800080" : "#666"}
      />
    </TouchableOpacity>
  );

  // Fetch favorite statuses when jewelries or login state changes
  const fetchFavoriteStatuses = async () => {
  if (!isLoggedIn || jewelries.length === 0) {
    setFavoriteStatuses({});
    return;
  }

  try {
    const jewelryIds = jewelries.map(item => item.id);
    const statuses = await getBatchFavoriteStatus(jewelryIds);
    setFavoriteStatuses(statuses);
  } catch (error) {
    console.error("Failed to fetch favorite statuses:", error);
  }
};
useEffect(() => {
  fetchFavoriteStatuses();
}, [isLoggedIn, jewelries]);

// Add this function to handle favorite toggle
const toggleFavorite = async (item: Jewellery, event: any) => {
  event.stopPropagation(); // Prevent navigation when clicking heart
  
  if (!isLoggedIn) {
    showCustomAlert(
      "Login Required",
      "Please log in to add items to your favorites.",
      [
        { text: "Cancel", onPress: () => {}, style: "cancel" },
        { text: "Login", onPress: () => router.push('/login') }
      ],
      "heart-outline"
    );
    return;
  }

  setTogglingFavorite(item.id);
  const currentlyFavorited = favoriteStatuses[item.id] || false;

  try {
    if (currentlyFavorited) {
      await removeFromFavorites(item.id);
      setFavoriteStatuses(prev => ({ ...prev, [item.id]: false }));
      showCustomAlert(
        "Removed from Favorites",
        `${item.name} has been removed from your favorites.`,
        [{ text: "OK", onPress: () => {} }],
        "heart-dislike-outline"
      );
    } else {
      await addToFavorites(item.id);
      setFavoriteStatuses(prev => ({ ...prev, [item.id]: true }));
      showCustomAlert(
        "Added to Favorites",
        `${item.name} has been added to your favorites!`,
        [
          { text: "Continue Shopping", onPress: () => {}, style: "cancel" },
          { text: "View Favorites", onPress: () => router.push('/favorites') }
        ],
        "heart-outline"
      );
    }
  } catch (error: any) {
    console.error("Failed to toggle favorite:", error);
    
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
        error.message || "Failed to update favorites. Please try again.",
        [{ text: "OK", onPress: () => {} }],
        "warning-outline"
      );
    }
  } finally {
    setTogglingFavorite(null);
  }
};

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={toggleMenu}>
          <Ionicons name="menu" size={28} color="#800080" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Glowy ✨</Text>
        <TouchableOpacity style={styles.cartButton} onPress={() => router.push('/cart')}>
          <Ionicons name="bag-outline" size={28} color="#800080" />
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Content with bottom padding to avoid overlap with bottom nav */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Discover Beautiful Jewelry</Text>
          <Text style={styles.heroSubtitle}>Handcrafted pieces that make you shine</Text>
          {!isLoggedIn && (
            <TouchableOpacity style={styles.heroButton} onPress={() => router.push('/login')}>
              <Text style={styles.heroButtonText}>Get Started</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Categories */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['Rings','Necklaces','Earrings','Bracelets'].map(cat => (
              <TouchableOpacity key={cat} style={styles.categoryCard} onPress={() => handleComingSoon(cat)}>
                <Ionicons name="diamond" size={30} color="#800080" />
                <Text style={styles.categoryText}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Products */}
        <View style={styles.productsSection}>
          <Text style={styles.sectionTitle}>Featured Products</Text>
          <FlatList
            data={jewelries}
            renderItem={renderJewelryCard}
            keyExtractor={item => item.id.toString()}
            numColumns={2}
            columnWrapperStyle={styles.productRow}
            scrollEnabled={false}
          />
        </View>
      </ScrollView>

      {/* Fixed Bottom Navigation */}
      <View style={styles.bottomNavContainer}>
        {getBottomNavButtons().map(renderBottomNavButton)}
      </View>

      {/* Side Menu */}
      <Modal visible={menuVisible} transparent animationType="none" onRequestClose={toggleMenu}>
        <View style={styles.menuOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={toggleMenu} />
          <Animated.View style={[styles.sideMenu, { transform: [{ translateX: slideAnim }] }]}>
            <View style={styles.menuHeader}>
              <View style={styles.menuTitleContainer}>
                <Text style={styles.menuTitle}>Glowy ✨</Text>
                {currentUser ? (
                  <Text style={styles.menuSubtitle}>Welcome, {currentUser.username}!</Text>
                ) : (
                  <Text style={styles.menuSubtitle}>Jewelry Store</Text>
                )}
              </View>
              <TouchableOpacity onPress={toggleMenu} style={styles.closeButton}>
                <Ionicons name="close" size={28} color="#800080" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.menuItems}>
              {menuItems.map(renderMenuItem)}
            </ScrollView>
            <View style={styles.menuFooter}>
              <Text style={styles.menuFooterText}>Version 1.0.0</Text>
            </View>
          </Animated.View>
        </View>
      </Modal>

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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  menuButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#800080",
  },
  cartButton: {
    position: "relative",
    padding: 5,
  },
  cartBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#ff4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  cartBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  heroSection: {
    padding: 20,
    alignItems: "center",
    backgroundColor: "#f8f4ff",
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#800080",
    textAlign: "center",
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  heroButton: {
    backgroundColor: "#800080",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  heroButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  categoriesSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  categoryCard: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f4ff",
    borderRadius: 15,
    padding: 15,
    marginRight: 15,
    minWidth: 80,
  },
  categoryText: {
    marginTop: 8,
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  productsSection: {
    padding: 20,
  },
  productRow: {
    justifyContent: "space-between",
  },
  productCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 15,
    marginBottom: 15,
    marginHorizontal: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: "100%",
    height: 150,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
    lineHeight: 16,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#800080",
    marginBottom: 10,
  },
  addToCartButton: {
    backgroundColor: "#800080",
    borderRadius: 8,
    padding: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  addToCartText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 4,
  },
  // Alert Button Container for multiple buttons
  alertButtonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 1,
    justifyContent: 'space-between',
    paddingBottom: 15,
  },
  // Bottom Navigation Styles
  bottomNavContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
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
  bottomNavButton: {
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderRadius: 25,
    minWidth: 50,
    minHeight: 50,
  },
  // Side Menu Styles
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    position: "relative",
  },
  sideMenu: {
    width: 300,
    height: "100%",
    backgroundColor: "#fff",
    paddingTop: 50,
    position: "absolute",
    left: 0,
    top: 0,
    shadowColor: "#000",
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  menuTitleContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#800080",
  },
  menuSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  closeButton: {
    padding: 5,
  },
  menuItems: {
    flex: 1,
    paddingTop: 10,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 0,
  },
  menuItemText: {
    marginLeft: 15,
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 10,
    marginHorizontal: 20,
  },
  menuFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    alignItems: "center",
  },
  menuFooterText: {
    fontSize: 12,
    color: "#999",
  },
    imageContainer: {
    position: "relative",
  },
  favoriteButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});