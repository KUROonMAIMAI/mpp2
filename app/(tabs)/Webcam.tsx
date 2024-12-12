import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Text, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Client, Message } from 'paho-mqtt';

const Webcam = () => {
    const [imageBase64Current, setImageBase64Current] = useState<string | null>(null); // 當前顯示的圖片
    const [imageBase64Next, setImageBase64Next] = useState<string | null>(null); // 下一張圖片
    const [isLoading, setIsLoading] = useState(true); // 初次加載狀態
    const clientRef = useRef<Client | null>(null);

    useEffect(() => {
        const client = new Client(
            '7b67f158630548c4bc44852099288d08.s1.eu.hivemq.cloud',
            8884,
            'clientId_' + Math.random().toString(16).substr(2, 8)
        );

        clientRef.current = client;

        client.onMessageArrived = (message: any) => {
            try {
                const base64String = message.payloadString;
                setImageBase64Next(base64String); // 將新數據暫存到下一張圖片
            } catch (error) {
                console.error('Error processing message:', error);
            }
        };

        client.connect({
            useSSL: true,
            userName: 'tim031893',
            password: 'Wayne0412907',
            onSuccess: () => {
                console.log('MQTT 客戶端已連接');
                client.subscribe('sensor/Webcam');
            },
            onFailure: (error: any) => {
                console.error('MQTT 連接失敗:', error);
            },
        });

        return () => {
            if (client.isConnected()) {
                client.disconnect();
            }
        };
    }, []);

    useEffect(() => {
        if (imageBase64Next) {
            // 當接收到下一張圖片時
            setImageBase64Current(imageBase64Next); // 切換當前圖片
            if (isLoading) setIsLoading(false); // 第一次接收圖片後，結束加載狀態
        }
    }, [imageBase64Next]);

    useFocusEffect(
        React.useCallback(() => {
            const sendMessage = (topic: string, message: string) => {
                if (clientRef.current?.isConnected()) {
                    const mqttMessage = new Message(message);
                    mqttMessage.destinationName = topic;
                    clientRef.current.send(mqttMessage);
                    console.log(`已發送消息: ${message} 至 ${topic}`);
                }
            };

            // 進入頁面時發送消息
            sendMessage('drive/WebcamStart', 'pstart');

            return () => {
                // 離開頁面時發送消息
                sendMessage('drive/WebcamStop', 'pstop');
            };
        }, [])
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>MQTT Base64 圖片顯示</Text>
            {!isLoading && imageBase64Current ? (
                <Image
                    source={{ uri: `data:image/png;base64,${imageBase64Current}` }}
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
        backgroundColor: '#f8f8f8',
    },
});

export default Webcam;
