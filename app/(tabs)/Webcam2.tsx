import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ScrollView } from 'react-native';
import { Client } from 'paho-mqtt';

const Webcam2 = () => {
  const [base64Data, setBase64Data] = useState<string | null>(null);

  useEffect(() => {
    const client = new Client(
      '7b67f158630548c4bc44852099288d08.s1.eu.hivemq.cloud',
      8884,
      'clientId_' + Math.random().toString(16).substr(2, 8)
    );

    client.onMessageArrived = (message: any) => {
      try {
        console.log('Message received:', message);
        const base64String = message.payloadString; // 直接使用 Base64 字符串
        setBase64Data(base64String);
        console.log('Base64 Data:', base64String);
      } catch (error) {
        console.error('Error processing message:', error);
      }
    };

    client.connect({
      useSSL: true,
      userName: 'tim031893',
      password: 'Wayne0412907',
      onSuccess: () => {
        console.log('MQTT webcam已連接');
        client.subscribe('sensor/Webcam');
      },
      onFailure: (error: any) => {
        console.error('MQTT webcam連接失敗:', error);
      },
    });

    // 清理資源
    return () => {
      if (client.isConnected()) {
        client.disconnect();
      }
    };
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>接收到的 Base64 資料</Text>
      <View style={styles.dataContainer}>
        {base64Data ? (
          <Text selectable style={styles.base64Text}>
            {base64Data}
          </Text>
        ) : (
          <Text style={styles.loadingText}>正在接收資料...</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  dataContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  base64Text: {
    fontSize: 14,
    color: '#333',
    lineHeight: 18,
  },
  loadingText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
});

export default Webcam2;
