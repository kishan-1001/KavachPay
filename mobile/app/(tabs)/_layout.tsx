import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { MapPin, TrendingUp, ShieldCheck, User } from 'lucide-react-native';
import { colors } from '../../lib/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.bar,
        tabBarActiveTintColor:   colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.label,
        tabBarItemStyle:  styles.item,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Map',
          tabBarIcon: ({ color }) => <MapPin color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="claims"
        options={{
          title: 'Claims',
          tabBarIcon: ({ color }) => <TrendingUp color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="policy"
        options={{
          title: 'Policy',
          tabBarIcon: ({ color }) => <ShieldCheck color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <User color={color} size={22} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor:  colors.surface,
    borderTopColor:   colors.border,
    borderTopWidth:   1,
    height:           62,
    paddingBottom:    8,
  },
  label: {
    fontSize:   10,
    fontWeight: '600',
    marginTop:  2,
  },
  item: {
    paddingTop: 8,
  },
});

