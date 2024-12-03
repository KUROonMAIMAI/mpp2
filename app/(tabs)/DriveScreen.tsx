import React, { useEffect, useState } from "react";
import { View, StyleSheet, TextInput, Alert, ScrollView } from "react-native";
import { Button, Text, Icon } from "react-native-elements";
import { Client } from "paho-mqtt";

const DriveScreen = () => {
  const [foodWeight, setFoodWeight] = useState<string>(""); // 上半部輸入欄位的食物重量
  const [feedingTime, setFeedingTime] = useState<string>(""); // 下半部輸入的時間
  const [feedingWeight, setFeedingWeight] = useState<string>(""); // 下半部輸入的投餵重量
  const [monitorContent, setMonitorContent] = useState<string>("等待接收監控資料..."); // 中間 View 顯示的內容
  const [connectionStatus, setConnectionStatus] = useState("正在連接到 MQTT...");

  const mqttClient = new Client(
    "7b67f158630548c4bc44852099288d08.s1.eu.hivemq.cloud",
    8884,
    "clientId_" + Math.random().toString(16).substr(2, 8)
  );

  const connectToMqtt = () => {
    if (mqttClient.isConnected()) {
      console.log("MQTT 已連接，無需重新連接");
      return;
    }

    mqttClient.connect({
      useSSL: true,
      userName: "tim031893",
      password: "Wayne0412907",
      onSuccess: () => {
        console.log("MQTT 已連接");
        setConnectionStatus("MQTT 已成功連接");
        mqttClient.subscribe("msg/RGMonitor");
      },
      onFailure: (error) => {
        console.error("MQTT 連接失敗:", error);
        setConnectionStatus(`MQTT 連接失敗: ${error.errorMessage || "未知錯誤"}`);
      },
    });
  };

  const processMonitorContent = (message: string): string => {
    const parts = message.split(",");
    if (parts.length === 3) {
      const [hh, mm, weight] = parts;
      return `時間: ${hh}:${mm} 重量(公克): ${weight}`;
    }
    return "格式錯誤，無法顯示監控資料";
  };

  useEffect(() => {
    mqttClient.onMessageArrived = (message) => {
      const topic = message.destinationName;
      const payload = message.payloadString;
      console.log("收到 MQTT 消息:", topic, payload);

      if (topic === "msg/RGMonitor") {
        const formattedContent = processMonitorContent(payload);
        setMonitorContent(formattedContent);
      }
    };

    mqttClient.onConnectionLost = () => {
      console.error("MQTT 連接丟失，正在嘗試重連...");
      connectToMqtt();
    };

    connectToMqtt();

    return () => {
      if (mqttClient.isConnected()) {
        mqttClient.unsubscribe("msg/RGMonitor");
        mqttClient.disconnect();
      }
    };
  }, []);

  const sendMessage = async (channel: string, message: string) => {
    if (!mqttClient.isConnected()) {
      console.log(`頻道 ${channel} 尚未連接，正在嘗試重新連接...`);
      try {
        await new Promise((resolve, reject) => {
          mqttClient.connect({
            useSSL: true,
            userName: "tim031893",
            password: "Wayne0412907",
            onSuccess: () => {
              console.log(`頻道 ${channel} 重新連接成功`);
              resolve(true);
            },
            onFailure: (error) => {
              console.error(`頻道 ${channel} 重新連接失敗:`, error);
              reject(new Error(`頻道 ${channel} 連接失敗`));
            },
          });
        });
      } catch (error) {
        Alert.alert("錯誤", `無法連接到頻道 ${channel}，請檢查網絡或服務器設置`);
        return;
      }
    }

    try {
      mqttClient.send(channel, message, 0, false);
      console.log(`已發送消息到 ${channel}:`, message);
    } catch (error) {
      console.error(`發送消息到 ${channel} 失敗:`, error);
      Alert.alert("錯誤", `消息發送失敗，請檢查頻道 ${channel} 的連接狀態`);
    }
  };

  const sendFoodWeight = () => {
    if (!/^\d+$/.test(foodWeight) || parseInt(foodWeight, 10) >= 500) {
      Alert.alert("格式錯誤", "食物重量必須是小於 500 的數字");
      return;
    }
    sendMessage("drive/RN", foodWeight);
    setFoodWeight("");
  };

  const reloadFixedFeedingTime = () => {
    sendMessage("msg/RGR", "110");
  };

  const sendFeedingInfo = () => {
    if (!/^\d{4}$/.test(feedingTime) || parseInt(feedingTime.slice(0, 2)) > 23 || parseInt(feedingTime.slice(2, 4)) > 59) {
      Alert.alert("格式錯誤", "投餵時間必須是四位數字，並對應 24 小時制時間");
      return;
    }

    if (!/^\d+$/.test(feedingWeight) || parseInt(feedingWeight, 10) >= 500) {
      Alert.alert("格式錯誤", "投餵重量必須是小於 500 的數字");
      return;
    }

    const message = `${feedingTime},${feedingWeight}`;
    sendMessage("drive/RG", message);
    setFeedingTime("");
    setFeedingWeight("");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.welcomeText}>驅動頁面</Text>
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>{connectionStatus}</Text>
      </View>

      {/* 上半部 */}
      <View style={styles.box}>
        <TextInput
          style={styles.input}
          placeholder="輸入食物重量 (小於 500)"
          value={foodWeight}
          onChangeText={setFoodWeight}
        />
        <Button title="送出" buttonStyle={styles.button} onPress={sendFoodWeight} />
      </View>

      {/* 中間 Reload 按鈕與 View 格 */}
      <View style={[styles.box]}>
        <View style={styles.reloadButtonContainer}>
          <Button
            icon={<Icon name="reload1" type="antdesign" size={16} color="#fff" />}
            buttonStyle={styles.reloadButton}
            onPress={reloadFixedFeedingTime}
          />
        </View>
        <ScrollView style={styles.monitorContainer}>
          <Text style={styles.monitorText}>{monitorContent}</Text>
        </ScrollView>
      </View>

      {/* 下半部 */}
      <View style={styles.box}>
        <TextInput
          style={styles.input}
          placeholder="輸入投餵時間 (格式: HHmm)"
          value={feedingTime}
          onChangeText={setFeedingTime}
        />
        <TextInput
          style={styles.input}
          placeholder="輸入投餵重量 (小於 500)"
          value={feedingWeight}
          onChangeText={setFeedingWeight}
        />
        <Button title="送出" buttonStyle={styles.button} onPress={sendFeedingInfo} />
      </View>
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
  monitorText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
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
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    width: "100%",
  },
  button: {
    backgroundColor: "#00caca",
    borderRadius: 5,
    padding: 10,
  },
  reloadButtonContainer: {
    alignItems: "flex-end",
    marginBottom: 10,
  },
  reloadButton: {
    backgroundColor: "#00caca",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  viewContainer: {
    width: "100%",
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  monitorContainer: {
    marginVertical: 1,
    width: "100%",
    paddingVertical: 10,
    paddingHorizontal: 50,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
});

export default DriveScreen;
