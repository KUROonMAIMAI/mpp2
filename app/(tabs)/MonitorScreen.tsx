import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import { Button, Text, Icon } from "react-native-elements";
import { Client } from "paho-mqtt";

const MonitorScreen = () => {
  const [waterLevel, setWaterLevel] = useState<number | null>(null);
  const [petWeightHistory, setPetWeightHistory] = useState<string[]>([]);
  const [connectionStatus, setConnectionStatus] = useState("正在連接到 MQTT...");
  const [mqttClient, setMqttClient] = useState<Client | null>(null);

  const connectToMqtt = () => {
    if (mqttClient && mqttClient.isConnected()) {
      console.log("MQTT 已連接，無需重新連接");
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
      if (mqttClient) {
        mqttClient.connect({
          useSSL: true,
          userName: "tim031893",
          password: "Wayne0412907",
          onSuccess: () => {
            console.log("MQTT 已連接");
            setConnectionStatus("MQTT 已成功連接");
            mqttClient.subscribe("sensor/waterLevel");
            mqttClient.subscribe("sensor/petWeight");
            resolve();
          },
          onFailure: (error) => {
            console.error("MQTT 連接失敗:", error);
            setConnectionStatus(`MQTT 連接失敗: ${error.errorMessage || "未知錯誤"}`);
            reject(error);
          },
        });
      } else {
        console.error("MQTT 客戶端未初始化");
        reject(new Error("MQTT 客戶端未初始化"));
      }
    });
  };

  useEffect(() => {
    const client = new Client(
      "7b67f158630548c4bc44852099288d08.s1.eu.hivemq.cloud",
      8884,
      "clientId_" + Math.random().toString(16).substr(2, 8)
    );

    client.onMessageArrived = (message) => {
      const topic = message.destinationName;
      const payload = message.payloadString;
      console.log("收到 MQTT 消息:", topic, payload);

      if (topic === "sensor/waterLevel") {
        const numericValue = parseInt(payload, 10);
        if (!isNaN(numericValue)) {
          setWaterLevel(numericValue);
        }
      } else if (topic === "sensor/petWeight") {
        const formattedMessage = processPetWeightMessage(payload);
        if (formattedMessage) {
          setPetWeightHistory((prevHistory) => [...prevHistory, formattedMessage].slice(-10));
        }
      }
    };

    client.onConnectionLost = () => {
      console.error("MQTT 連接丟失，正在嘗試重連...");
      connectToMqtt();
    };

    setMqttClient(client);
    connectToMqtt();

    return () => {
      if (client.isConnected()) {
        client.unsubscribe("sensor/waterLevel");
        client.unsubscribe("sensor/petWeight");
        client.disconnect();
      }
    };
  }, []);

  const processPetWeightMessage = (message: string): string | null => {
    const parts = message.split(",");
    if (parts.length === 6) {
      const [yyyy, mm, dd, hh, min, weight] = parts;
      return `時間: ${yyyy}/${mm}/${dd} ${hh}:${min}, 體重: ${weight}`;
    }
    console.warn("體重數據格式不正確:", message);
    return null;
  };

  const sendMessage = async (channel: string, message: string) => {
    try {
      await connectToMqtt(); // 主動重新連接 MQTT
      if (mqttClient && mqttClient.isConnected()) {
        mqttClient.send(channel, message, 0, false);
        console.log(`已發送消息到 ${channel}:`, message);
      } else {
        Alert.alert("錯誤", "MQTT 未連接");
      }
    } catch (error) {
      console.error("消息發送失敗:", error);
      Alert.alert("錯誤", "消息發送失敗");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.welcomeText}>監測頁面</Text>
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>{connectionStatus}</Text>
      </View>

      <ScrollView style={{ width: "100%" }} contentContainerStyle={styles.scrollContainer}>
        {/* 水位數據顯示 */}
        <View style={styles.box}>
          <Text style={styles.dataTitle}>水位</Text>
          <Text style={styles.dataText}>
            {waterLevel !== null ? `水位: ${waterLevel}` : "數據加載中..."}
          </Text>
          <Button
            icon={<Icon name="reload1" type="antdesign" size={16} color="#fff" />}
            buttonStyle={styles.reloadButton}
            onPress={() => sendMessage("msg/waterLevelRequest", "110")}
          />
        </View>

        {/* 寵物重量歷史顯示 */}
        <View style={styles.box}>
          <Text style={styles.dataTitle}>寵物重量歷史</Text>
          {petWeightHistory.length > 0 ? (
            petWeightHistory.map((weight, index) => (
              <Text key={index} style={styles.dataText}>
                {weight}
              </Text>
            ))
          ) : (
            <Text style={styles.dataText}>暫無歷史數據</Text>
          )}
          <Button
            icon={<Icon name="reload1" type="antdesign" size={16} color="#fff" />}
            buttonStyle={styles.reloadButton}
            onPress={() => sendMessage("msg/petWeightRequest", "110")}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fcfcfc",
  },
  welcomeText: {
    fontSize: 30,
    color: "#00caca",
    marginBottom: 20,
  },
  statusContainer: {
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
  },
  statusText: {
    fontSize: 16,
    color: "#333",
  },
  scrollContainer: {
    alignItems: "center",
    paddingVertical: 10,
  },
  box: {
    marginVertical: 10,
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    width: "90%",
  },
  dataTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  dataText: {
    fontSize: 16,
    color: "#333",
    marginBottom: 10,
  },
  reloadButton: {
    backgroundColor: "#00caca",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "flex-end",
  },
});

export default MonitorScreen;
