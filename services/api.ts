
import { Product, Category, Order, ApiResponse, User } from '../types';

/**
 * The Deployment ID provided by the user.
 * This is the ID from your "Web App" deployment in Google Apps Script.
 */
export const SCRIPT_ID: string = 'AKfycbxmmHuPAunoik3krEqR5jjUC26phpiodwyo0I_uD0noSnU4m4X9xBrp7tFkeTSJYfR8'; 
const API_URL = `https://script.google.com/macros/s/${SCRIPT_ID}/exec`;

export const isApiConfigured = SCRIPT_ID !== 'YOUR_SCRIPT_ID' && SCRIPT_ID.length > 20;

/**
 * Generic fetch wrapper for Google Apps Script Web App.
 * Uses text/plain to avoid CORS preflight (OPTIONS) which GAS doesn't support directly.
 */
async function callApi<T>(action: string, payload: any = {}): Promise<ApiResponse<T>> {
  if (!isApiConfigured) {
    return { success: false, message: 'Backend not configured. Please set your Script ID in services/api.ts.' };
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      mode: 'cors',
      // Using 'text/plain' ensures no preflight OPTIONS request is sent to Google.
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify({ action, ...payload }),
    });

    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error(`API Error (${action}):`, error);
    return { 
      success: false, 
      message: `Network Error: Could not connect to the restaurant backend. 
      Check if your Apps Script is authorized and deployed for 'Anyone'.`
    };
  }
}

export const api = {
  getProducts: () => callApi<Product[]>('getProducts'),
  addProduct: (product: Omit<Product, 'id'>) => callApi<boolean>('addProduct', { product }),
  updateProduct: (product: Product) => callApi<boolean>('updateProduct', { product }),
  deleteProduct: (id: string) => callApi<boolean>('deleteProduct', { id }),
  getCategories: () => callApi<Category[]>('getCategories'),
  addCategory: (name: string) => callApi<boolean>('addCategory', { name }),
  login: (email: string, password: string) => callApi<{ user: User }>('login', { email, password }),
  register: (name: string, email: string, password: string) => callApi<{ user: User }>('register', { name, email, password }),
  createOrder: (order: Partial<Order>) => callApi<{ orderId: string }>('createOrder', { order }),
  getOrders: (customerId?: string) => callApi<Order[]>('getOrders', { customerId }),
  updateOrderStatus: (orderId: string, status: string) => callApi<boolean>('updateOrderStatus', { orderId, status }),
};
