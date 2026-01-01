
export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  imageURL: string;
  activeStatus: boolean;
}

export interface Category {
  id: string;
  name: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  orderId: string;
  customerId: string;
  customerName?: string;
  itemsJSON: string;
  items?: OrderItem[];
  totalPrice: number;
  paymentStatus: string;
  orderStatus: 'Pending' | 'Processing' | 'Delivered' | 'Cancelled';
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}
