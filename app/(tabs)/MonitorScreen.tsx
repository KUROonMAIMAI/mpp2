import React, { useEffect, useState } from "react";
import { View, StyleSheet, Text, Dimensions, ScrollView, Button } from "react-native";
import { Client } from "paho-mqtt";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LineChart } from "react-native-chart-kit";

type ChartDataPoint = {
  time: string;
  value: number;
};

const MonitorScreen = () => {
  const [waterLevelData, setWaterLevelData] = useState<ChartDataPoint[]>([]);
  const [foodWeightData, setFoodWeightData] = useState<ChartDataPoint[]>([]);
  const [petWeightData, setPetWeightData] = useState<ChartDataPoint[]>([]);
  const [connectionStatus, setConnectionStatus] = useState("正在連接到 MQTT...");
  const [mqttClient, setMqttClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 獲取台灣時間
  const getTaiwanTime = (): string => {
    const now = new Date();
    now.setHours(now.getHours() + 8); // 台灣時間
    const pad = (n: number): string => (n < 10 ? `0${n}` : `${n}`);
    return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  };

  // 更新圖表數據
  const updateChartData = (
    value: string,
    setData: React.Dispatch<React.SetStateAction<ChartDataPoint[]>>,
    storageKey: string
  ) => {
    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) {
      console.warn(`接收到的數據無法解析為數字: ${value}`);
      return;
    }
    const time = getTaiwanTime();
    setData((prevData) => {
      const newData = [...prevData, { time, value: numericValue }];
      const trimmedData = newData.slice(-15);
      saveData(storageKey, trimmedData);
      return trimmedData;
    });
  };

  // 保存數據到 AsyncStorage
  const saveData = async (key: string, data: ChartDataPoint[]) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`保存數據失敗: ${key}`, error);
    }
  };

  // 從 AsyncStorage 加載數據
  const loadData = async (
    key: string,
    setData: React.Dispatch<React.SetStateAction<ChartDataPoint[]>>
  ) => {
    try {
      const storedData = await AsyncStorage.getItem(key);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        if (Array.isArray(parsedData)) {
          setData(parsedData);
        } else {
          console.warn(`數據格式不正確: ${key}`, parsedData);
        }
      }
    } catch (error) {
      console.error(`加載數據失敗: ${key}`, error);
    }
  };

  // 初始化 MQTT 客戶端
  const initMqttClient = () => {
    if (mqttClient) {
      mqttClient.disconnect();
    }
    const client = new Client(
      "7b67f158630548c4bc44852099288d08.s1.eu.hivemq.cloud",
      8884,
      "clientId_" + Math.random().toString(16).substr(2, 8)
    );

    client.onConnectionLost = (responseObject: any) => {
      if (responseObject.errorCode !== 0) {
        console.error("MQTT 連接丟失:", responseObject.errorMessage);
        setConnectionStatus("MQTT 連接丟失，嘗試重連...");
      }
    };

    client.onMessageArrived = (message: any) => {
      const topic = message.destinationName;
      const value = message.payloadString;
      console.log(`收到消息: Topic=${topic}, Value=${value}`);
      if (topic === "sensor/waterLevel") {
        updateChartData(value, setWaterLevelData, "waterLevelData");
      } else if (topic === "sensor/foodWeight") {
        updateChartData(value, setFoodWeightData, "foodWeightData");
      } else if (topic === "sensor/petWeight") {
        updateChartData(value, setPetWeightData, "petWeightData");
      }
    };

    client.connect({
      useSSL: true,
      userName: "tim031893",
      password: "Wayne0412907",
      onSuccess: () => {
        console.log("MQTT 已成功連接");
        setConnectionStatus("MQTT 已成功連接");
        client.subscribe("sensor/waterLevel");
        client.subscribe("sensor/foodWeight");
        client.subscribe("sensor/petWeight");
      },
      onFailure: (error: any) => {
        console.error("MQTT 連接失敗:", error);
        setConnectionStatus(`MQTT 連接失敗: ${error.errorMessage || "未知錯誤"}`);
      },
    });

    setMqttClient(client);
  };

  useEffect(() => {
    (async () => {
      await loadData("waterLevelData", setWaterLevelData);
      await loadData("foodWeightData", setFoodWeightData);
      await loadData("petWeightData", setPetWeightData);
      initMqttClient();
      setIsLoading(false);
    })();

    return () => {
      if (mqttClient) {
        mqttClient.disconnect();
      }
    };
  }, []);

  const chartConfig = {
    backgroundColor: "#ffffff",
    backgroundGradientFrom: "#f5f5f5",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: { borderRadius: 16 },
    propsForDots: { r: "4", strokeWidth: "2", stroke: "#ffa726" },
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <Text style={styles.welcomeText}>監測中心</Text>
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>{connectionStatus}</Text>
        <Button title="重新連接 MQTT" onPress={initMqttClient} />
      </View>
      {isLoading ? (
        <Text>數據加載中...</Text>
      ) : (
        <>
          {/* 水位圖表 */}
          <Text style={styles.chartTitle}>
            {waterLevelData.length > 0 ? "水位變化圖" : "水位數據加載中..."}
          </Text>
          {waterLevelData.length > 0 ? (
            <LineChart
              data={{
                labels: waterLevelData.map((item) => item.time),
                datasets: [{ data: waterLevelData.map((item) => item.value) }],
              }}
              width={Dimensions.get("window").width - 30}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chartStyle}
            />
          ) : (
            <Text>暫無水位數據</Text>
          )}
          {/* 飼料重量圖表 */}
          <Text style={styles.chartTitle}>
            {foodWeightData.length > 0 ? "飼料重量變化圖" : "飼料數據加載中..."}
          </Text>
          {foodWeightData.length > 0 ? (
            <LineChart
              data={{
                labels: foodWeightData.map((item) => item.time),
                datasets: [{ data: foodWeightData.map((item) => item.value) }],
              }}
              width={Dimensions.get("window").width - 30}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chartStyle}
            />
          ) : (
            <Text>暫無飼料數據</Text>
          )}
          {/* 寵物重量圖表 */}
          <Text style={styles.chartTitle}>
            {petWeightData.length > 0 ? "寵物重量變化圖" : "寵物數據加載中..."}
          </Text>
          {petWeightData.length > 0 ? (
            <LineChart
              data={{
                labels: petWeightData.map((item) => item.time),
                datasets: [{ data: petWeightData.map((item) => item.value) }],
              }}
              width={Dimensions.get("window").width - 30}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chartStyle}
            />
          ) : (
            <Text>暫無寵物數據</Text>
          )}
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    backgroundColor: "#fcfcfc",
  },
  welcomeText: { fontWeight: "bold", marginVertical: 5, color: "#00caca", fontSize: 30 },
  statusContainer: {
    marginVertical: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    alignItems: "center",
  },
  statusText: { fontSize: 16, color: "#333", textAlign: "center" },
  chartTitle: { fontSize: 18, marginVertical: 10, color: "#333" },
  chartStyle: { marginVertical: 8, borderRadius: 16 },
});

export default MonitorScreen;
