import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Animated,
  FlatList,
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
import { ButtonStyles } from "../../styles/buttons";
import { headerStyles, commonColors, commonSpacing } from "../../styles/commonStyles";
import { ProductCard } from "../../components/ProductCard";
import { Jewellery, FavoriteStatus } from "../../types";

interface MenuItem { 
  id: string; 
  title: string; 
  icon: string; 
  action: () => void; 
  color?: string; 
  dividerAfter?: boolean; 
}

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
              color={commonColors.primary}
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

// Main Screen Header Component (different from other screens)
const MainScreenHeader = ({ 
  onMenuPress, 
  title 
}: {
  onMenuPress: () => void;
  title: string;
}) => (
  <View style={headerStyles.container}>
    <View style={headerStyles.leftSection}>
      <TouchableOpacity style={headerStyles.backButton} onPress={onMenuPress}>
        <Ionicons name="menu" size={28} color={commonColors.primary} />
      </TouchableOpacity>
    </View>
    <View style={headerStyles.centerSection}>
      <Text style={[headerStyles.title, { fontSize: 24 }]}>{title}</Text>
    </View>
    <View style={headerStyles.rightSection}>
      {/* Empty for balanced layout */}
    </View>
  </View>
);

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
    setCustomAlert({ visible: true, title, message, buttons, icon });
  };

  const hideCustomAlert = () => {
    setCustomAlert(prev => ({ ...prev, visible: false }));
  };

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
        const data = await getAllJewelries();
        if (data && Array.isArray(data)) {
          setJewelries(data);
        }
      } catch (error) {
        console.error("Failed to fetch jewelries:", error);
        showCustomAlert(
          "Network Error",
          "Unable to load products. Please check your connection and try again.",
          [{ text: "OK", onPress: () => { } }],
          "warning-outline"
        );
      }
    };

    fetchJewelries();
  }, []);

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
      [{ text: "OK", onPress: () => { } }],
      "time-outline"
    );
    setMenuVisible(false);
  };

  const handleLogout = () => {
    showCustomAlert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", onPress: () => { }, style: "cancel" },
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
                [{ text: "OK", onPress: () => { } }],
                "checkmark-circle-outline"
              );
            } catch (error) {
              console.error("Logout error:", error);
              showCustomAlert(
                "Error",
                "Failed to logout",
                [{ text: "OK", onPress: () => { } }],
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
      { id: 'home', title: 'Home', icon: 'home', action: () => setMenuVisible(false) },
      { id: 'products', title: 'All Products', icon: 'diamond', action: () => handleComingSoon('All Products') },
      { id: 'categories', title: 'Categories', icon: 'grid', action: () => handleNavigation('/categories'), dividerAfter: true },
    ];

    if (isLoggedIn) {
      return [
        ...commonItems,
        { id: 'favorites', title: 'Favorites', icon: 'heart', action: () => handleNavigation('/favorites') },
        { id: 'orders', title: 'My Orders', icon: 'bag', action: () => handleNavigation('/myorders'), dividerAfter: true },
        { id: 'profile', title: 'Profile', icon: 'person', action: () => handleNavigation('/profile') },
        { id: 'settings', title: 'Settings', icon: 'settings', action: () => handleComingSoon('Settings') },
        { id: 'support', title: 'Help & Support', icon: 'help-circle', action: () => handleComingSoon('Help & Support'), dividerAfter: true },
        { id: 'logout', title: 'Logout', icon: 'log-out', action: handleLogout, color: commonColors.error },
      ];
    }

    return [
      ...commonItems,
      { id: 'support', title: 'Help & Support', icon: 'help-circle', action: () => handleComingSoon('Help & Support'), dividerAfter: true },
      { id: 'login', title: 'Sign In / Register', icon: 'log-in', action: () => handleNavigation('/login'), color: commonColors.primary },
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
            { text: "Cancel", onPress: () => { }, style: "cancel" },
            { text: "Login", onPress: () => router.push('/login') }
          ],
          "heart-outline"
        )
      },
      {
        id: 'cart',
        icon: 'cart',
        action: () => isLoggedIn ? handleNavigation('/cart') : showCustomAlert(
          "Login Required",
          "Please log in to view your cart.",
          [
            { text: "Cancel", onPress: () => { }, style: "cancel" },
            { text: "Login", onPress: () => router.push('/cart') }
          ],
          "cart-outline"
        ),
      },
      {
        id: 'profile',
        icon: 'person',
        action: () => isLoggedIn ? handleNavigation('/profile') : showCustomAlert(
          "Login Required",
          "Please log in to see your profile.",
          [
            { text: "Cancel", onPress: () => { }, style: "cancel" },
            { text: "Login", onPress: () => router.push('/login') }
          ],
          "person-outline"
        )
      },
    ];
  };

  const addToCart = async (item: Jewellery) => {
    if (!isLoggedIn) {
      showCustomAlert(
        "Login Required",
        "Please log in to add items to your cart.",
        [
          { text: "Cancel", onPress: () => { }, style: "cancel" },
          { text: "Login", onPress: () => router.push('/login') }
        ],
        "bag-add-outline"
      );
      return;
    }

    setAddingToCart(item.id);

    try {
      await apiAddToCart(item.id, 1);
      setCartCount(prev => prev + 1);
      showCustomAlert(
        "Added to Cart",
        `${item.name} has been added to your cart!`,
        [
          { text: "Continue Shopping", onPress: () => { }, style: "cancel" },
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
          [{ text: "OK", onPress: () => { } }],
          "warning-outline"
        );
      }
    } finally {
      setAddingToCart(null);
    }
  };

  const toggleFavorite = async (item: Jewellery, event: any) => {
    event.stopPropagation();

    if (!isLoggedIn) {
      showCustomAlert(
        "Login Required",
        "Please log in to add items to your favorites.",
        [
          { text: "Cancel", onPress: () => { }, style: "cancel" },
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
          [{ text: "OK", onPress: () => { } }],
          "heart-dislike-outline"
        );
      } else {
        await addToFavorites(item.id);
        setFavoriteStatuses(prev => ({ ...prev, [item.id]: true }));
        showCustomAlert(
          "Added to Favorites",
          `${item.name} has been added to your favorites!`,
          [
            { text: "Continue Shopping", onPress: () => { }, style: "cancel" },
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
          [{ text: "OK", onPress: () => { } }],
          "warning-outline"
        );
      }
    } finally {
      setTogglingFavorite(null);
    }
  };

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

  const renderJewelryCard = ({ item }: { item: Jewellery }) => (
    <ProductCard
      item={item}
      isFavorited={favoriteStatuses[item.id] || false}
      isTogglingFavorite={togglingFavorite === item.id}
      isAddingToCart={addingToCart === item.id}
      onToggleFavorite={toggleFavorite}
      onAddToCart={(item, e) => {
        e.stopPropagation();
        addToCart(item);
      }}
    />
  );

  const renderMenuItem = (item: MenuItem) => (
    <View key={item.id}>
      <TouchableOpacity style={styles.menuItem} onPress={item.action}>
        <Ionicons name={item.icon as any} size={24} color={item.color || commonColors.text.secondary} />
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
      <View style={button.id === 'cart' ? styles.cartButton : {}}>
        <Ionicons
          name={button.isActive ? button.icon : `${button.icon}-outline`}
          size={24}
          color={button.isActive ? commonColors.primary : commonColors.text.secondary}
        />
        {button.id === 'cart' && cartCount > 0 && (
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>{cartCount}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <MainScreenHeader
        onMenuPress={toggleMenu}
        title="Glowy ✨"
      />

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
            {['Rings', 'Necklaces', 'Earrings', 'Bracelets'].map(cat => (
              <TouchableOpacity key={cat} style={styles.categoryCard} onPress={() => router.push(`/categories?category=${cat}`)}>
                <Ionicons name="diamond" size={30} color={commonColors.primary} />
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
                <Ionicons name="close" size={28} color={commonColors.primary} />
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
    backgroundColor: commonColors.background,
  },
  cartButton: {
    position: "relative",
    padding: 5,
  },
  cartBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: commonColors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  cartBadgeText: {
    color: commonColors.text.white,
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
    padding: commonSpacing.l,
    alignItems: "center",
    backgroundColor: "#f8f4ff",
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: commonColors.primary,
    textAlign: "center",
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: commonColors.text.secondary,
    textAlign: "center",
    marginBottom: 20,
  },
  heroButton: {
    backgroundColor: commonColors.primary,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  heroButtonText: {
    color: commonColors.text.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  categoriesSection: {
    padding: commonSpacing.l,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: commonColors.text.primary,
    marginBottom: commonSpacing.m,
  },
  categoryCard: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f4ff",
    borderRadius: 15,
    padding: commonSpacing.m,
    marginRight: commonSpacing.m,
    minWidth: 80,
  },
  categoryText: {
    marginTop: 8,
    fontSize: 12,
    color: commonColors.text.secondary,
    fontWeight: "500",
  },
  productsSection: {
    paddingHorizontal: commonSpacing.l,
    paddingVertical: commonSpacing.l,
  },
  productRow: {
    justifyContent: "space-between",
    paddingHorizontal: 5,
  },
  alertButtonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 1,
    justifyContent: 'space-between',
    paddingBottom: 15,
  },
  bottomNavContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: commonColors.background,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: commonSpacing.l,
    paddingBottom: commonSpacing.l,
    borderTopWidth: 1,
    borderTopColor: commonColors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
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
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    position: "relative",
  },
  sideMenu: {
    width: 300,
    height: "100%",
    backgroundColor: commonColors.background,
    paddingTop: 50,
    position: "absolute",
    left: 0,
    top: 0,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: commonSpacing.l,
    paddingBottom: commonSpacing.l,
    borderBottomWidth: 1,
    borderBottomColor: commonColors.border,
  },
  menuTitleContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: commonColors.primary,
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