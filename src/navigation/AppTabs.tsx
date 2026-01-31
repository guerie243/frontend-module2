/**
 * App Tabs
 * 
 * Bottom tab navigation for main app sections
 * Pattern from Module 1 AppTabs
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ProductsCatalogScreen } from '../screens/products/ProductsCatalogScreen';
import { OrdersListScreen } from '../screens/orders/OrdersListScreen';
import { CreateProductScreen } from '../screens/products/CreateProductScreen';


const Tab = createBottomTabNavigator();

export const AppTabs = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: any;

                    if (route.name === 'HomeTab') {
                        iconName = focused ? 'storefront' : 'storefront-outline';
                    } else if (route.name === 'AddProductTab') {
                        iconName = focused ? 'add-circle' : 'add-circle-outline';
                    } else if (route.name === 'OrdersTab') {
                        iconName = focused ? 'receipt' : 'receipt-outline';

                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#007AFF',
                tabBarInactiveTintColor: '#8E8E93',
            })}
        >
            <Tab.Screen
                name="HomeTab"
                component={ProductsCatalogScreen}
                options={{ tabBarLabel: 'Ma Vitrine' }}
            />
            <Tab.Screen
                name="AddProductTab"
                component={CreateProductScreen}
                options={{ tabBarLabel: 'Ajouter' }}
            />
            <Tab.Screen
                name="OrdersTab"
                component={OrdersListScreen}
                options={{ tabBarLabel: 'Commandes' }}
            />

        </Tab.Navigator>
    );
};
