// Home.tsx
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import NavBar from "./NavBar";
import type { RootStackParamList } from "./app"; // ✅ Use shared type from App.tsx

type HomeRouteProp = RouteProp<RootStackParamList, "Home">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Home">;

const Home: React.FC = () => {
  const route = useRoute<HomeRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const username = route.params?.username || "";
  
  return (
    <View style={styles.container}>
      <NavBar username={username} />
      <View style={styles.body}>
        <Text style={styles.greeting}>Hi {username}, Welcome to</Text>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>LOGO</Text>
        </View>
        <Text style={styles.title}>PatrolNet</Text>
        <Text style={styles.subText}>SHORT DISCUSSION</Text>
        <Text style={styles.subText}>ABOUT SA APP</Text>
        
        <TouchableOpacity
            style={styles.reportButton}
            onPress={() => navigation.navigate("IncidentReport", { username })}
          >
            <Text style={styles.reportButtonText}>REPORT INCIDENT</Text>
          </TouchableOpacity>

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  body: {
    alignItems: "center",
    paddingTop: 40,
  },
  greeting: {
    fontWeight: "bold",
    marginBottom: 10,
  },
  logoCircle: {
    width: 100,
    height: 100,
    backgroundColor: "#d9d9d9",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  logoText: { fontWeight: "bold", color: "#000" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  subText: { fontSize: 12, color: "#333" },
  reportButton: {
    marginTop: 30,
    backgroundColor: "#d9d9d9",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  reportButtonText: {
    fontWeight: "bold",
    color: "#000",
  },
});

export default Home;
