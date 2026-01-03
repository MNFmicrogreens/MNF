
export interface Microgreen {
  id: string;
  name: string;
  description: string;
  image: string;
  pricePerUnit: number;
  availableWeights: number[]; // v gramoch, napr. [50, 100, 250]
}

export interface OrderItem {
  microgreenId: string;
  weight: number;
  quantity: number;
}

export interface Order {
  id: string;
  restaurantId: string; // ID reštaurácie (názov v tomto deme)
  restaurantName: string;
  items: OrderItem[];
  timestamp: number;
  status: 'pending' | 'completed';
}

export interface AggregatedOrder {
  microgreenId: string;
  name: string;
  totalQuantity: number;
  breakdown: {
    weight: number;
    count: number;
  }[];
}

export type ViewMode = 'customer' | 'admin' | 'auth';
