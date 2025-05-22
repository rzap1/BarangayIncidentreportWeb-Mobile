// components/NavBar.tsx - Updated with removed sidebar items and navigation to notifications page
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  TouchableWithoutFeedback,
  Image,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "./app";
import axios from "axios";

const screenWidth = Dimensions.get("window").width;

interface NavBarProps {
  username?: string;
  userImage?: string | null;
}

interface LogEntry {
  ID: number;
  USER: string;
  TIME: string;
  ACTION: string;
  TIME_IN?: string;
  TIME_OUT?: string;
  LOCATION?: string;
}

const NavBar: React.FC<NavBarProps> = ({ username, userImage }) => {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [userMenuVisible, setUserMenuVisible] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState<LogEntry[]>([]);
  const [lastLogId, setLastLogId] = useState<number | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const sidebarAnim = useRef(new Animated.Value(-screenWidth * 0.5)).current;

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Fetch user logs and check for new notifications
  const fetchUserLogs = async () => {
    if (!username) return;
    
    try {
      const response = await axios.get(`http://192.168.177.28:3001/api/logs/${username}`);
      const logs = response.data;
      
      console.log('Fetched logs for user:', username, 'Count:', logs.length);
      
      if (logs && logs.length > 0) {
        const latestLog = logs[0]; // Most recent log (ordered by TIME DESC)
        
        console.log('Latest log ID:', latestLog.ID, 'Last known ID:', lastLogId);
        
        // If this is the first time loading
        if (!isInitialized) {
          setLastLogId(latestLog.ID);
          setNotifications(logs.slice(0, 5)); // Show last 5 logs
          setIsInitialized(true);
          console.log('Initialized with latest log ID:', latestLog.ID);
        } else if (latestLog.ID > (lastLogId || 0)) {
          // New log detected - show notification
          const newLogsCount = logs.filter((log: LogEntry) => log.ID > (lastLogId || 0)).length;
          setNotificationCount(prev => prev + newLogsCount);
          setLastLogId(latestLog.ID);
          setNotifications(logs.slice(0, 5)); // Update with latest logs
          
          console.log('New log detected! New logs count:', newLogsCount);
          
          // Show alert for new notification
          const notificationMessage = getLogDisplayText(latestLog);
          Alert.alert(
            "New Activity Logged",
            notificationMessage,
            [
              { text: "View All", onPress: () => handleNotificationPress() },
              { text: "Dismiss", style: "cancel" }
            ]
          );
        }
      } else {
        console.log('No logs found for user:', username);
      }
    } catch (error) {
      console.error("Error fetching user logs:", error);
      // Don't show error alerts for network issues during background polling
    }
  };

  // Helper function to format log display text
  const getLogDisplayText = (log: LogEntry) => {
    const date = new Date(log.TIME).toLocaleDateString();
    const time = new Date(log.TIME).toLocaleTimeString();
    let action = log.ACTION || 'Activity';
    
    // Format based on TIME_IN and TIME_OUT
    if (log.TIME_IN && log.TIME_OUT) {
      const timeIn = new Date(log.TIME_IN).toLocaleTimeString();
      const timeOut = new Date(log.TIME_OUT).toLocaleTimeString();
      action = `Time In: ${timeIn}, Time Out: ${timeOut}`;
    } else if (log.TIME_IN) {
      const timeIn = new Date(log.TIME_IN).toLocaleTimeString();
      action = `Time In: ${timeIn}`;
    } else if (log.TIME_OUT) {
      const timeOut = new Date(log.TIME_OUT).toLocaleTimeString();
      action = `Time Out: ${timeOut}`;
    }
    
    return `${date} ${time}\n${action}${log.LOCATION ? `\nLocation: ${log.LOCATION}` : ''}`;
  };

  // Poll for new logs every 15 seconds (reduced from 30 for more responsiveness)
  useEffect(() => {
    if (username) {
      console.log('Setting up polling for user:', username);
      fetchUserLogs(); // Initial fetch
      
      const interval = setInterval(() => {
        fetchUserLogs();
      }, 15000); // Check every 15 seconds
      
      return () => {
        console.log('Cleaning up polling interval');
        clearInterval(interval);
      };
    }
  }, [username, lastLogId, isInitialized]);

  useEffect(() => {
    Animated.timing(sidebarAnim, {
      toValue: sidebarVisible ? 0 : -screenWidth * 0.5,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [sidebarVisible]);

  const handleNotificationPress = () => {
    // Reset notification count when opened
    setNotificationCount(0);
    
    // Navigate to notifications page
    navigation.navigate("Notifications", { username: username ?? "" });
  };

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
            navigation.navigate("IncidentReport", { username: username ?? "" });
          }}
        >
          <Text style={styles.sidebarItemText}>Report Incident</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.sidebarItem}
          onPress={() => {
            setSidebarVisible(false);
            navigation.navigate("TimeIn", { username: username ?? "" });
          }}
        >
          <Text style={styles.sidebarItemText}>TIME-IN</Text>
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSidebarVisible(true)}>
          <Ionicons name="menu" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleNotificationPress}
          >
            <Ionicons name="notifications-outline" size={24} color="#fff" />
            {notificationCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {notificationCount > 99 ? '99+' : notificationCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setUserMenuVisible(!userMenuVisible)}
          >
            {userImage ? (
              <Image 
                source={{ uri: `http://192.168.177.28:3001/uploads/${userImage}` }}
                style={styles.profileImage}
                onError={() => console.log("Error loading profile image")}
              />
            ) : (
              <Ionicons name="person-circle-outline" size={30} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

        {userMenuVisible && (
          <View style={styles.userMenu}>
            <TouchableOpacity
              style={styles.userMenuItem}
              onPress={() => {
                setUserMenuVisible(false);
                navigation.navigate("Profile", { username: username ?? "" });
              }}
            >
              <Text style={styles.userMenuText}>Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.userMenuItem}
              onPress={() => {
                setUserMenuVisible(false);
                navigation.reset({
                  index: 0,
                  routes: [{ name: "Login" }],
                });
              }}
            >
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
  profileImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#fff',
  },
});

export default NavBar;