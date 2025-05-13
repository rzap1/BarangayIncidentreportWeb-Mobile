// components/NavBar.tsx
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
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "./app"; // Adjust the path if needed

const screenWidth = Dimensions.get("window").width;

interface NavBarProps {
  username?: string;
}

const NavBar: React.FC<NavBarProps> = ({ username }) => {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [userMenuVisible, setUserMenuVisible] = useState(false);
  const [notificationCount] = useState(1);
  const sidebarAnim = useRef(new Animated.Value(-screenWidth * 0.5)).current;

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    Animated.timing(sidebarAnim, {
      toValue: sidebarVisible ? 0 : -screenWidth * 0.5,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [sidebarVisible]);

  const closeMenus = () => {
    setUserMenuVisible(false);
    setSidebarVisible(false);
  };

  return (
    <>
      {sidebarVisible && (
        <TouchableWithoutFeedback onPress={() => setSidebarVisible(false)}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
      )}

      <Animated.View style={[styles.sidebar, { left: sidebarAnim }]}>
        <View style={styles.sidebarHeader}>
          <Text style={styles.sidebarTitle}>Patrol Net</Text>
          <TouchableOpacity onPress={() => setSidebarVisible(false)}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.sidebarItem}
          onPress={() => {
            setSidebarVisible(false);
            navigation.navigate("IncidentReport");
          }}
        >
          <Text style={styles.sidebarItemText}>Report Incident</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sidebarItem}>
          <Text style={styles.sidebarItemText}>TBD</Text>
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSidebarVisible(true)}>
          <Ionicons name="menu" size={24} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>//Title</Text>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => console.log("Notification clicked")}
          >
            <Ionicons name="notifications-outline" size={24} color="#fff" />
            {notificationCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{notificationCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setUserMenuVisible(!userMenuVisible)}
          >
            <Ionicons name="person-circle-outline" size={30} color="#fff" />
          </TouchableOpacity>
        </View>

        {userMenuVisible && (
          <View style={styles.userMenu}>
            <TouchableOpacity
              style={styles.userMenuItem}
              onPress={() => setUserMenuVisible(false)}
            >
              <Text style={styles.userMenuText}>Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.userMenuItem}>
              <Text style={styles.userMenuText}>Logout</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    backgroundColor: "#555",
    paddingBottom: 10,
    zIndex: 3,
  },
  headerTitle: { fontWeight: "bold", fontSize: 18, color: "#fff" },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconButton: {
    marginLeft: 10,
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "red",
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
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
    zIndex: 4,
  },
  userMenuItem: { paddingVertical: 5 },
  userMenuText: { fontWeight: "bold" },
});

export default NavBar;
