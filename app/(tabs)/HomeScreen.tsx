// HomeScreen.tsx
import * as React from 'react';
import { View, StyleSheet, ImageBackground } from 'react-native';
import { Button, Text } from 'react-native-elements';

const HomeScreen = ({ navigation }: { navigation: any }) => {
  return (
    <ImageBackground
      source={require('./assets/catt.jpg')} // 替換成你的本地圖片路徑
      style={styles.backgroundImage}
    >
    <View style={styles.container}>
      <Text h1 style={styles.title}>南華大學</Text>
      <Text h3 style={styles.subtitle}>寵物照護系統</Text>
      
      <Button
        title="開始使用"
        buttonStyle={styles.button}
        titleStyle={styles.buttonText}
        onPress={() => navigation.navigate('Drive')}
      />
    </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#00e3e3',
  },
  title: {
    marginBottom: 20,
    color: '#22727',
  },
  subtitle: {
    marginBottom: 130,
    color: '#272727',
  },

  button: {
    backgroundColor: '#fcfcfc',
    paddingHorizontal: 50,
    paddingVertical: 15,
    borderRadius: 20,
  },

  buttonText: {
    color: '#272727',
    fontSize: 16,
    fontWeight: 'bold',
  },

  backgroundImage: {
    flex: 1,
    resizeMode: 'cover', // 確保圖片覆蓋整個背景
  },
});

export default HomeScreen;