import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, ScrollView } from "react-native";
import HighlightButton from "./components/HighlightButton";
import { Login } from "./constants/Login";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MD5 from "crypto-js/md5";

export default function App() {
  const [wifiState, setWifiState] = useState("1"); // 1 = on, 0 = off
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]); // Armazena os logs

  const addLog = (message: string) => {
    setLogs((prevLogs) => [...prevLogs, message]); // Adiciona log
    console.log(message); // Também envia para o console
  };

  const saveWifiState = async (state: string) => {
    try {
      await AsyncStorage.setItem("wifiState", state);
      addLog(`Estado do Wi-Fi salvo: ${state}`);
    } catch (error) {
      addLog(`Erro ao salvar estado do Wi-Fi: ${error}`);
    }
  };

  const loadWifiState = async () => {
    try {
      const savedState = await AsyncStorage.getItem("wifiState");
      if (savedState !== null) {
        setWifiState(savedState);
        addLog(`Estado do Wi-Fi restaurado: ${savedState}`);
      }
    } catch (error) {
      addLog(`Erro ao carregar estado do Wi-Fi: ${error}`);
    }
  };

  useEffect(() => {
    loadWifiState();
  }, []);

  function getSid() {
    return fetch(
      "https://united-happily-drake.ngrok-free.app/cgi-bin/login.cgi"
    )
      .then((response) =>
        response.text().then((html) => {
          const sidMatch = html.match(/var sid = '(.+?)';/);
          if (sidMatch) {
            const sid = sidMatch[1];
            addLog(`SID obtido: ${sid}`);
            return sid;
          } else {
            throw new Error("SID não encontrado");
          }
        })
      )
      .catch((error) => {
        addLog(`Erro ao obter SID: ${error}`);
        return null;
      });
  }

  function generatePasswordHash(password: string, sid: string) {
    return MD5(`${password}:${sid}`).toString();
  }

  function loginToModem(username: string, password: string) {
    setIsLoading(true);
    getSid().then((sid) => {
      if (!sid) {
        addLog("Não foi possível obter o SID.");
        setIsLoading(false);
        return;
      }

      const hashedPassword = generatePasswordHash(password, sid);

      const formData = new URLSearchParams();
      formData.append("Loginuser", username);
      formData.append("LoginPasswordValue", hashedPassword);
      formData.append("acceptLoginIndex", "1");

      fetch("https://united-happily-drake.ngrok-free.app/cgi-bin/login.cgi", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      })
        .then((response) => {
          if (response.ok) {
            const cookie = response.headers.get("set-cookie");
            if (cookie) {
              addLog(`Login bem-sucedido! Cookie obtido: ${cookie}`);
              const newState = wifiState === "0" ? "1" : "0";
              setWifiState(newState);
              saveWifiState(newState);
              wifiToggle(cookie);
            } else {
              addLog("Login bem-sucedido, mas nenhum cookie foi retornado.");
            }
          } else {
            addLog(`Falha no login: ${response.status}`);
          }
        })
        .catch((error) => {
          addLog(`Erro na requisição de login: ${error}`);
        })
        .finally(() => setIsLoading(false));
    });
  }

  function wifiToggle(cookie: string) {
    const url =
      "https://united-happily-drake.ngrok-free.app/cgi-bin/settings-wireless-network.cgi";
    const body =
      wifiState === "1"
        ? "wlEnable=0&sessionKey=&HideSSID=1&wirelessNetWorkTabIndex=2&WirelessMode=12&Channel=0&HtExtcha=1&HT_BW=0&TxPower=100&WMM=&Advanced_set=1&WPSDisable=0&WPSActiveFlag=1&WpsStart=1"
        : "wlEnable=1&sessionKey=&HideSSID=1&wirelessNetWorkTabIndex=2&WirelessMode=12&Channel=0&HtExtcha=1&HT_BW=0&TxPower=100&WMM=&Advanced_set=1&WPSDisable=0&WPSActiveFlag=1&WpsStart=1";

    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: cookie,
      },
      body,
    })
      .then((response) => {
        if (response.ok) {
          addLog(
            wifiState === "1"
              ? "Wi-Fi desativado com sucesso!"
              : "Wi-Fi ativado com sucesso!"
          );
        } else {
          addLog(`Erro ao alterar o estado do Wi-Fi: ${response.status}`);
        }
      })
      .catch((error) => addLog(`Erro na requisição de Wi-Fi: ${error}`))
      .finally(() => setIsLoading(false));
  }

  return (
    <View style={styles.container}>
      <HighlightButton
        onPress={() => loginToModem(Login.user, Login.password)}
        isWifiOn={wifiState === "0" ? false : true}
        isLoading={isLoading}
      />
      <Text style={styles.text}>
        A internet está {wifiState === "0" ? "desligada" : "ligada"}
      </Text>
      {/* <ScrollView style={styles.logContainer}>
        {logs.map((log, index) => (
          <Text key={index} style={styles.logText}>
            {log}
          </Text>
        ))}
      </ScrollView> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  text: { marginTop: 30, fontSize: 20 },
  logContainer: { marginTop: 20, paddingHorizontal: 10 },
  logText: { fontSize: 14, color: "#333" },
});
