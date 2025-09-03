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
import { addToCart as apiAddToCart, getFavorites, removeFromFavorites } from "../../api";
import { useAuth } from "../../context/AuthContext";

interface FavoriteItem {
  id: number;
  createdAt: string;
  jewellery: {
    id: number;
    name: string;
    description: string;
    price: number;
    imageUrl: string;
  };
}

export default function FavoritesScreen() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefresing] = useState(false);
  const [removingFavorite, setRemovingFavorite] = useState<number | null>(null);
  const [addingToCart, setAddingToCart] = useState<number | null>(null);

  const fetchFavorites = useCallback(async () => {
    if (!isLoggedIn) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    try {
      const data = await getFavorites();
      setFavorites(data || []);
    } catch (error) {
      console.error("Failed to fetch favorites:", error);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const handleRefresh = async () => {
    setRefresing(true);
    await fetchFavorites();
    setRefresing(false);
  };

  const handleRemoveFromFavorites = async (jewelryId: number) => {
    setRemovingFavorite(jewelryId);
    try {
      await removeFromFavorites(jewelryId);
      setFavorites(prev => prev.filter(item => item.jewellery.id !== jewelryId));
    } catch (error) {
      console.error("Failed to remove from favorites:", error);
    } finally {
      setRemovingFavorite(null);
    }
  };

  const handleAddToCart = async (jewelry: FavoriteItem['jewellery']) => {
    setAddingToCart(jewelry.id);
    try {
      await apiAddToCart(jewelry.id, 1);
      // Could show success message here
    } catch (error) {
      console.error("Failed to add to cart:", error);
    } finally {
      setAddingToCart(null);
    }
  };

  const renderFavoriteItem = ({ item }: { item: FavoriteItem }) => (
    <View style={styles.favoriteCard}>
      <TouchableOpacity 
        style={styles.productSection}
        onPress={() => router.push(`/product-detail?id=${item.jewellery.id}`)}
      >
        <Image source={{ uri: item.jewellery.imageUrl }} style={styles.productImage} />
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.jewellery.name}</Text>
          <Text style={styles.productDescription}>{item.jewellery.description}</Text>
          <Text style={styles.productPrice}>${item.jewellery.price.toLocaleString()}</Text>
          <Text style={styles.addedDate}>
            Added {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </TouchableOpacity>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.cartButton, addingToCart === item.jewellery.id && { opacity: 0.7 }]}
          onPress={() => handleAddToCart(item.jewellery)}
          disabled={addingToCart === item.jewellery.id}
        >
          <Ionicons 
            name={addingToCart === item.jewellery.id ? "time-outline" : "bag-add"} 
            size={20} 
            color="#fff" 
          />
          <Text style={styles.cartButtonText}>
            {addingToCart === item.jewellery.id ? "Adding..." : "Add to Cart"}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.removeButton, removingFavorite === item.jewellery.id && { opacity: 0.7 }]}
          onPress={() => handleRemoveFromFavorites(item.jewellery.id)}
          disabled={removingFavorite === item.jewellery.id}
        >
          <Ionicons 
            name={removingFavorite === item.jewellery.id ? "time-outline" : "heart-dislike"} 
            size={20} 
            color="#fff" 
          />
          <Text style={styles.removeButtonText}>
            {removingFavorite === item.jewellery.id ? "Removing..." : "Remove"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="heart-outline" size={80} color="#ccc" />
      <Text style={styles.emptyTitle}>No Favorites Yet</Text>
      <Text style={styles.emptySubtitle}>
        {isLoggedIn 
          ? "Browse products and tap the heart icon to add favorites"
          : "Please log in to see your favorites"}
      </Text>
      <TouchableOpacity 
        style={styles.browseButton} 
        onPress={() => isLoggedIn ? router.push('/main') : router.push('/login')}
      >
        <Text style={styles.browseButtonText}>
          {isLoggedIn ? "Browse Products" : "Log In"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#800080" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Favorites</Text>
          <View style={{ width: 24 }} />
        </View>
        {renderEmptyState()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#800080" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Favorites ({favorites.length})</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text>Loading favorites...</Text>
        </View>
      ) : favorites.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={favorites}
          renderItem={renderFavoriteItem}
          keyExtractor={(item) => item.id.toString()}
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    padding: 20,
  },
  favoriteCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productSection: {
    flexDirection: "row",
    padding: 15,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 15,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#800080",
    marginBottom: 4,
  },
  addedDate: {
    fontSize: 12,
    color: "#999",
  },
  actionButtons: {
    flexDirection: "row",
    paddingHorizontal: 15,
    paddingBottom: 15,
    gap: 10,
  },
  cartButton: {
    flex: 1,
    backgroundColor: "#800080",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  cartButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 5,
  },
  removeButton: {
    flex: 1,
    backgroundColor: "#ff4444",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  removeButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 5,
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
  browseButton: {
    backgroundColor: "#800080",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  browseButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});