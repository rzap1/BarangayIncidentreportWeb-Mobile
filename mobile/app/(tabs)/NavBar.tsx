// components/NavBar.tsx - Fixed incident notification system
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
import AsyncStorage from '@react-native-async-storage/async-storage';

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

interface IncidentReport {
  id: number;
  type: string;
  reported_by: string;
  location: string;
  status: string;
  assigned: string;
  created_at: string;
}

const NavBar: React.FC<NavBarProps> = ({ username, userImage }) => {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [userMenuVisible, setUserMenuVisible] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState<LogEntry[]>([]);
  const [lastLogId, setLastLogId] = useState<number | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const sidebarAnim = useRef(new Animated.Value(-screenWidth * 0.5)).current;

  const [lastIncidentId, setLastIncidentId] = useState<number | null>(null);
  const [incidentNotifications, setIncidentNotifications] = useState<IncidentReport[]>([]);
  const [isIncidentInitialized, setIsIncidentInitialized] = useState(false);
  const [unreadIncidentIds, setUnreadIncidentIds] = useState<Set<number>>(new Set());
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Load saved state from AsyncStorage
  useEffect(() => {
    const loadSavedState = async () => {
      if (!username) return;
      
      try {
        const savedLogId = await AsyncStorage.getItem(`lastLogId_${username}`);
        const savedIncidentId = await AsyncStorage.getItem(`lastIncidentId_${username}`);
        const savedUnreadIds = await AsyncStorage.getItem(`unreadIncidentIds_${username}`);
        
        if (savedLogId) {
          setLastLogId(parseInt(savedLogId));
          setIsInitialized(true);
        }
        
        if (savedIncidentId) {
          setLastIncidentId(parseInt(savedIncidentId));
          setIsIncidentInitialized(true);
        }
        
        if (savedUnreadIds) {
          const unreadIds: number[] = JSON.parse(savedUnreadIds);
          setUnreadIncidentIds(new Set<number>(unreadIds));
        }
        
        console.log('Loaded saved state - LogId:', savedLogId, 'IncidentId:', savedIncidentId, 'UnreadIds:', savedUnreadIds);
      } catch (error) {
        console.error('Error loading saved state:', error);
      }
    };
    
    loadSavedState();
  }, [username]);

  // Save state to AsyncStorage
  const saveState = async (logId?: number, incidentId?: number, unreadIds?: Set<number>) => {
    if (!username) return;
    
    try {
      if (logId !== undefined) {
        await AsyncStorage.setItem(`lastLogId_${username}`, logId.toString());
      }
      if (incidentId !== undefined) {
        await AsyncStorage.setItem(`lastIncidentId_${username}`, incidentId.toString());
      }
      if (unreadIds !== undefined) {
        await AsyncStorage.setItem(`unreadIncidentIds_${username}`, JSON.stringify([...unreadIds]));
      }
    } catch (error) {
      console.error('Error saving state:', error);
    }
  };

  // Fetch user logs and check for new notifications
  const fetchUserLogs = async () => {
    if (!username) return;
    
    try {
      const response = await axios.get(`http://192.168.125.28:3001/api/logs/${username}`);
      const logs = response.data;
      
      console.log('Fetched logs for user:', username, 'Count:', logs.length);
      
      if (logs && logs.length > 0) {
        const latestLog = logs[0]; // Most recent log (ordered by TIME DESC)
        
        console.log('Latest log ID:', latestLog.ID, 'Last known ID:', lastLogId);
        
        // If this is the first time loading and no saved state
        if (!isInitialized && lastLogId === null) {
          setLastLogId(latestLog.ID);
          setNotifications(logs.slice(0, 5)); // Show last 5 logs
          setIsInitialized(true);
          saveState(latestLog.ID, undefined, undefined);
          console.log('Initialized with latest log ID:', latestLog.ID);
        } else if (latestLog.ID > (lastLogId || 0)) {
          // New log detected - show notification
          const newLogsCount = logs.filter((log: LogEntry) => log.ID > (lastLogId || 0)).length;
          setNotificationCount(prev => prev + newLogsCount);
          setLastLogId(latestLog.ID);
          setNotifications(logs.slice(0, 5)); // Update with latest logs
          saveState(latestLog.ID, undefined, undefined);
          
          console.log('New log detected! New logs count:', newLogsCount);
          
          // Show alert for new notification
          const notificationMessage = getLogDisplayText(latestLog);
          Alert.alert(
            "New Schedule Logged",
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

  // Fetch assigned incidents and check for new assignments
  const fetchAssignedIncidents = async () => {
    if (!username) return;
    
    try {
      const response = await axios.get(`http://192.168.125.28:3001/api/incidents/assigned/${username}`);
      const incidents = response.data;
      
      console.log('Fetched assigned incidents for user:', username, 'Count:', incidents.length);
      
      if (incidents && incidents.length > 0) {
        const latestIncident = incidents[0]; // Most recent incident (ordered by created_at DESC)
        
        console.log('Latest incident ID:', latestIncident.id, 'Last known incident ID:', lastIncidentId);
        
        // If this is the first time loading and no saved state
        if (!isIncidentInitialized && lastIncidentId === null) {
          setIncidentNotifications(incidents.slice(0, 5)); // Show last 5 incidents
          setIsIncidentInitialized(true);
          
          // Mark only UNRESOLVED incidents as unread for first-time users
          const unresolvedIncidents = incidents.filter((incident: IncidentReport) => incident.status !== 'Resolved');
          const newUnreadIds = new Set<number>(unresolvedIncidents.map((incident: IncidentReport) => incident.id));
          setUnreadIncidentIds(newUnreadIds);
          saveState(undefined, undefined, newUnreadIds);
          
          console.log('Initialized incident notifications with unread UNRESOLVED IDs:', [...newUnreadIds]);
        } else if (isIncidentInitialized && latestIncident.id > (lastIncidentId || 0)) {
          // New incident assignment detected
          const newIncidents = incidents.filter((incident: IncidentReport) => incident.id > (lastIncidentId || 0));
          
          // Add new incident IDs to unread set ONLY if they are unresolved
          const updatedUnreadIds = new Set(unreadIncidentIds);
          newIncidents.forEach((incident: IncidentReport) => {
            if (incident.status !== 'Resolved') {
              updatedUnreadIds.add(incident.id);
            }
          });
          
          setUnreadIncidentIds(updatedUnreadIds);
          setLastIncidentId(latestIncident.id);
          setIncidentNotifications(incidents.slice(0, 5)); // Update with latest incidents
          saveState(undefined, latestIncident.id, updatedUnreadIds);
          
          // Only show alert for unresolved new incidents
          const newUnresolvedIncidents = newIncidents.filter((incident: IncidentReport) => incident.status !== 'Resolved');
          if (newUnresolvedIncidents.length > 0) {
            console.log('New unresolved incident assignment detected! Count:', newUnresolvedIncidents.length);
            
            // Show alert for new incident assignment
            const incidentMessage = getIncidentDisplayText(latestIncident);
            Alert.alert(
              "You've Been Assigned",
              incidentMessage,
              [
                { text: "View All", onPress: () => handleNotificationPress() },
                { text: "Dismiss", style: "cancel" }
              ]
            );
          }
        } else if (isIncidentInitialized) {
          // Update notifications list even if no new incidents
          setIncidentNotifications(incidents.slice(0, 5));
          
          // Remove resolved incidents from unread set AND incidents no longer assigned
          const activeUnresolvedIncidentIds = new Set(
            incidents
              .filter((incident: IncidentReport) => incident.status !== 'Resolved')
              .map((incident: IncidentReport) => incident.id)
          );
          const updatedUnreadIds = new Set([...unreadIncidentIds].filter(id => activeUnresolvedIncidentIds.has(id)));
          
          if (updatedUnreadIds.size !== unreadIncidentIds.size) {
            setUnreadIncidentIds(updatedUnreadIds);
            saveState(undefined, undefined, updatedUnreadIds);
          }
        }
      } else {
        console.log('No assigned incidents found for user:', username);
        setIncidentNotifications([]);
        // Clear unread incidents if no incidents are assigned
        if (unreadIncidentIds.size > 0) {
          const emptySet = new Set<number>();
          setUnreadIncidentIds(emptySet);
          saveState(undefined, undefined, emptySet);
        }
      }
      
      // Update notification count based on unread UNRESOLVED incidents only
      updateNotificationCount();
      
    } catch (error) {
      console.error("Error fetching assigned incidents:", error);
      // Don't show error alerts for network issues during background polling
    }
  };

  // Update notification count based on unread UNRESOLVED incidents only
  const updateNotificationCount = () => {
    // Filter unread incidents to only include unresolved ones
    const unreadUnresolvedIncidents = incidentNotifications.filter(incident => 
      unreadIncidentIds.has(incident.id) && incident.status !== 'Resolved'
    );
    
    const unreadCount = unreadUnresolvedIncidents.length;
    setNotificationCount(unreadCount);
    console.log('Updated notification count to:', unreadCount, 'unresolved incidents');
  };

  // Helper function to format incident display text - CHANGED "Header Type" to "Incident Type"
  const getIncidentDisplayText = (incident: IncidentReport) => {
    return `Incident Type: ${incident.type}
Reported By: ${incident.reported_by}
Location: ${incident.location}
Status: ${incident.status}`;
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

  // Function to handle incident resolution - UPDATED to include resolved_at
  const handleResolveIncident = async (incidentId: number) => {
    try {
      const response = await axios.put(`http://192.168.125.28:3001/api/incidents/${incidentId}/resolve`, {
        resolved_by: username
      });

      if (response.data.success) {
        // Remove incident from unread set when resolved
        const updatedUnreadIds = new Set(unreadIncidentIds);
        updatedUnreadIds.delete(incidentId);
        setUnreadIncidentIds(updatedUnreadIds);
        saveState(undefined, undefined, updatedUnreadIds);
        
        // Update local incident notifications to mark as resolved
        setIncidentNotifications(prev => 
          prev.map(incident => 
            incident.id === incidentId 
              ? { ...incident, status: 'Resolved', resolved_by: username }
              : incident
          )
        );
        
        Alert.alert(
          "Success",
          "Incident has been marked as resolved.",
          [{ text: "OK" }]
        );
        
        // Refresh incident notifications
        fetchAssignedIncidents();
      } else {
        Alert.alert(
          "Error",
          "Failed to resolve incident. Please try again.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("Error resolving incident:", error);
      Alert.alert(
        "Error",
        "Network error. Please check your connection and try again.",
        [{ text: "OK" }]
      );
    }
  };

  // Function to show incident details with resolve option
  const showIncidentDetails = (incident: IncidentReport) => {
    const incidentMessage = getIncidentDisplayText(incident);
    
    // Mark this incident as read when viewed
    if (unreadIncidentIds.has(incident.id)) {
      const updatedUnreadIds = new Set(unreadIncidentIds);
      updatedUnreadIds.delete(incident.id);
      setUnreadIncidentIds(updatedUnreadIds);
      saveState(undefined, undefined, updatedUnreadIds);
    }
    
    Alert.alert(
      "Incident Details",
      incidentMessage,
      [
        {
          text: "Mark as Resolved",
          onPress: () => {
            Alert.alert(
              "Confirm Resolution",
              "Are you sure you want to mark this incident as resolved?",
              [
                { text: "Cancel", style: "cancel" },
                { 
                  text: "Confirm", 
                  onPress: () => handleResolveIncident(incident.id),
                  style: "destructive"
                }
              ]
            );
          }
        },
        { text: "Close", style: "cancel" }
      ]
    );
  };

  // Polling effect for both logs and incidents - INCREASED frequency for better responsiveness
  useEffect(() => {
    if (username) {
      console.log('Setting up polling for user:', username);
      fetchUserLogs(); // Initial fetch for logs
      fetchAssignedIncidents(); // Initial fetch for incidents
      
      const interval = setInterval(() => {
        fetchUserLogs();
        fetchAssignedIncidents(); // Poll for incident assignments
      }, 10000); // Check every 10 seconds (reduced from 15 seconds)
      
      return () => {
        console.log('Cleaning up polling interval');
        clearInterval(interval);
      };
    }
  }, [username, lastLogId, isInitialized, lastIncidentId, isIncidentInitialized]);

  // Update notification count whenever unread incidents or incident notifications change
  useEffect(() => {
    updateNotificationCount();
  }, [unreadIncidentIds, incidentNotifications]);

  useEffect(() => {
    Animated.timing(sidebarAnim, {
      toValue: sidebarVisible ? 0 : -screenWidth * 0.5,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [sidebarVisible]);

  // Handle notification press to navigate to notifications page
  const handleNotificationPress = () => {
    // Mark all current unresolved incidents as read when notification panel is opened
    const unresolvedIncidentIds = incidentNotifications
      .filter(incident => incident.status !== 'Resolved')
      .map(incident => incident.id);
    
    const updatedUnreadIds = new Set([...unreadIncidentIds].filter(id => !unresolvedIncidentIds.includes(id)));
    
    if (updatedUnreadIds.size !== unreadIncidentIds.size) {
      setUnreadIncidentIds(updatedUnreadIds);
      saveState(undefined, undefined, updatedUnreadIds);
    }
    
    // Navigate to notifications page with both logs and incidents
    navigation.navigate("Notifications", { 
      username: username ?? "",
      incidentNotifications: incidentNotifications,
      onIncidentPress: showIncidentDetails // Pass the function to show incident details
    });
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
                source={{ uri: `http://192.168.125.28:3001/uploads/${userImage}` }}
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