// Notifications.tsx - Displays user logs separated into new and viewed notifications
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "./app";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

type NotificationsRouteProp = RouteProp<RootStackParamList, "Notifications"> & {
  params: {
    username: string;
    incidentNotifications?: IncidentReport[];
  };
};
type NotificationsNavigationProp = NativeStackNavigationProp<RootStackParamList, "Notifications">;

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

const Notifications: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [viewedNotifications, setViewedNotifications] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const navigation = useNavigation<NotificationsNavigationProp>();
  const route = useRoute<NotificationsRouteProp>();
  const { username, incidentNotifications = [] } = route.params;

  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [viewedIncidents, setViewedIncidents] = useState<number[]>([]);

  const newIncidents = incidents.filter(incident => !viewedIncidents.includes(incident.id));
  const viewedIncidentsList = incidents.filter(incident => viewedIncidents.includes(incident.id));

  // Load viewed notifications from AsyncStorage
  const loadViewedNotifications = async () => {
    try {
      const viewed = await AsyncStorage.getItem(`viewed_notifications_${username}`);
      if (viewed) {
        setViewedNotifications(JSON.parse(viewed));
      }
    } catch (error) {
      console.error("Error loading viewed notifications:", error);
    }
  };

  // Save viewed notifications to AsyncStorage
  const saveViewedNotifications = async (viewedIds: number[]) => {
    try {
      await AsyncStorage.setItem(
        `viewed_notifications_${username}`,
        JSON.stringify(viewedIds)
      );
    } catch (error) {
      console.error("Error saving viewed notifications:", error);
    }
  };

  // Fetch user logs from API
  const fetchLogs = async () => {
    try {
      const response = await axios.get(`http://192.168.125.28:3001/api/logs/${username}`);
      setLogs(response.data || []);
      console.log(`Fetched ${response.data?.length || 0} logs for ${username}`);
    } catch (error) {
      console.error("Error fetching logs:", error);
      Alert.alert("Error", "Failed to load notifications");
    }
  };

  // Modify the loadData function in useEffect
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await loadViewedNotifications();
      await loadViewedIncidents(); // Load viewed incidents
      await fetchLogs();
      await fetchIncidents(); // Fetch incidents
      
      // Set incidents from navigation params if available
      if (incidentNotifications.length > 0) {
        setIncidents(incidentNotifications);
      }
  
      setLoading(false);
    };
    loadData();
  }, [username]);

  // Add function to mark incident as viewed
  const markIncidentAsViewed = async (incidentId: number) => {
    if (!viewedIncidents.includes(incidentId)) {
      const newViewedIds = [...viewedIncidents, incidentId];
      setViewedIncidents(newViewedIds);
      await saveViewedIncidents(newViewedIds);
    }
  };

  // Refresh function
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLogs();
    await fetchIncidents(); // Refresh incidents too
    setRefreshing(false);
  };

  // Mark notification as viewed
  const markAsViewed = async (logId: number) => {
    if (!viewedNotifications.includes(logId)) {
      const newViewedIds = [...viewedNotifications, logId];
      setViewedNotifications(newViewedIds);
      await saveViewedNotifications(newViewedIds);
    }
  };

  // Mark all notifications as viewed
  const markAllAsViewed = async () => {
    const allLogIds = logs.map(log => log.ID);
    const allIncidentIds = incidents.map(incident => incident.id);
    
    setViewedNotifications(allLogIds);
    setViewedIncidents(allIncidentIds);
    
    await saveViewedNotifications(allLogIds);
    await saveViewedIncidents(allIncidentIds);
  };

  // Modify the clearAllViewed function to include incidents
  const clearAllViewed = async () => {
    Alert.alert(
      "Clear Viewed",
      "Are you sure you want to mark all notifications as new?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          onPress: async () => {
            setViewedNotifications([]);
            setViewedIncidents([]);
            await saveViewedNotifications([]);
            await saveViewedIncidents([]);
          },
        },
      ]
    );
  };

  const loadViewedIncidents = async () => {
    try {
      const viewed = await AsyncStorage.getItem(`viewed_incidents_${username}`);
      if (viewed) {
        setViewedIncidents(JSON.parse(viewed));
      }
    } catch (error) {
      console.error("Error loading viewed incidents:", error);
    }
  };

  // Add function to save viewed incidents to AsyncStorage
  const saveViewedIncidents = async (viewedIds: number[]) => {
    try {
      await AsyncStorage.setItem(
        `viewed_incidents_${username}`,
        JSON.stringify(viewedIds)
      );
    } catch (error) {
      console.error("Error saving viewed incidents:", error);
    }
  };

  // Add function to fetch incidents from API
  const fetchIncidents = async () => {
    try {
      const response = await axios.get(`http://192.168.125.28:3001/api/incidents/assigned/${username}`);
      setIncidents(response.data || []);
      console.log(`Fetched ${response.data?.length || 0} assigned incidents for ${username}`);
    } catch (error) {
      console.error("Error fetching incidents:", error);
      // Don't show error for incident fetch failures
    }
  };

 // Function to resolve incident (UPDATED VERSION)
const resolveIncident = async (incidentId: number) => {
  try {
    // Pass the username to track who resolved it
    await axios.put(`http://192.168.125.28:3001/api/incidents/${incidentId}/resolve`, {
      resolved_by: username  // Add this to track who resolved it
    });
    
    // Update local state
    setIncidents(prevIncidents => 
      prevIncidents.map(incident => 
        incident.id === incidentId 
          ? { ...incident, status: 'Resolved' }
          : incident
      )
    );
    
    Alert.alert("Success", "Incident marked as resolved");
  } catch (error) {
    console.error("Error resolving incident:", error);
    Alert.alert("Error", "Failed to resolve incident");
  }
};

  // Add function to show incident details with resolve option
const showIncidentDetails = (incident: IncidentReport) => {
  const incidentDetails = `Header Type: ${incident.type}
Reported By: ${incident.reported_by}
Location: ${incident.location}
Status: ${incident.status}`;

  // Define buttons with proper typing
  const buttons: Array<{
    text: string;
    style?: "default" | "cancel" | "destructive";
    onPress?: () => void;
  }> = [
    { text: "Cancel", style: "cancel" }
  ];

  // Only show resolve button if incident is not already resolved
  if (incident.status !== 'Resolved') {
    buttons.push({
      text: "Mark as Resolved",
      onPress: () => {
        Alert.alert(
          "Confirm Resolution",
          "Are you sure you want to mark this incident as resolved?",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Confirm",
              onPress: () => resolveIncident(incident.id),
            },
          ]
        );
      },
    });
  }

  Alert.alert("You've Been Assigned", incidentDetails, buttons);
};

  // Add function to render incident notification item
  const renderIncidentItem = (incident: IncidentReport, isNew: boolean) => {
    const date = new Date(incident.created_at).toLocaleDateString();
    const time = new Date(incident.created_at).toLocaleTimeString();
    const isResolved = incident.status === 'Resolved';
    
    return (
      <TouchableOpacity
        key={`incident_${incident.id}`}
        style={[
          styles.notificationItem,
          isNew ? styles.newNotification : styles.viewedNotification
        ]}
        onPress={() => {
          markIncidentAsViewed(incident.id);
          showIncidentDetails(incident);
        }}
      >
        <View style={styles.notificationHeader}>
          <View style={styles.notificationIcon}>
            <Ionicons 
              name={isResolved ? "checkmark-circle" : (isNew ? "alert-circle" : "alert-circle-outline")} 
              size={20} 
              color={isResolved ? "#4CAF50" : (isNew ? "#FF5722" : "#666")} 
            />
          </View>
          <View style={styles.notificationContent}>
            <Text style={[styles.notificationTitle, isNew && styles.newIncidentTitle]}>
              Incident Assignment: {incident.type}
            </Text>
            <Text style={styles.notificationDate}>
              {date} at {time}
            </Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="location-sharp" size={14} color="#FF9800" style={{ marginRight: 4 }} />
              <Text style={styles.notificationLocation}>{incident.location}</Text>
              </View>
            <Text style={[
              styles.notificationLocation,
              isResolved && { color: "#4CAF50", fontWeight: "bold" }
            ]}>
               Status: {incident.status}
            </Text>
            <Text style={styles.incidentReporter}>
              Reported by: {incident.reported_by}
            </Text>
          </View>
          {isNew && <View style={styles.newIncidentBadge} />}
        </View>

      </TouchableOpacity>
    );
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
    
    return {
      date,
      time,
      action,
      location: log.LOCATION || null
    };
  };

  // Separate logs into new and viewed
  const newNotifications = logs.filter(log => !viewedNotifications.includes(log.ID));
  const viewedNotificationsList = logs.filter(log => viewedNotifications.includes(log.ID));

  // Render notification item
  const renderNotificationItem = (log: LogEntry, isNew: boolean) => {
    const logDisplay = getLogDisplayText(log);
    
    return (
      <TouchableOpacity
        key={log.ID}
        style={[
          styles.notificationItem,
          isNew ? styles.newNotification : styles.viewedNotification
        ]}
        onPress={() => markAsViewed(log.ID)}
      >
        <View style={styles.notificationHeader}>
          <View style={styles.notificationIcon}>
            <Ionicons 
              name={isNew ? "notifications" : "notifications-outline"} 
              size={20} 
              color={isNew ? "#4CAF50" : "#666"} 
            />
          </View>
          <View style={styles.notificationContent}>
            <Text style={[styles.notificationTitle, isNew && styles.newNotificationTitle]}>
              {logDisplay.action}
            </Text>
            <Text style={styles.notificationDate}>
              {logDisplay.date} at {logDisplay.time}
            </Text>
            {logDisplay.location && (
              <Text style={styles.notificationLocation}>
                📍 {logDisplay.location}
              </Text>
            )}
          </View>
          {isNew && <View style={styles.newBadge} />}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={markAllAsViewed}>
          <Ionicons name="checkmark-done" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={markAllAsViewed}>
            <Ionicons name="checkmark-done-outline" size={16} color="#4CAF50" />
            <Text style={styles.actionButtonText}>Mark All Read</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={clearAllViewed}>
            <Ionicons name="refresh-outline" size={16} color="#FF9800" />
            <Text style={styles.actionButtonText}>Reset All</Text>
          </TouchableOpacity>
        </View>

        {/* Summary */}
        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            {newNotifications.length + newIncidents.length} new {viewedNotificationsList.length + viewedIncidentsList.length} viewed
          </Text>
        </View>

        {logs.length === 0 && incidents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No notifications yet</Text>
            <Text style={styles.emptySubtext}>
              Your activity logs will appear here
            </Text>
          </View>
        ) : (
          <>
            {/* New Incident Assignments */}
            {newIncidents.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  🚨 New Incident Assignments ({newIncidents.length})
                </Text>
                {newIncidents.map(incident => renderIncidentItem(incident, true))}
              </View>
            )}

            {/* New Notifications */}
            {newNotifications.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  New ({newNotifications.length})
                </Text>
                {newNotifications.map(log => renderNotificationItem(log, true))}
              </View>
            )}

            {/* Earlier - Combined viewed notifications and incidents */}
            {(viewedNotificationsList.length > 0 || viewedIncidentsList.length > 0) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Earlier ({viewedNotificationsList.length + viewedIncidentsList.length})
                </Text>
                {/* Render viewed incidents first */}
                {viewedIncidentsList.map(incident => renderIncidentItem(incident, false))}
                {/* Then render viewed notifications */}
                {viewedNotificationsList.map(log => renderNotificationItem(log, false))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#555",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  scrollContainer: {
    flex: 1,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#fff",
    marginBottom: 10,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
  },
  actionButtonText: {
    marginLeft: 5,
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  summary: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#fff",
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#e0e0e0",
  },
  notificationItem: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  newNotification: {
    backgroundColor: "#f8ffF8",
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },
  viewedNotification: {
    backgroundColor: "#fff",
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  notificationIcon: {
    marginRight: 15,
    marginTop: 2,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 5,
  },
  newNotificationTitle: {
    fontWeight: "bold",
    color: "#2E7D32",
  },
  notificationDate: {
    fontSize: 14,
    color: "#666",
    marginBottom: 3,
  },
  notificationLocation: {
    fontSize: 14,
    color: "#888",
    fontStyle: "italic",
  },
  newBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4CAF50",
    marginTop: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#999",
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#ccc",
    marginTop: 5,
    textAlign: "center",
  },
  newIncidentTitle: {
    fontWeight: "bold" as const,
    color: "#D32F2F",
  },
  incidentReporter: {
    fontSize: 13,
    color: "#777",
    fontStyle: "italic" as const,
    marginTop: 2,
  },
  newIncidentBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF5722",
    marginTop: 5,
  },
});

export default Notifications;