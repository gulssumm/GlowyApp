import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Animated,
  FlatList,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getCurrentUser, logoutUser } from "../../api";

// Mock data for jewelry products - replace with your API call later
const mockJewelries = [
  {
    id: 1,
    name: "Diamond Solitaire Ring",
    description: "18K White Gold Diamond Ring",
    price: 2500,
    imageUrl: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=400&fit=crop&crop=center",
  },
  {
    id: 2,
    name: "Pearl Necklace",
    description: "Classic Freshwater Pearl Necklace",
    price: 450,
    imageUrl: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=400&fit=crop&crop=center",
  },
  {
    id: 3,
    name: "Gold Earrings",
    description: "14K Gold Drop Earrings",
    price: 680,
    imageUrl: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=400&fit=crop&crop=center",
  },
  {
    id: 4,
    name: "Silver Bracelet",
    description: "Sterling Silver Chain Bracelet",
    price: 180,
    imageUrl: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=400&fit=crop&crop=center",
  },
  {
    id: 5,
    name: "Ruby Ring",
    description: "18K Gold Ruby Engagement Ring",
    price: 3200,
    imageUrl: "https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=400&h=400&fit=crop&crop=center",
  },
  {
    id: 6,
    name: "Diamond Necklace",
    description: "White Gold Diamond Tennis Necklace",
    price: 1850,
    imageUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=400&fit=crop&crop=center",
  },
];

interface Jewellery {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
}

interface MenuItem {
  id: string;
  title: string;
  icon: string;
  action: () => void;
  color?: string;
  dividerAfter?: boolean;
}

interface User {
  id: number;
  username: string;
  email: string;
}

export default function MainScreen() {
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);
  const [jewelries, setJewelries] = useState<Jewellery[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(2);
  const [slideAnim] = useState(new Animated.Value(-300));
  
  // User authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  useFocusEffect(
    useCallback(() => {
      checkUserAuthStatus();
    }, [])
  );

  const checkUserAuthStatus = async () => {
    try {
      const authStatus = await getCurrentUser();
      setIsLoggedIn(authStatus.isLoggedIn);
      if (authStatus.user) {
        setCurrentUser(authStatus.user);
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      setIsLoggedIn(false);
      setCurrentUser(null);
    }
  };

  const handleNavigation = (route: string) => {
    toggleMenu();
    setTimeout(() => {
      router.push(route as any);
    }, 300);
  };

  const handleComingSoon = (feature: string) => {
    toggleMenu();
    setTimeout(() => {
      Alert.alert("Coming Soon", `${feature} feature will be available soon!`);
    }, 300);
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
          onPress: async () => {
            try {
              await logoutUser();
              setIsLoggedIn(false);
              setCurrentUser(null);
              toggleMenu();
              Alert.alert("Success", "Logged out successfully!");
            } catch (error) {
              console.error("Logout error:", error);
              Alert.alert("Error", "Failed to logout");
            }
          }
        }
      ]
    );
  };

  // Menu items configuration - different items based on login status
  const getMenuItems = (): MenuItem[] => {
    const commonItems: MenuItem[] = [
      {
        id: 'home',
        title: 'Home',
        icon: 'home',
        action: () => handleNavigation('/main'),
      },
      {
        id: 'products',
        title: 'All Products',
        icon: 'diamond',
        action: () => handleComingSoon('All Products'),
      },
      {
        id: 'categories',
        title: 'Categories',
        icon: 'grid',
        action: () => handleComingSoon('Categories'),
      },
    ];

    if (isLoggedIn && currentUser) {
      // Menu items for logged-in users
      return [
        ...commonItems,
        {
          id: 'favorites',
          title: 'Favorites',
          icon: 'heart',
          action: () => handleComingSoon('Favorites'),
        },
        {
          id: 'orders',
          title: 'My Orders',
          icon: 'bag',
          action: () => handleComingSoon('My Orders'),
          dividerAfter: true,
        },
        {
          id: 'profile',
          title: 'Profile',
          icon: 'person',
          action: () => handleNavigation('/profile'),
        },
        {
          id: 'settings',
          title: 'Settings',
          icon: 'settings',
          action: () => handleComingSoon('Settings'),
        },
        {
          id: 'support',
          title: 'Help & Support',
          icon: 'help-circle',
          action: () => handleComingSoon('Help & Support'),
          dividerAfter: true,
        },
        {
          id: 'logout',
          title: 'Logout',
          icon: 'log-out',
          action: () => handleLogout(),
          color: '#ff4444',
        },
      ];
    } else {
      // Menu items for non-logged-in users
      return [
        ...commonItems,
        {
          id: 'support',
          title: 'Help & Support',
          icon: 'help-circle',
          action: () => handleComingSoon('Help & Support'),
          dividerAfter: true,
        },
        {
          id: 'login',
          title: 'Sign In / Register',
          icon: 'log-in',
          action: () => handleNavigation('/login'),
          color: '#800080',
        },
      ];
    }
  };

  const toggleMenu = () => {
    if (menuVisible) {
      // Close menu
      Animated.timing(slideAnim, {
        toValue: -300,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setMenuVisible(false));
    } else {
      // Open menu
      setMenuVisible(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const addToCart = (item: Jewellery) => {
    setCartCount(prevCount => prevCount + 1);
    Alert.alert(
      "Added to Cart",
      `${item.name} has been added to your cart!`,
      [{ text: "OK" }]
    );
  };

  const renderJewelryCard = ({ item }: { item: Jewellery }) => (
    <TouchableOpacity style={styles.productCard}>
      <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.productDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <Text style={styles.productPrice}>${item.price.toLocaleString()}</Text>
        <TouchableOpacity 
          style={styles.addToCartButton}
          onPress={() => addToCart(item)}
        >
          <Ionicons name="bag-add" size={20} color="#fff" />
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderMenuItem = (item: MenuItem) => (
    <View key={item.id}>
      <TouchableOpacity style={styles.menuItem} onPress={item.action}>
        <Ionicons 
          name={item.icon as any} 
          size={24} 
          color={item.color || "#666"} 
        />
        <Text style={[
          styles.menuItemText, 
          item.color && { color: item.color }
        ]}>
          {item.title}
        </Text>
      </TouchableOpacity>
      {item.dividerAfter && <View style={styles.menuDivider} />}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={toggleMenu}>
          <Ionicons name="menu" size={28} color="#800080" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Glowy ✨</Text>
        
        <TouchableOpacity 
          style={styles.cartButton}
          onPress={() => handleComingSoon('Cart')}
        >
          <Ionicons name="bag-outline" size={28} color="#800080" />
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Discover Beautiful Jewelry</Text>
          <Text style={styles.heroSubtitle}>
            Handcrafted pieces that make you shine
          </Text>
          <TouchableOpacity 
            style={styles.heroButton}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.heroButtonText}>Get Started</Text>
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity 
              style={styles.categoryCard}
              onPress={() => handleComingSoon('Rings')}
            >
              <Ionicons name="diamond" size={30} color="#800080" />
              <Text style={styles.categoryText}>Rings</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.categoryCard}
              onPress={() => handleComingSoon('Necklaces')}
            >
              <Ionicons name="flower" size={30} color="#800080" />
              <Text style={styles.categoryText}>Necklaces</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.categoryCard}
              onPress={() => handleComingSoon('Earrings')}
            >
              <Ionicons name="leaf" size={30} color="#800080" />
              <Text style={styles.categoryText}>Earrings</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.categoryCard}
              onPress={() => handleComingSoon('Bracelets')}
            >
              <Ionicons name="heart" size={30} color="#800080" />
              <Text style={styles.categoryText}>Bracelets</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Featured Products */}
        <View style={styles.productsSection}>
          <Text style={styles.sectionTitle}>Featured Products</Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading beautiful jewelry...</Text>
            </View>
          ) : (
            <FlatList
              data={jewelries}
              renderItem={renderJewelryCard}
              keyExtractor={(item) => item.id.toString()}
              numColumns={2}
              columnWrapperStyle={styles.productRow}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>

      {/* Side Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="none"
        onRequestClose={toggleMenu}
      >
        <View style={styles.menuOverlay}>
          {/* Clickable overlay to close menu */}
          <TouchableOpacity
            style={styles.overlayTouchable}
            onPress={toggleMenu}
            activeOpacity={1}
          />
          
          {/* Actual Menu - positioned on the left */}
          <Animated.View
            style={[
              styles.sideMenu,
              { transform: [{ translateX: slideAnim }] },
            ]}
          >
            {/* Menu Header */}
            <View style={styles.menuHeader}>
              <View style={styles.menuTitleContainer}>
                <Text style={styles.menuTitle}>Glowy ✨</Text>
                {isLoggedIn && currentUser ? (
                  <Text style={styles.menuSubtitle}>Welcome, {currentUser.username}!</Text>
                ) : (
                  <Text style={styles.menuSubtitle}>Jewelry Store</Text>
                )}
              </View>
              <TouchableOpacity onPress={toggleMenu} style={styles.closeButton}>
                <Ionicons name="close" size={28} color="#800080" />
              </TouchableOpacity>
            </View>

            {/* Menu Items */}
            <ScrollView style={styles.menuItems}>
              {getMenuItems().map(renderMenuItem)}
            </ScrollView>

            {/* Menu Footer */}
            <View style={styles.menuFooter}>
              <Text style={styles.menuFooterText}>Version 1.0.0</Text>
            </View>
          </Animated.View>
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
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    color: "#666",
    fontSize: 16,
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
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    position: "relative",
  },
  overlayTouchable: {
    position: "absolute",
    top: 0,
    left: 300, // Start after the menu width
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
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
});