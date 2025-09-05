import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Image,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  addToFavorites,
  addToCart as apiAddToCart,
  getBatchFavoriteStatus,
  getJewelriesByCategory,
  removeFromFavorites
} from "../../api";
import { useAuth } from "../../context/AuthContext";

interface Jewellery {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
}

interface FavoriteStatus {
  [key: number]: boolean;
}

const CATEGORIES = [
  { id: 1, name: 'Rings', icon: 'diamond-outline' },
  { id: 2, name: 'Necklaces', icon: 'ellipse-outline' },
  { id: 3, name: 'Earrings', icon: 'radio-outline' },
  { id: 4, name: 'Bracelets', icon: 'remove-outline' },
];

export default function CategoriesScreen() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState(1);
  const [jewelries, setJewelries] = useState<Jewellery[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addingToCart, setAddingToCart] = useState<number | null>(null);
  const [favoriteStatuses, setFavoriteStatuses] = useState<FavoriteStatus>({});
  const [togglingFavorite, setTogglingFavorite] = useState<number | null>(null);

  const fetchJewelriesByCategory = useCallback(async (categoryId: number) => {
    try {
      setLoading(true);
      const data = await getJewelriesByCategory(categoryId);
      setJewelries(data || []);
      console.log("Fetched jewelries:", data);

      
      // Fetch favorite statuses if logged in
      if (isLoggedIn && data && data.length > 0) {
        const jewelryIds = data.map((item: Jewellery) => item.id);
        const statuses = await getBatchFavoriteStatus(jewelryIds);
        setFavoriteStatuses(statuses);
      }
    } catch (error) {
      console.error("Failed to fetch jewelries by category:", error);
      setJewelries([]);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    fetchJewelriesByCategory(selectedCategory);
  }, [fetchJewelriesByCategory, selectedCategory]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchJewelriesByCategory(selectedCategory);
    setRefreshing(false);
  };

  const handleCategorySelect = (categoryId: number) => { 
    setSelectedCategory(categoryId);
  };

  const addToCart = async (item: Jewellery) => {
    if (!isLoggedIn) {
      // Handle not logged in
      return;
    }

    setAddingToCart(item.id);
    try {
      await apiAddToCart(item.id, 1);
      // Show success message
    } catch (error) {
      console.error("Failed to add to cart:", error);
    } finally {
      setAddingToCart(null);
    }
  };

  const toggleFavorite = async (item: Jewellery, event: any) => {
    event.stopPropagation();
    
    if (!isLoggedIn) {
      // Handle not logged in
      return;
    }

    setTogglingFavorite(item.id);
    const currentlyFavorited = favoriteStatuses[item.id] || false;

    try {
      if (currentlyFavorited) {
        await removeFromFavorites(item.id);
        setFavoriteStatuses(prev => ({ ...prev, [item.id]: false }));
      } else {
        await addToFavorites(item.id);
        setFavoriteStatuses(prev => ({ ...prev, [item.id]: true }));
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    } finally {
      setTogglingFavorite(null);
    }
  };

  const renderCategoryTab = ({ item }: { item: typeof CATEGORIES[0] }) => {
    const isSelected = selectedCategory === item.id;
    return (
      <TouchableOpacity
        style={[styles.categoryTab, isSelected && styles.selectedCategoryTab]}
        onPress={() => handleCategorySelect(item.id)}
      >
        <Ionicons
          name={item.icon as any}
          size={20}
          color={isSelected ? "#fff" : "#800080"}
        />
        <Text style={[styles.categoryTabText, isSelected && styles.selectedCategoryTabText]}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderJewelryCard = ({ item }: { item: Jewellery }) => {
    const isFavorited = favoriteStatuses[item.id] || false;
    const isTogglingThis = togglingFavorite === item.id;
    
    return (
      <TouchableOpacity 
        style={styles.productCard} 
        onPress={() => router.push(`/product-detail?id=${item.id}`)}
      >
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
              size={16} 
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
              e.stopPropagation();
              addToCart(item);
            }}
            disabled={addingToCart === item.id}
          >
            <Ionicons 
              name={addingToCart === item.id ? "time-outline" : "bag-add"} 
              size={16} 
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

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="diamond-outline" size={80} color="#ccc" />
      <Text style={styles.emptyTitle}>No {CATEGORIES.find(cat => cat.id === selectedCategory)?.name} Found</Text>
      <Text style={styles.emptySubtitle}>
        We don't have any items in this category yet. Check back later!
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#800080" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Categories</Text>
        <View style={styles.placeholder} />
        {/*<TouchableOpacity onPress={() => router.push('/cart')}>
          <Ionicons name="bag-outline" size={24} color="#800080" />
        </TouchableOpacity>*/}
      </View>

      {/* Category Tabs */}
      <View style={styles.categoryTabsContainer}>
        <FlatList
          data={CATEGORIES}
          renderItem={renderCategoryTab}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryTabs}
        />
      </View>

      {/* Products List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text>Loading {CATEGORIES.find(cat => cat.id === selectedCategory)?.name.toLowerCase()}...</Text>
        </View>
      ) : jewelries.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={jewelries}
          renderItem={renderJewelryCard}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={styles.productRow}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
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
    justifyContent: "space-between",
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
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
  },
  backButton: {
    width: 24, // Same as the icon size
  },
  placeholder: {
    width: 24, // To balance the header
  },
  categoryTabsContainer: {
    backgroundColor: "#f8f4ff",
    paddingVertical: 15,
  },
  categoryTabs: {
    paddingHorizontal: 20,
  },
  categoryTab: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#800080",
  },
  selectedCategoryTab: {
    backgroundColor: "#800080",
  },
  categoryTabText: {
    marginLeft: 5,
    fontSize: 14,
    color: "#800080",
    fontWeight: "500",
  },
  selectedCategoryTabText: {
    color: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    padding: 20,
  },
  productRow: {
    justifyContent: "space-between",
  },
  productCard: {
    //flex: 1,
    width: '48%',
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
  imageContainer: {
    position: "relative",
  },
  productImage: {
    width: "100%",
    height: 150,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  favoriteButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
    width: 24,
    height: 24,
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
    marginBottom: 10,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
  },
});