import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function SplashScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLogin = async () => {
      const userToken = await AsyncStorage.getItem('userToken'); // check if user is logged in
      setTimeout(() => {
        if (userToken) {
          router.replace("/main");
        } else {
          router.replace("/welcome");
        }
      }, 3000);
    };

    checkLogin();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Glowy</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#800080",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#fff",
  },
});
