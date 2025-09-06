export interface Jewellery {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category?: string; 
}

export interface FavoriteStatus {
  [key: number]: boolean;
}

export interface Category {
  id: number;
  name: string;
  icon: string;
}