import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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
  View,
} from "react-native";

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

export default function MainScreen() {
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);
  const [jewelries, setJewelries] = useState<Jewellery[]>([]);
  const [loading, setLoading] = useState(true);
  const slideAnim = new Animated.Value(-300);

  useEffect(() => {
    // Simulate API call - replace with actual API call later
    setTimeout(() => {
      setJewelries(mockJewelries);
      setLoading(false);
    }, 1000);
  }, []);

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
        <Text style={styles.productPrice}>${item.price}</Text>
        <TouchableOpacity style={styles.addToCartButton}>
          <Ionicons name="bag-add" size={20} color="#fff" />
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={toggleMenu}>
          <Ionicons name="menu" size={28} color="#800080" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Glowy ✨</Text>
        
        <TouchableOpacity style={styles.cartButton}>
          <Ionicons name="bag-outline" size={28} color="#800080" />
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>2</Text>
          </View>
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
        </View>

        {/* Categories */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity style={styles.categoryCard}>
              <Ionicons name="diamond" size={30} color="#800080" />
              <Text style={styles.categoryText}>Rings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.categoryCard}>
              <Ionicons name="flower" size={30} color="#800080" />
              <Text style={styles.categoryText}>Necklaces</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.categoryCard}>
              <Ionicons name="leaf" size={30} color="#800080" />
              <Text style={styles.categoryText}>Earrings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.categoryCard}>
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
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={toggleMenu}
        >
          <Animated.View
            style={[
              styles.sideMenu,
              { transform: [{ translateX: slideAnim }] },
            ]}
          >
            <TouchableOpacity onPress={() => {}} />
            
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>Glowy ✨</Text>
              <TouchableOpacity onPress={toggleMenu}>
                <Ionicons name="close" size={28} color="#800080" />
              </TouchableOpacity>
            </View>

            <View style={styles.menuItems}>
              <TouchableOpacity style={styles.menuItem}>
                <Ionicons name="home" size={24} color="#666" />
                <Text style={styles.menuItemText}>Home</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.menuItem}>
                <Ionicons name="diamond" size={24} color="#666" />
                <Text style={styles.menuItemText}>All Products</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.menuItem}>
                <Ionicons name="heart" size={24} color="#666" />
                <Text style={styles.menuItemText}>Favorites</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.menuItem}>
                <Ionicons name="bag" size={24} color="#666" />
                <Text style={styles.menuItemText}>My Orders</Text>
              </TouchableOpacity>
              
              <View style={styles.menuDivider} />
              
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => {
                  toggleMenu();
                  router.push("/login");
                }}
              >
                <Ionicons name="log-in" size={24} color="#800080" />
                <Text style={[styles.menuItemText, { color: "#800080" }]}>
                  Sign In / Register
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </TouchableOpacity>
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
    justifyContent: "flex-start",
  },
  sideMenu: {
    width: 280,
    height: "100%",
    backgroundColor: "#fff",
    paddingTop: 50,
  },
  menuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  menuTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#800080",
  },
  menuItems: {
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  menuItemText: {
    marginLeft: 15,
    fontSize: 16,
    color: "#333",
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 10,
    marginHorizontal: 20,
  },
});