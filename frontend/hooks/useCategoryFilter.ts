import { useMemo } from "react";
import { FavoriteItem } from "@/types";

export function useFavoriteCategoryFilter(favorites: FavoriteItem[], selectedCategory: number | null) {
  return useMemo(() => {
    if (!selectedCategory) return favorites;
    return favorites.filter(
      (item) => item.jewellery && item.jewellery.categoryId === selectedCategory
    );
  }, [favorites, selectedCategory]);
}