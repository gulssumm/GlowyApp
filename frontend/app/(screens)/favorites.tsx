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
import { productCardStyles, commonColors, jewelryCardStyles } from "../../styles/commonStyles";

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

  const handleRemoveFromFavorites = async (jewelryId: number, event: any) => {
    event.stopPropagation(); // Prevent navigation when removing from favorites
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

  const handleAddToCart = async (jewelry: FavoriteItem['jewellery'], event: any) => {
    event.stopPropagation(); // Prevent navigation when adding to cart
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
    <TouchableOpacity
      style={productCardStyles.gridCard}
      onPress={() => router.push(`/product-detail?id=${item.jewellery.id}`)}
    >
      <View style={productCardStyles.imageContainer}>
        <Image
          source={{ uri: item.jewellery.imageUrl }}
          style={productCardStyles.gridImage}
        />
        <TouchableOpacity
          style={[
            jewelryCardStyles.favoriteButton,
            removingFavorite === item.jewellery.id && { opacity: 0.7 }
          ]}
          onPress={(e) => handleRemoveFromFavorites(item.jewellery.id, e)}
          disabled={removingFavorite === item.jewellery.id}
        >
          <Ionicons
            name={
              removingFavorite === item.jewellery.id
                ? "time-outline"
                : "heart"
            }
            size={20}
            color={commonColors.error}
          />
        </TouchableOpacity>
      </View>
      <View style={jewelryCardStyles.info}>
        <Text style={jewelryCardStyles.name}>{item.jewellery.name}</Text>
        <Text style={jewelryCardStyles.price}>
          ${item.jewellery.price.toLocaleString()}
        </Text>
        
        {/* Action Buttons */}
        <View style={productCardStyles.actionButtons}>
          <TouchableOpacity
            style={[
              productCardStyles.primaryActionButton,
              addingToCart === item.jewellery.id && { opacity: 0.7 }
            ]}
            onPress={(e) => handleAddToCart(item.jewellery, e)}
            disabled={addingToCart === item.jewellery.id}
          >
            <Ionicons
              name={addingToCart === item.jewellery.id ? "time-outline" : "bag-add"}
              size={16}
              color={commonColors.text.white}
            />
            <Text style={productCardStyles.buttonText}>
              {addingToCart === item.jewellery.id ? "Adding..." : "Add to Cart"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              productCardStyles.secondaryActionButton,
              removingFavorite === item.jewellery.id && { opacity: 0.7 }
            ]}
            onPress={(e) => handleRemoveFromFavorites(item.jewellery.id, e)}
            disabled={removingFavorite === item.jewellery.id}
          >
            <Ionicons
              name={removingFavorite === item.jewellery.id ? "time-outline" : "heart-dislike"}
              size={16}
              color={commonColors.text.white}
            />
            <Text style={productCardStyles.buttonText}>
              {removingFavorite === item.jewellery.id ? "Removing..." : "Remove"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
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
          key="favorites-grid" // Forces consistent rendering
          data={favorites}
          renderItem={renderFavoriteItem}
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
    paddingHorizontal: 5,
  },
  addedDate: {
    fontSize: 10,
    color: "#999",
    marginBottom: 8,
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