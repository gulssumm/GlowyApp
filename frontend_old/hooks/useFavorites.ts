import { useState, useCallback } from "react";
import { addToFavorites, removeFromFavorites, getFavorites } from "@/api";
import { FavoriteItem, Jewellery } from "@/types";

export function useFavorites(isLoggedIn: boolean) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingFavorite, setRemovingFavorite] = useState<number | null>(null);
  const [addingFavorite, setAddingFavorite] = useState<number | null>(null);

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
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  const addFavorite = async (jewelry: Jewellery) => {
  setAddingFavorite(jewelry.id);
  try {
    await addToFavorites(jewelry.id);
    setFavorites(prev => [
      ...prev,
      {
        id: Date.now(),
        createdAt: new Date().toISOString(),
        jewellery: {
          id: jewelry.id,
          name: jewelry.name,
          description: jewelry.description,
          price: jewelry.price,
          imageUrl: jewelry.imageUrl,
          categoryId: jewelry.categoryId, 
        }
      }
    ]);
  } catch (error) {
    // handle error
  } finally {
    setAddingFavorite(null);
  }
};

  const removeFavorite = async (jewelryId: number) => {
    setRemovingFavorite(jewelryId);
    try {
      await removeFromFavorites(jewelryId);
      setFavorites(prev => prev.filter(item => item.jewellery.id !== jewelryId));
    } catch (error) {
      // handle error
    } finally {
      setRemovingFavorite(null);
    }
  };

  return {
    favorites,
    loading,
    removingFavorite,
    addingFavorite,
    fetchFavorites,
    addFavorite,
    removeFavorite,
    setFavorites,
  };
}