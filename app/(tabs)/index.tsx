import * as React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Feather';

import DriveScreen from './DriveScreen';
import MonitorScreen from './MonitorScreen';
import Webcam from './Webcam';
import Webcam2 from './Webcam2';
import HomeScreen from './HomeScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();


const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName = '';

          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'Drive':
              iconName = 'cpu';
              break;
            case 'Monitor':
              iconName = 'activity';
              break;
            case 'Webcam':
              iconName = 'camera';
              break;
            default:
              iconName = 'circle';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007bff',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: '首頁' }} />
      <Tab.Screen name="Drive" component={DriveScreen} options={{ title: '操控' }} />
      <Tab.Screen name="Monitor" component={MonitorScreen} options={{ title: '監測' }} />
      <Tab.Screen name="Webcam" component={Webcam} options={{ title: '影像' }} />
      <Tab.Screen name="Webcam2" component={Webcam2} options={{ title: '64碼閱讀' }} />

    </Tab.Navigator>
  );
};


export default MainTabs;

