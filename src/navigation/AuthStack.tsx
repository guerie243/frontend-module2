/**
 * Authentication Stack
 * 
 * Navigation stack for authentication screens
 * Pattern from Module 1 AuthStack
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { ProductsCatalogScreen } from '../screens/products/ProductsCatalogScreen';
import { ProductDetailScreen } from '../screens/products/ProductDetailScreen';
import { OrderInfoScreen } from '../screens/orders/OrderInfoScreen';
import { DeliveryLocationScreen } from '../screens/orders/DeliveryLocationScreen';
import { OrderCallScreen } from '../screens/orders/OrderCallScreen';
import { OrderVitrineDetailScreen } from '../screens/orders/OrderVitrineDetailScreen';
import { OrderClientDetailScreen } from '../screens/orders/OrderClientDetailScreen';

const Stack = createNativeStackNavigator();

export const AuthStack = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />

            {/* Guest Routes */}
            <Stack.Screen name="VitrineGuest" component={ProductsCatalogScreen} />
            <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
            <Stack.Screen name="OrderInfo" component={OrderInfoScreen} />
            <Stack.Screen name="DeliveryLocation" component={DeliveryLocationScreen} />
            <Stack.Screen name="OrderCall" component={OrderCallScreen} />
            <Stack.Screen name="OrderVitrineDetail" component={OrderVitrineDetailScreen} />
            <Stack.Screen name="OrderClientDetail" component={OrderClientDetailScreen} />
        </Stack.Navigator>
    );
};
