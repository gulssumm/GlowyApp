import React from "react";
import { FlatList, TouchableOpacity, Text, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Category } from "@/types";
import { commonColors } from "@/styles/commonStyles";

interface CategoryTabsProps {
  categories: Category[];
  selectedCategory: number | null;
  onSelectCategory: (categoryId: number | null) => void;
  style?: object;
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  style,
}) => {
  const renderCategoryTab = ({ item }: { item: Category }) => {
    const isSelected = selectedCategory === item.id;
    return (
      <TouchableOpacity
        style={[
          styles.categoryTab,
          isSelected && styles.selectedCategoryTab,
          style,
        ]}
        onPress={() => onSelectCategory(isSelected ? null : item.id)}
      >
        <Ionicons
          name={item.icon as any}
          size={20}
          color={isSelected ? commonColors.text.white : commonColors.primary}
        />
        <Text style={[styles.categoryTabText, isSelected && styles.selectedCategoryTabText]}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.categoryTabsContainer}>
      <FlatList
        data={categories}
        renderItem={renderCategoryTab}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  categoryTabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  categoryTab: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  selectedCategoryTab: {
    backgroundColor: "#800080",
  },
  categoryTabText: {
    marginLeft: 8,
    color: "#800080",
    fontWeight: "bold",
  },
  selectedCategoryTabText: {
    color: "#fff",
  },
});