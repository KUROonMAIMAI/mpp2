import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, Image } from 'react-native';
import { Client } from 'paho-mqtt';

const Webcam = () => {
    const [imageBase64, setImageBase64] = useState<string | null>(null);

    useEffect(() => {
        const client = new Client(
            '7b67f158630548c4bc44852099288d08.s1.eu.hivemq.cloud',
            8884,
            'clientId_' + Math.random().toString(16).substr(2, 8)
        );

        client.onMessageArrived = (message: any) => {
            try {
                console.log('Message received:', message);
                const base64String = message.payloadString; // 直接取出 Base64 資料
                console.log('Base64 Data:', base64String);
                setImageBase64(base64String); // 直接更新 Base64 資料
            } catch (error) {
                console.error('Error processing message:', error);
            }
        };

        // 連接到 MQTT Broker
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
        <View style={styles.container}>
            <Text style={styles.title}>MQTT Base64 圖片顯示</Text>
            {imageBase64 ? (
                <Image
                    source={{ uri: `data:image/png;base64,${imageBase64}` }}
                    style={styles.image}
                />
            ) : (
                <Text style={styles.text}>等待接收圖片數據...</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    text: {
        fontSize: 16,
        color: '#333',
    },
    image: {
        width: 300,
        height: 300,
        resizeMode: 'contain',
        borderWidth: 1,
        borderColor: '#ddd',
    },
});

export default Webcam;
