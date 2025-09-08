import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
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
import { headerStyles, commonColors, commonSpacing } from "../../styles/commonStyles";
import { ProductCard } from "../../components/ProductCard";
import { Jewellery, FavoriteStatus } from "../../types";
import { CategoryTabs } from "@/components/CategoryTabs";
import { CATEGORIES } from "@/constants/categories";

const ScreenHeader = ({
  onBackPress,
  title
}: {
  onBackPress: () => void;
  title: string;
}) => (
  <View style={headerStyles.container}>
    <View style={headerStyles.leftSection}>
      <TouchableOpacity style={headerStyles.backButton} onPress={onBackPress}>
        <Ionicons name="arrow-back" size={24} color={commonColors.primary} />
      </TouchableOpacity>
    </View>
    <View style={headerStyles.centerSection}>
      <Text style={headerStyles.title}>{title}</Text>
    </View>
    <View style={headerStyles.rightSection}>
      {/* Empty for balanced layout */}
    </View>
  </View>
);

export default function CategoriesScreen() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(1);
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
    if (selectedCategory !== null) {
      fetchJewelriesByCategory(selectedCategory);
    }
  }, [fetchJewelriesByCategory, selectedCategory]);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (selectedCategory !== null) {
      await fetchJewelriesByCategory(selectedCategory);
    }
    setRefreshing(false);
  };

  const addToCart = async (item: Jewellery) => {
    if (!isLoggedIn) return;

    setAddingToCart(item.id);
    try {
      await apiAddToCart(item.id, 1);
    } catch (error) {
      console.error("Failed to add to cart:", error);
    } finally {
      setAddingToCart(null);
    }
  };

  const toggleFavorite = async (item: Jewellery, event: any) => {
    event.stopPropagation();

    if (!isLoggedIn) return;

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
      <ScreenHeader
        onBackPress={() => router.back()}
        title="Categories"
      />

      {/* Category Tabs */}
      <CategoryTabs
        categories={CATEGORIES}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

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
    backgroundColor: commonColors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    padding: commonSpacing.l,
  },
  productRow: {
    justifyContent: "space-between",
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
    color: commonColors.text.primary,
    marginTop: 20,
    marginBottom: 10,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    color: commonColors.text.secondary,
    textAlign: "center",
    lineHeight: 24,
  },
});