import React, { useEffect, useState } from "react";
import { View, StyleSheet, TextInput } from "react-native";
import { Button, Text } from "react-native-elements";
import { Client } from "paho-mqtt";

const DriveScreen = () => {
  const [foodDispenserStatus, setFoodDispenserStatus] = useState<string>("停止");
  const [connectionStatus, setConnectionStatus] = useState("正在連接到 MQTT...");
  const [mqttMessages, setMqttMessages] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string>("");
  const [isReconnecting, setIsReconnecting] = useState(false); // 標記是否正在重連
  const [isConnected, setIsConnected] = useState(false); // 標記 MQTT 是否已連接

  const mqttClient = new Client(
    "7b67f158630548c4bc44852099288d08.s1.eu.hivemq.cloud",
    8884,
    "clientId_" + Math.random().toString(16).substr(2, 8)
  );

  const connectToMqtt = () => {
    mqttClient.connect({
      useSSL: true,
      userName: "tim031893",
      password: "Wayne0412907",
      onSuccess: () => {
        console.log("MQTT 已連接");
        setConnectionStatus("MQTT 已成功連接");
        setIsConnected(true); // 設定為已連接
        mqttClient.subscribe("drive/foodDispenser");
        setIsReconnecting(false); // 重連成功後重置狀態
      },
      onFailure: (error) => {
        console.error("MQTT 連接失敗:", error);
        setConnectionStatus(`MQTT 連接失敗: ${error.errorMessage || "未知錯誤"}`);
        setIsReconnecting(false); // 重連失敗後重置狀態
        setIsConnected(false); // 設定為未連接
      },
    });
  };

  useEffect(() => {
    mqttClient.onConnectionLost = (responseObject) => {
      if (responseObject.errorCode !== 0) {
        console.error("MQTT 連接丟失:", responseObject.errorMessage);
        setConnectionStatus("MQTT 連接丟失，正在嘗試重連...");
        setIsConnected(false); // 設定為未連接
        if (!isReconnecting) {
          setIsReconnecting(true);
          setTimeout(connectToMqtt, 3000); // 3 秒後嘗試重連
        }
      }
    };

    mqttClient.onMessageArrived = (message) => {
      const topic = message.destinationName;
      const payload = message.payloadString;
      console.log("收到 MQTT 消息:", topic, payload);

      setMqttMessages((prev) => ({
        ...prev,
        [topic]: payload,
      }));

      if (topic === "drive/foodDispenser") {
        setFoodDispenserStatus(payload === "ON" ? "運行中" : "停止");
      }
    };

    connectToMqtt();

    return () => {
      if (mqttClient.isConnected()) {
        mqttClient.unsubscribe("drive/foodDispenser");
        mqttClient.disconnect();
      }
    };
  }, []);

  const toggleFoodDispenser = () => {
    if (!isConnected) {
      console.error("MQTT 尚未連接，無法切換飼料分配器");
      setConnectionStatus("MQTT 尚未連接，請稍後再試");
      return;
    }

    const newStatus = foodDispenserStatus === "運行中" ? "停止" : "運行中";
    setFoodDispenserStatus(newStatus);
    mqttClient.send("drive/foodDispenser", newStatus === "運行中" ? "ON" : "OFF", 0, false);
  };

  const sendMessage = () => {
    if (!isConnected) {
      if (!isReconnecting) {
        console.error("MQTT 尚未連接，嘗試重連...");
        setConnectionStatus("MQTT 尚未連接，嘗試重新連接...");
        reconnectAndSend(message);
      }
      return;
    }

    try {
      mqttClient.send("drive/msg", message, 0, false);
      setMessage(""); // 發送後清空輸入框
      console.log("訊息已發送:", message);
      setConnectionStatus("訊息已發送成功");
    } catch (error) {
      console.error("發送訊息失敗，嘗試重連:", error);
      setConnectionStatus("發送失敗，正在嘗試重新連接...");
      reconnectAndSend(message);
    }
  };

  const reconnectAndSend = (msg: string) => {
    if (isReconnecting) return; // 如果正在重連，避免重複觸發

    setIsReconnecting(true); // 設定為正在重連
    connectToMqtt(); // 執行連線邏輯

    setTimeout(() => {
      if (isConnected) {
        try {
          mqttClient.send("drive/msg", msg, 0, false);
          setMessage(""); // 發送後清空輸入框
          console.log("訊息已重新發送:", msg);
          setConnectionStatus("訊息已發送成功");
        } catch (error) {
          console.error("重連後發送失敗:", error);
          setConnectionStatus("重連後發送失敗，請檢查伺服器或網路");
        }
      } else {
        setConnectionStatus("重新連接失敗，請稍後再試");
      }
      setIsReconnecting(false); // 重連結束，重置狀態
    }, 3000); // 等待 3 秒確保連線成功
  };

  return (
    <View style={styles.container}>
      <Text style={styles.welcomeText}>驅動頁面</Text>
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>{connectionStatus}</Text>
      </View>

      <View style={styles.box}>
        <Text style={styles.normalText}>
          飼料分配器狀態: <Text style={styles.statusText}>{foodDispenserStatus}</Text>
        </Text>
        <Button
          title={foodDispenserStatus === "運行中" ? "停止飼料分配器" : "啟動飼料分配器"}
          buttonStyle={styles.button}
          onPress={toggleFoodDispenser}
        />
      </View>

      <View style={styles.box}>
        <Text style={styles.normalText}>MQTT 消息：</Text>
        <Text>{JSON.stringify(mqttMessages, null, 2)}</Text>
      </View>

      <View style={styles.box}>
        <TextInput
          style={styles.input}
          placeholder="輸入訊息發送到 MQTT"
          value={message}
          onChangeText={setMessage}
        />
        <Button title="發送訊息" buttonStyle={styles.button} onPress={sendMessage} />
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
  normalText: {
    fontSize: 16,
    color: "#333",
    marginVertical: 10,
  },
  box: {
    marginVertical: 10,
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
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
});

export default DriveScreen;
