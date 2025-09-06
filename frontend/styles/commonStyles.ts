import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

// Define base colors
export const commonColors = {
  primary: '#800080',
  background: '#fff',
  border: '#f0f0f0',
  text: {
    primary: '#333',
    secondary: '#666',
    white: '#fff',
    light: '#999',
  },
  error: '#ff4444',
  success: '#4BB543',
  warning: '#ffbb33',
};

// Define common spacing
export const commonSpacing = {
  xs: 5,
  s: 8,
  m: 15,
  l: 20,
};

// Define common shadow
export const commonShadow = {
  light: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  }
};

// Header specific styles
export const headerStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: commonSpacing.l,
    paddingVertical: commonSpacing.m,
    backgroundColor: commonColors.background,
    borderBottomWidth: 1,
    borderBottomColor: commonColors.border,
  },
  menuButton: {
    padding: commonSpacing.xs,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: commonColors.primary,
  }
});

// Jewelry card styles
export const jewelryCardStyles = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: commonColors.background,
    borderRadius: 15,
    marginBottom: 15,
    marginHorizontal: 5,
    ...commonShadow.light,
  },
  imageContainer: {
    position: "relative",
  },
  image: {
    width: "100%",
    height: 150,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  favoriteButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    ...commonShadow.light,
  },
  info: {
    padding: commonSpacing.m,
  },
  name: {
    fontSize: 14,
    fontWeight: "bold",
    color: commonColors.text.primary,
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: commonColors.text.secondary,
    marginBottom: 8,
    lineHeight: 16,
  },
  price: {
    fontSize: 16,
    fontWeight: "bold",
    color: commonColors.primary,
    marginBottom: 10,
  },
  addToCartButton: {
    backgroundColor: commonColors.primary,
    borderRadius: 8,
    padding: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  addToCartText: {
    color: commonColors.text.white,
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 4,
  }
});
export const productCardStyles = StyleSheet.create({
  gridCard: {
    width: '48%',
    backgroundColor: commonColors.background,
    borderRadius: 15,
    marginBottom: 15,
    marginHorizontal: 5,
    ...commonShadow.light,
  },
  listCard: {
    backgroundColor: commonColors.background,
    borderRadius: 15,
    marginBottom: 15,
    ...commonShadow.light,
  },
  // Shared styles
  imageContainer: {
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: 150,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  listImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 15,
  },
  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    ...commonShadow.light,
  },
  info: {
    padding: commonSpacing.m,
    flex: 1,
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: commonColors.text.primary,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: commonColors.text.secondary,
    marginBottom: 8,
    height: 40,
    lineHeight: 20,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: commonColors.primary,
    marginBottom: 8,
  },
  addedDate: {
    fontSize: 12,
    color: commonColors.text.light,
  },
  actionButtons: {
    flexDirection: 'column',
    gap: 8,
    marginTop: 8,
  },
  // Primary action button 
  primaryActionButton: {
    backgroundColor: commonColors.primary,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Secondary action button 
  secondaryActionButton: {
    backgroundColor: commonColors.error,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Legacy styles for backward compatibility
  actionButton: {
    flex: 1,
    backgroundColor: commonColors.primary,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButton: {
    backgroundColor: commonColors.error,
  },
  buttonText: {
    color: commonColors.text.white,
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
});