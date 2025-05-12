import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, RouteProp } from "@react-navigation/native";

const screenWidth = Dimensions.get("window").width;

type RootStackParamList = {
  Home: { username?: string };
};

type HomeRouteProp = RouteProp<RootStackParamList, "Home">;

const Home: React.FC = () => {
  const route = useRoute<HomeRouteProp>();
  const username = route.params?.username || "";

  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [userMenuVisible, setUserMenuVisible] = useState(false);

  const sidebarAnim = useRef(new Animated.Value(-screenWidth * 0.5)).current;

  // Sidebar slide animation
  useEffect(() => {
    Animated.timing(sidebarAnim, {
      toValue: sidebarVisible ? 0 : -screenWidth * 0.5,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [sidebarVisible]);

  return (
    <TouchableWithoutFeedback onPress={() => setUserMenuVisible(false)}>
      <View style={styles.container}>
        {/* Sidebar Backdrop */}
        {sidebarVisible && (
          <TouchableWithoutFeedback onPress={() => setSidebarVisible(false)}>
            <View style={styles.backdrop} />
          </TouchableWithoutFeedback>
        )}

        {/* Sidebar */}
        <Animated.View style={[styles.sidebar, { left: sidebarAnim }]}>
          <View style={styles.sidebarHeader}>
            <Text style={styles.sidebarTitle}>Patrol Net</Text>
            <TouchableOpacity onPress={() => setSidebarVisible(false)}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.sidebarItem}>
            <Text style={styles.sidebarItemText}>Report Incident</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sidebarItem}>
            <Text style={styles.sidebarItemText}>TBD</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSidebarVisible(true)}>
            <Ionicons name="menu" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>HOME</Text>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              setUserMenuVisible(!userMenuVisible);
            }}
          >
            <Ionicons name="person-circle-outline" size={30} color="#fff" />
          </TouchableOpacity>

          {userMenuVisible && (
            <View style={styles.userMenu}>
              <TouchableOpacity
                style={styles.userMenuItem}
                onPress={() => {
                  setUserMenuVisible(false);
                  // Placeholder for navigation
                }}
              >
                <Text style={styles.userMenuText}>Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.userMenuItem}
                onPress={() => {
                  // Implement logout action
                }}
              >
                <Text style={styles.userMenuText}>Logout</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Body */}
        <View style={styles.body}>
          <Text style={styles.greeting}>Hi {username}, Welcome to</Text>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>LOGO</Text>
          </View>
          <Text style={styles.title}>PatrolNet</Text>
          <Text style={styles.subText}>SHORT DISCUSSION</Text>
          <Text style={styles.subText}>ABOUT SA APP</Text>
          <TouchableOpacity style={styles.reportButton}>
            <Text style={styles.reportButtonText}>REPORT INCIDENT</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    backgroundColor: "#555",
    paddingBottom: 10,
  },
  headerTitle: { fontWeight: "bold", fontSize: 18, color: "#fff" },
  backdrop: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.3)",
    zIndex: 1,
  },
  sidebar: {
    position: "absolute",
    top: 0,
    width: screenWidth * 0.5,
    height: "100%",
    backgroundColor: "#333",
    paddingTop: 60,
    paddingHorizontal: 20,
    zIndex: 2,
  },
  sidebarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sidebarTitle: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
  sidebarItem: { marginBottom: 15 },
  sidebarItemText: { color: "#fff", fontSize: 16 },
  userMenu: {
    position: "absolute",
    top: 100,
    right: 10,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    zIndex: 3,
  },
  userMenuItem: { paddingVertical: 5 },
  userMenuText: { fontWeight: "bold" },
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
