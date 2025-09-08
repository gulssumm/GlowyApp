import React from 'react';
import { TouchableOpacity, View, Image, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { jewelryCardStyles, productCardStyles, commonColors } from '../styles/commonStyles';
import { Jewellery } from "../types";


interface ProductCardProps {
  item: Jewellery;
  isFavorited: boolean;
  isTogglingFavorite: boolean;
  isAddingToCart: boolean;
  onToggleFavorite: (item: Jewellery, event: any) => void | Promise<void>;
  onAddToCart: (item: Jewellery, event: any) => void | Promise<void>;
  showDescription?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  item,
  isFavorited,
  isTogglingFavorite,
  isAddingToCart,
  onToggleFavorite,
  onAddToCart,
  showDescription = true,
}) => {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={productCardStyles.gridCard}
      onPress={() => router.push(`/product-detail?id=${item.id}`)}
    >
      <View style={productCardStyles.imageContainer}>
        <Image
          source={{ uri: item.imageUrl }}
          style={productCardStyles.gridImage}
        />
        <TouchableOpacity
          style={[
            jewelryCardStyles.favoriteButton,
            isTogglingFavorite && { opacity: 0.7 }
          ]}
          onPress={(e) => onToggleFavorite(item, e)}
          disabled={isTogglingFavorite}
        >
          <Ionicons
            name={
              isTogglingFavorite
                ? "time-outline"
                : isFavorited
                  ? "heart"
                  : "heart-outline"
            }
            size={20}
            color={isFavorited ? commonColors.error : commonColors.text.secondary}
          />
        </TouchableOpacity>
      </View>
      <View style={jewelryCardStyles.info}>
        <Text style={jewelryCardStyles.name}>{item.name}</Text>
        <Text style={jewelryCardStyles.price}>
          ${item.price.toLocaleString()}
        </Text>
        <TouchableOpacity
          style={[
            jewelryCardStyles.addToCartButton,
            isAddingToCart && { opacity: 0.7 }
          ]}
          onPress={(e) => onAddToCart(item, e)}
          disabled={isAddingToCart}
        >
          <Ionicons
            name={isAddingToCart ? "time-outline" : "bag-add"}
            size={20}
            color={commonColors.text.white}
          />
          <Text style={jewelryCardStyles.addToCartText}>
            {isAddingToCart ? "Adding..." : "Add to Cart"}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};