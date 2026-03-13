/**
 * App Tabs
 * 
 * Bottom tab navigation for main app sections
 * Pattern from Module 1 AppTabs
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, useWindowDimensions, Platform } from 'react-native';
import { ProductsCatalogScreen } from '../screens/products/ProductsCatalogScreen';
import { OrdersListScreen } from '../screens/orders/OrdersListScreen';
import { CreateProductScreen } from '../screens/products/CreateProductScreen';
import { usePendingSellerOrdersCount } from '../hooks/useCommandes';


const Tab = createBottomTabNavigator();

export const AppTabs = () => {
    const pendingCount = usePendingSellerOrdersCount();
    const { width } = useWindowDimensions();
    const isDesktop = width > 768;
    const MAX_WIDTH = 1000;

    const Navigator = (
        <Tab.Navigator
            id="main-tabs"
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
                tabBarStyle: isDesktop ? {
                    maxWidth: MAX_WIDTH,
                    alignSelf: 'center',
                    borderRadius: 15,
                    bottom: 20,
                    marginHorizontal: 20,
                    height: 60,
                    position: 'absolute',
                } : undefined
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
                options={{
                    tabBarLabel: 'Commandes',
                    tabBarBadge: pendingCount > 0 ? (pendingCount > 99 ? '99+' : pendingCount) : undefined,
                    tabBarBadgeStyle: { backgroundColor: '#FF3B30', fontSize: 10 }
                }}
            />

        </Tab.Navigator>
    );

    if (isDesktop) {
        return (
            <View style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
                {Navigator}
            </View>
        );
    }

    return Navigator;
};
