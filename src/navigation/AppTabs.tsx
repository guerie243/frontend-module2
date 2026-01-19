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
import { VitrineDetailScreen } from '../screens/vitrines/VitrineDetailScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';

const Tab = createBottomTabNavigator();

export const AppTabs = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: any;

                    if (route.name === 'ProductsTab') {
                        iconName = focused ? 'grid' : 'grid-outline';
                    } else if (route.name === 'OrdersTab') {
                        iconName = focused ? 'receipt' : 'receipt-outline';
                    } else if (route.name === 'VitrineTab') {
                        iconName = focused ? 'storefront' : 'storefront-outline';
                    } else if (route.name === 'SettingsTab') {
                        iconName = focused ? 'settings' : 'settings-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#007AFF',
                tabBarInactiveTintColor: '#8E8E93',
            })}
        >
            <Tab.Screen 
                name="ProductsTab" 
                component={ProductsCatalogScreen}
                options={{ tabBarLabel: 'Produits' }}
            />
            <Tab.Screen 
                name="OrdersTab" 
                component={OrdersListScreen}
                options={{ tabBarLabel: 'Commandes' }}
            />
            <Tab.Screen 
                name="VitrineTab" 
                component={VitrineDetailScreen}
                options={{ tabBarLabel: 'Vitrine' }}
            />
            <Tab.Screen 
                name="SettingsTab" 
                component={SettingsScreen}
                options={{ tabBarLabel: 'Paramètres' }}
            />
        </Tab.Navigator>
    );
};
