/**
 * App Stack
 * 
 * Main application navigation stack with all screens
 * Pattern from Module 1 AppStack
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppTabs } from './AppTabs';
import { ProductsCatalogScreen } from '../screens/products/ProductsCatalogScreen';

// Order Screens
import { OrderInfoScreen } from '../screens/orders/OrderInfoScreen';
import { DeliveryLocationScreen } from '../screens/orders/DeliveryLocationScreen';
import { OrderVitrineDetailScreen } from '../screens/orders/OrderVitrineDetailScreen';
import { OrderClientDetailScreen } from '../screens/orders/OrderClientDetailScreen';
import { OrderCallScreen } from '../screens/orders/OrderCallScreen';
import { MyPurchasesScreen } from '../screens/orders/MyPurchasesScreen';

// Product Screens
import { ProductDetailScreen } from '../screens/products/ProductDetailScreen';
import { CreateProductScreen } from '../screens/products/CreateProductScreen';
import { ProductManagementScreen } from '../screens/products/ProductManagementScreen';
import { EditProductScreen } from '../screens/products/EditProductScreen';

// Vitrine Screens
import { VitrineManagementScreen } from '../screens/vitrines/VitrineManagementScreen';
import { VitrineEditScreen } from '../screens/vitrines/VitrineEditScreen';
import { VitrineModificationMain } from '../screens/vitrines/VitrineModificationMain';
import { EditVitrineFieldScreen } from '../screens/vitrines/EditVitrineFieldScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';

// Auth Screens
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';

const Stack = createNativeStackNavigator();

export const AppStack = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
            }}
        >
            {/* Main Tabs */}
            <Stack.Screen name="MainTabs" component={AppTabs} />

            {/* Order Routes */}
            <Stack.Screen name="OrderInfo" component={OrderInfoScreen} />
            <Stack.Screen name="DeliveryLocation" component={DeliveryLocationScreen} />
            <Stack.Screen name="OrderVitrineDetail" component={OrderVitrineDetailScreen} />
            <Stack.Screen name="OrderClientDetail" component={OrderClientDetailScreen} />
            <Stack.Screen name="OrderCall" component={OrderCallScreen} />
            <Stack.Screen name="MyPurchases" component={MyPurchasesScreen} />

            {/* Product Routes */}
            <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
            <Stack.Screen name="CreateProduct" component={CreateProductScreen} />
            <Stack.Screen name="ProductManagement" component={ProductManagementScreen} />
            <Stack.Screen name="EditProduct" component={EditProductScreen} />

            {/* Vitrine Routes */}
            <Stack.Screen name="VitrineManagement" component={VitrineManagementScreen} />
            <Stack.Screen name="VitrineEdit" component={VitrineEditScreen} />
            <Stack.Screen name="VitrineModificationMain" component={VitrineModificationMain} />
            <Stack.Screen name="EditVitrineField" component={EditVitrineFieldScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="VitrineDetail" component={ProductsCatalogScreen} />

            {/* Auth Routes */}
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Navigator>
    );
};
