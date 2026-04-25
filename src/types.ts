export interface Order {
  id: string;
  items: MenuItem[];
  seat: string;
  block: string;
  landmark: string;
  customerName: string;
  customerPhone: string;
  status: 'pending' | 'preparing' | 'assigned' | 'delivering' | 'completed';
  vendorId?: string;
  createdAt: string;
  estimatedPrepTime: number; // in minutes
  adminMessage?: string;
  feedback?: {
    rating: number;
    comment: string;
  };
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  icon: string;
  avgPrepTime: number;
  brandId?: string;
  description?: string;
}

export interface Shop {
  id: string;
  name: string;
  logo: string;
  rating: string;
  description: string;
  tagline: string;
}

export const SHOPS: Shop[] = [
  { id: 'lapinoz', name: 'La Pino\'z Pizza', logo: '🍕', rating: '4.8', tagline: 'Giant Slices, Giant Taste', description: 'Famous for their 24-inch giant pizzas and creative Indian toppings.' },
  { id: 'bk', name: 'Burger King', logo: '🍔', rating: '4.6', tagline: 'Be Your Way', description: 'The home of the Whopper, serving flame-grilled burgers since 1954.' },
  { id: 'behrouz', name: 'Behrouz Biryani', logo: '🥘', rating: '4.9', tagline: 'The Secret Recipe of kings', description: 'Experience the royal flavors of carefully crafted Biryani.' },
  { id: 'chaayos', name: 'Chaayos', logo: '☕', rating: '4.7', tagline: 'Experiments with Chai', description: 'Personalized chai made just the way you like it with 100+ customizations.' },
  { id: 'starbucks', name: 'Starbucks', logo: '🥤', rating: '4.8', tagline: 'Inspiring through Coffee', description: 'Premium coffee house offering global favorites and seasonal specials.' },
  { id: 'faasos', name: 'Faasos', logo: '🌯', rating: '4.5', tagline: 'Surprises in every wrap', description: 'Gourmet wraps and rolls that redefined street food for the modern age.' },
];

export const MENU: MenuItem[] = [
  // La Pino'z
  { id: 'lp1', name: 'Paneer Tikka Pizza', price: 450, category: 'PIZZA', icon: 'Pizza', avgPrepTime: 12, brandId: 'lapinoz', description: 'Spiced paneer with onions and capsicum.' },
  { id: 'lp2', name: '7 Cheese Pizza', price: 550, category: 'PIZZA', icon: 'Pizza', avgPrepTime: 15, brandId: 'lapinoz', description: 'A blend of 7 different gourmet cheeses.' },
  { id: 'lp3', name: 'Garlic Stuffed Crust', price: 120, category: 'SNACKS', icon: 'Sandwich', avgPrepTime: 8, brandId: 'lapinoz' },
  
  // Burger King
  { id: 'bk1', name: 'Veg Whopper', price: 199, category: 'SNACKS', icon: 'Burger', avgPrepTime: 8, brandId: 'bk' },
  { id: 'bk2', name: 'Crispy Chicken Burger', price: 219, category: 'SNACKS', icon: 'Burger', avgPrepTime: 10, brandId: 'bk' },
  { id: 'bk3', name: 'Fiery Fries', price: 99, category: 'SNACKS', icon: 'Sandwich', avgPrepTime: 5, brandId: 'bk' },
  
  // Behrouz
  { id: 'br1', name: 'Subz-e-Falafel Biryani', price: 380, category: 'SNACKS', icon: 'Utensils', avgPrepTime: 15, brandId: 'behrouz' },
  { id: 'br2', name: 'Murgh Makhani Biryani', price: 480, category: 'SNACKS', icon: 'Utensils', avgPrepTime: 18, brandId: 'behrouz' },
  
  // Chaayos
  { id: 'ch1', name: 'Adrak Tulsi Chai', price: 80, category: 'DRINKS', icon: 'Coffee', avgPrepTime: 4, brandId: 'chaayos' },
  { id: 'ch2', name: 'Bun Maska', price: 60, category: 'SNACKS', icon: 'Sandwich', avgPrepTime: 3, brandId: 'chaayos' },
  { id: 'ch3', name: 'Vada Pav', price: 90, category: 'SNACKS', icon: 'Sandwich', avgPrepTime: 5, brandId: 'chaayos' },

  // Starbucks
  { id: 'sb1', name: 'Java Chip Frappuccino', price: 345, category: 'DRINKS', icon: 'IceCream', avgPrepTime: 7, brandId: 'starbucks' },
  { id: 'sb2', name: 'Iced Caramel Macchiato', price: 310, category: 'DRINKS', icon: 'Coffee', avgPrepTime: 6, brandId: 'starbucks' },
  { id: 'sb3', name: 'Blueberry Muffin', price: 210, category: 'SNACKS', icon: 'IceCream', avgPrepTime: 5, brandId: 'starbucks' },

  // Faasos
  { id: 'fs1', name: 'Butter Chicken Wrap', price: 280, category: 'SNACKS', icon: 'Wrap', avgPrepTime: 10, brandId: 'faasos' },
  { id: 'fs2', name: 'Paneer Mayonnaise Wrap', price: 240, category: 'SNACKS', icon: 'Wrap', avgPrepTime: 8, brandId: 'faasos' },
];

export interface Vendor {
  id: string;
  name: string;
  location: string;
  status: 'idle' | 'preparing' | 'delivering';
}

export const BLOCKS = ['Block A', 'Block B', 'Block C', 'Block D', 'Block E', 'Block F', 'Block G', 'Block H'];

export const PICKUP_LOCATIONS = [
  { id: 'K1', name: 'East Side Kitchen', location: 'Gate 2' },
  { id: 'K2', name: 'West Side Kitchen', location: 'Gate 7' },
];
