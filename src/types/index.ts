/**
 * TypeScript Type Definitions
 * 
 * Centralized type definitions for the entire application
 */

export interface User {
    id?: string;
    _id?: string;
    userId?: string;
    email?: string;
    name?: string;
    profileName?: string;
    phoneNumber?: string;
    phone?: string;
    firebaseToken?: string;
    webPushToken?: string;
    avatar?: string;
    profilePhoto?: string;
    createdAt?: string;
}

export interface Product {
    id?: string;
    _id?: string;
    productId?: string;
    name: string;
    slug: string;
    description?: string;
    price: number;
    category: string;
    images: string[];
    vitrineId: string;
    locations?: string | string[];
    stock?: number;
    currency?: string;
    deliveryFee?: number;
    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface OrderProduct {
    productId: string;
    productName: string;
    productSlug?: string;
    productImage?: string;
    quantity: number;
    price: number;
    currency?: string;
    locations?: string | string[];
}

export interface Order {
    id?: string;
    _id?: string;
    orderId?: string;
    products: OrderProduct[];
    clientName: string;
    clientPhone: string;
    deliveryAddress: string;
    city?: string;
    commune?: string;
    deliveryLocation?: {
        latitude: number;
        longitude: number;
    };
    gpsCoords?: {
        latitude: number;
        longitude: number;
    };
    vitrineId: string;
    vitrineName?: string;
    status: 'pending' | 'confirmed' | 'preparing' | 'delivering' | 'completed' | 'cancelled';
    totalPrice: number;
    notes?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface Vitrine {
    id?: string;
    _id?: string;
    vitrineId?: string;
    slug: string;
    name: string;
    description?: string;
    logo?: string;
    avatar?: string;
    coverImage?: string;
    banner?: string;
    type?: string;
    category?: string;
    address?: string;
    city?: string;
    contact?: {
        email?: string;
        phone?: string;
    };
    ownerId?: string;
    owner?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface CartItem {
    product: Product;
    quantity: number;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
