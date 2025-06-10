
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
  resolved_by?: string;
  resolved_at?: string;
}

const Notifications: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [viewedNotifications, setViewedNotifications] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const navigation = useNavigation<NotificationsNavigationProp>();
  const route = useRoute<NotificationsRouteProp>();
  const { username, incidentNotifications = [] } = route.params;
  const [userRole, setUserRole] = useState<string>('');

  // Separate assigned and reported incidents
  const [assignedIncidents, setAssignedIncidents] = useState<IncidentReport[]>([]);
  const [reportedIncidents, setReportedIncidents] = useState<IncidentReport[]>([]);
  const [viewedAssignedIncidents, setViewedAssignedIncidents] = useState<number[]>([]);
  const [viewedReportedIncidents, setViewedReportedIncidents] = useState<number[]>([]);

  // Helper function to categorize incidents
  const categorizeIncidents = (incidents: IncidentReport[], viewedIds: number[]) => {
    const unresolved = incidents.filter(incident => incident.status !== 'Resolved');
    const resolved = incidents.filter(incident => incident.status === 'Resolved');
    
    const newIncidents = unresolved.filter(incident => 
      !viewedIds.includes(incident.id) && 
      incident.resolved_by !== username
    );
    
    const viewedUnresolved = unresolved.filter(incident => 
      viewedIds.includes(incident.id) || 
      incident.resolved_by === username
    );
    
    return { newIncidents, viewedUnresolved, resolved };
  };

  // Categorize assigned incidents
  const assignedCategorized = categorizeIncidents(assignedIncidents, viewedAssignedIncidents);
  
  // Categorize reported incidents
  const reportedCategorized = categorizeIncidents(reportedIncidents, viewedReportedIncidents);

  const loadUserRole = async () => {
  try {
    const role = await AsyncStorage.getItem('userRole');
    if (role) {
      setUserRole(role);
    }
  } catch (error) {
    console.error("Error loading user role:", error);
  }
};

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
      const response = await axios.get(`http://192.168.209.28:3001/api/logs/${username}`);
      setLogs(response.data || []);
      console.log(`Fetched ${response.data?.length || 0} logs for ${username}`);
    } catch (error) {
      console.error("Error fetching logs:", error);
      Alert.alert("Error", "Failed to load notifications");
    }
  };

  // Load viewed assigned incidents
  const loadViewedAssignedIncidents = async () => {
    try {
      const viewed = await AsyncStorage.getItem(`viewed_assigned_incidents_${username}`);
      if (viewed) {
        setViewedAssignedIncidents(JSON.parse(viewed));
      }
    } catch (error) {
      console.error("Error loading viewed assigned incidents:", error);
    }
  };

  // Load viewed reported incidents
  const loadViewedReportedIncidents = async () => {
    try {
      const viewed = await AsyncStorage.getItem(`viewed_reported_incidents_${username}`);
      if (viewed) {
        setViewedReportedIncidents(JSON.parse(viewed));
      }
    } catch (error) {
      console.error("Error loading viewed reported incidents:", error);
    }
  };

  // Save viewed assigned incidents
  const saveViewedAssignedIncidents = async (viewedIds: number[]) => {
    try {
      await AsyncStorage.setItem(
        `viewed_assigned_incidents_${username}`,
        JSON.stringify(viewedIds)
      );
    } catch (error) {
      console.error("Error saving viewed assigned incidents:", error);
    }
  };

  // Save viewed reported incidents
  const saveViewedReportedIncidents = async (viewedIds: number[]) => {
    try {
      await AsyncStorage.setItem(
        `viewed_reported_incidents_${username}`,
        JSON.stringify(viewedIds)
      );
    } catch (error) {
      console.error("Error saving viewed reported incidents:", error);
    }
  };

  // Fetch assigned incidents
  const fetchAssignedIncidents = async () => {
    try {
      const response = await axios.get(`http://192.168.209.28:3001/api/incidents/assigned/${username}`);
      const fetchedIncidents = response.data || [];
      setAssignedIncidents(fetchedIncidents);
      
      // Auto-mark incidents resolved by current user as viewed
      const resolvedByCurrentUser = fetchedIncidents
        .filter((incident: IncidentReport) => incident.resolved_by === username)
        .map((incident: IncidentReport) => incident.id);
      
      if (resolvedByCurrentUser.length > 0) {
        const currentViewed = await AsyncStorage.getItem(`viewed_assigned_incidents_${username}`);
        const existingViewed = currentViewed ? JSON.parse(currentViewed) : [];
        const newViewed = [...new Set([...existingViewed, ...resolvedByCurrentUser])];
        
        setViewedAssignedIncidents(newViewed);
        await saveViewedAssignedIncidents(newViewed);
      }
      
      console.log(`Fetched ${fetchedIncidents.length} assigned incidents for ${username}`);
    } catch (error) {
      console.error("Error fetching assigned incidents:", error);
    }
  };

  // Fetch reported incidents
  const fetchReportedIncidents = async () => {
    try {
      const response = await axios.get(`http://192.168.209.28:3001/api/incidents/reported/${username}`);
      const fetchedIncidents = response.data || [];
      setReportedIncidents(fetchedIncidents);
      
      console.log(`Fetched ${fetchedIncidents.length} reported incidents for ${username}`);
    } catch (error) {
      console.error("Error fetching reported incidents:", error);
    }
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await loadViewedNotifications();
      await loadViewedAssignedIncidents();
      await loadViewedReportedIncidents();
      await loadUserRole();
      await fetchLogs();
      await fetchAssignedIncidents();
      await fetchReportedIncidents();
      
      // Set incidents from navigation params if available
      if (incidentNotifications.length > 0) {
        setAssignedIncidents(incidentNotifications);
      }
  
      setLoading(false);
    };
    loadData();
  }, [username]);

  // Mark assigned incident as viewed
  const markAssignedIncidentAsViewed = async (incidentId: number) => {
    if (!viewedAssignedIncidents.includes(incidentId)) {
      const newViewedIds = [...viewedAssignedIncidents, incidentId];
      setViewedAssignedIncidents(newViewedIds);
      await saveViewedAssignedIncidents(newViewedIds);
    }
  };

  // Mark reported incident as viewed
  const markReportedIncidentAsViewed = async (incidentId: number) => {
    if (!viewedReportedIncidents.includes(incidentId)) {
      const newViewedIds = [...viewedReportedIncidents, incidentId];
      setViewedReportedIncidents(newViewedIds);
      await saveViewedReportedIncidents(newViewedIds);
    }
  };

  // Refresh function
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLogs();
    await fetchAssignedIncidents();
    await fetchReportedIncidents();
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
    const allAssignedIds = assignedIncidents.map(incident => incident.id);
    const allReportedIds = reportedIncidents.map(incident => incident.id);
    
    setViewedNotifications(allLogIds);
    setViewedAssignedIncidents(allAssignedIds);
    setViewedReportedIncidents(allReportedIds);
    
    await saveViewedNotifications(allLogIds);
    await saveViewedAssignedIncidents(allAssignedIds);
    await saveViewedReportedIncidents(allReportedIds);
  };

  // Clear all viewed
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
            setViewedAssignedIncidents([]);
            setViewedReportedIncidents([]);
            await saveViewedNotifications([]);
            await saveViewedAssignedIncidents([]);
            await saveViewedReportedIncidents([]);
          },
        },
      ]
    );
  };

  // Function to resolve incident (for assigned incidents only)
  const resolveIncident = async (incidentId: number) => {
    try {
      await axios.put(`http://192.168.209.28:3001/api/incidents/${incidentId}/resolve`, {
        resolved_by: username
      });
      
      // Update local state for assigned incidents
      setAssignedIncidents(prevIncidents => 
        prevIncidents.map(incident => 
          incident.id === incidentId 
            ? { ...incident, status: 'Resolved', resolved_by: username }
            : incident
        )
      );
      
      // Auto-mark as viewed since current user resolved it
      await markAssignedIncidentAsViewed(incidentId);
      
      Alert.alert("Success", "Incident marked as resolved");
    } catch (error) {
      console.error("Error resolving incident:", error);
      Alert.alert("Error", "Failed to resolve incident");
    }
  };

  // Show incident details for assigned incidents (with resolve option)
  const showAssignedIncidentDetails = (incident: IncidentReport) => {
    const incidentDetails = `Incident Type: ${incident.type}
Reported By: ${incident.reported_by}
Location: ${incident.location}
Status: ${incident.status}${incident.resolved_by ? `\nResolved By: ${incident.resolved_by}` : ''}`;

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

    Alert.alert("Assigned Incident", incidentDetails, buttons);
  };

      const resolveReportedIncident = async (incidentId: number) => {
        try {
          await axios.put(`http://192.168.209.28:3001/api/incidents/${incidentId}/resolve`, {
            resolved_by: username
          });
          
          // Update local state for reported incidents
          setReportedIncidents(prevIncidents => 
            prevIncidents.map(incident => 
              incident.id === incidentId 
                ? { ...incident, status: 'Resolved', resolved_by: username }
                : incident
            )
          );
          
          // Auto-mark as viewed since current user resolved it
          await markReportedIncidentAsViewed(incidentId);
          
          Alert.alert("Success", "Incident marked as resolved");
        } catch (error) {
          console.error("Error resolving incident:", error);
          Alert.alert("Error", "Failed to resolve incident");
        }
      };

// Add this function after the existing resolveReportedIncident function
const resolveReportedIncidentAsAdmin = async (incidentId: number) => {
  try {
    await axios.put(`http://192.168.209.28:3001/api/incidents/${incidentId}/resolve`, {
      resolved_by: 'Admin'
    });
    
    // Update local state for reported incidents
    setReportedIncidents(prevIncidents => 
      prevIncidents.map(incident => 
        incident.id === incidentId 
          ? { ...incident, status: 'Resolved', resolved_by: 'Admin' }
          : incident
      )
    );
    
    // Auto-mark as viewed since admin resolved it
    await markReportedIncidentAsViewed(incidentId);
    
    Alert.alert("Success", "Incident marked as resolved by Admin");
  } catch (error) {
    console.error("Error resolving incident as admin:", error);
    Alert.alert("Error", "Failed to resolve incident");
  }
};

  // Updated showReportedIncidentDetails function
const showReportedIncidentDetails = (incident: IncidentReport) => {
  const incidentDetails = `Incident Type: ${incident.type}
Location: ${incident.location}
Status: ${incident.status === 'Resolved' && incident.resolved_by === 'Admin' 
  ? 'Marked as Resolved by Admin' 
  : incident.status}${incident.assigned ? `
Assigned To: ${incident.assigned}` : `
Not yet assigned`}${incident.resolved_by && incident.resolved_by !== 'Admin' ? `
Resolved By: ${incident.resolved_by}` : ''}`;

  const buttons: Array<{
    text: string;
    style?: "default" | "cancel" | "destructive";
    onPress?: () => void;
  }> = [
    { text: "Cancel", style: "cancel" }
  ];

  // Show resolve button for Tanod if incident is not already resolved
  if (userRole === 'Tanod' && incident.status !== 'Resolved') {
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
              onPress: () => resolveReportedIncident(incident.id),
            },
          ]
        );
      },
    });
  }

  // Show admin resolve button for Admin if incident is not already resolved
  if (userRole === 'Admin' && incident.status !== 'Resolved') {
    buttons.push({
      text: "Mark as Resolved (Admin)",
      onPress: () => {
        Alert.alert(
          "Confirm Admin Resolution",
          "Are you sure you want to mark this incident as resolved by Admin?",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Confirm",
              onPress: () => resolveReportedIncidentAsAdmin(incident.id),
            },
          ]
        );
      },
    });
  }

  Alert.alert("Your Report", incidentDetails, buttons);
};
  // Render assigned incident item
  const renderAssignedIncidentItem = (incident: IncidentReport, isNew: boolean) => {
    const date = new Date(incident.created_at).toLocaleDateString();
    const time = new Date(incident.created_at).toLocaleTimeString();
    const isResolved = incident.status === 'Resolved';
    const resolvedByCurrentUser = incident.resolved_by === username;
    const isUnresolvedButViewed = !isResolved && !isNew;
    
    return (
      <TouchableOpacity
        key={`assigned_${incident.id}`}
        style={[
          styles.notificationItem,
          isNew ? styles.newNotification : styles.viewedNotification,
          resolvedByCurrentUser && styles.resolvedByMeNotification,
          isUnresolvedButViewed && styles.unresolvedViewedNotification
        ]}
        onPress={() => {
          markAssignedIncidentAsViewed(incident.id);
          showAssignedIncidentDetails(incident);
        }}
      >
        <View style={styles.notificationHeader}>
          <View style={styles.notificationIcon}>
            <Ionicons 
              name={isResolved ? "checkmark-circle" : (isNew ? "alert-circle" : "alert-circle-outline")} 
              size={20} 
              color={isResolved ? "#4CAF50" : (isNew ? "#FF5722" : (isUnresolvedButViewed ? "#FF9800" : "#666"))} 
            />
          </View>
          <View style={styles.notificationContent}>
            <Text style={[
              styles.notificationTitle, 
              isNew && styles.newIncidentTitle,
              isUnresolvedButViewed && styles.unresolvedViewedTitle
            ]}>
              🚨 Assigned: {incident.type}
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
              isResolved && { color: "#4CAF50", fontWeight: "bold" },
              isUnresolvedButViewed && { color: "#FF9800", fontWeight: "bold" }
            ]}>
              Status: {incident.status}
            </Text>
            <Text style={styles.incidentReporter}>
              Reported by: {incident.reported_by}
            </Text>
            {resolvedByCurrentUser && (
              <Text style={styles.resolvedByMeText}>
                ✓ Resolved by you
              </Text>
            )}
            {isUnresolvedButViewed && (
              <Text style={styles.unresolvedViewedText}>
                ⚠️ Needs attention
              </Text>
            )}
          </View>
          {isNew && <View style={styles.newIncidentBadge} />}
          {isUnresolvedButViewed && <View style={styles.unresolvedViewedBadge} />}
        </View>
      </TouchableOpacity>
    );
  };

  // Render reported incident item
  const renderReportedIncidentItem = (incident: IncidentReport, isNew: boolean) => {
    const date = new Date(incident.created_at).toLocaleDateString();
    const time = new Date(incident.created_at).toLocaleTimeString();
    const isResolved = incident.status === 'Resolved';
    const isUnresolvedButViewed = !isResolved && !isNew;
    
    return (
      <TouchableOpacity
        key={`reported_${incident.id}`}
        style={[
          styles.notificationItem,
          isNew ? styles.newReportedNotification : styles.viewedNotification,
          isUnresolvedButViewed && styles.unresolvedViewedNotification
        ]}
        onPress={() => {
          markReportedIncidentAsViewed(incident.id);
          showReportedIncidentDetails(incident);
        }}
      >
        <View style={styles.notificationHeader}>
          <View style={styles.notificationIcon}>
            <Ionicons 
              name={isResolved ? "checkmark-circle" : (isNew ? "document-text" : "document-text-outline")} 
              size={20} 
              color={isResolved ? "#4CAF50" : (isNew ? "#2196F3" : (isUnresolvedButViewed ? "#FF9800" : "#666"))} 
            />
          </View>
          <View style={styles.notificationContent}>
            <Text style={[
              styles.notificationTitle, 
              isNew && styles.newReportedTitle,
              isUnresolvedButViewed && styles.unresolvedViewedTitle
            ]}>
              📋 Your Report: {incident.type}
            </Text>
            <Text style={styles.notificationDate}>
              {date} at {time}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="location-sharp" size={14} color="#2196F3" style={{ marginRight: 4 }} />
              <Text style={styles.notificationLocation}>{incident.location}</Text>
            </View>
            <Text style={[
                styles.notificationLocation,
                isResolved && { color: "#4CAF50", fontWeight: "bold" },
                isUnresolvedButViewed && { color: "#FF9800", fontWeight: "bold" }
              ]}>
                Status: {incident.status === 'Resolved' && incident.resolved_by === 'Admin' 
                  ? 'Marked as Resolved by Admin' 
                  : incident.status}
              </Text>
                          {incident.assigned && (
                <Text style={styles.incidentReporter}>
                  Assigned to: {incident.assigned}
                </Text>
              )}
              {!incident.assigned && !(incident.status === 'Resolved' && incident.resolved_by === 'Admin') && (
                <Text style={[styles.incidentReporter, { color: "#FF9800" }]}>
                  Not yet assigned
                </Text>
              )}
            {isUnresolvedButViewed && (
              <Text style={styles.unresolvedViewedText}>
                ⏳ Awaiting response
              </Text>
            )}
          </View>
          {isNew && <View style={styles.newReportedBadge} />}
          {isUnresolvedButViewed && <View style={styles.unresolvedViewedBadge} />}
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

  // Calculate totals
  const totalNewNotifications = newNotifications.length + 
    assignedCategorized.newIncidents.length + 
    reportedCategorized.newIncidents.length;
  
  const totalViewedNotifications = viewedNotificationsList.length + 
    assignedCategorized.viewedUnresolved.length + 
    assignedCategorized.resolved.length +
    reportedCategorized.viewedUnresolved.length + 
    reportedCategorized.resolved.length;

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
            {totalNewNotifications} new {totalViewedNotifications} viewed
          </Text>
        </View>

        {logs.length === 0 && assignedIncidents.length === 0 && reportedIncidents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No notifications yet</Text>
            <Text style={styles.emptySubtext}>
              Your activity logs and incident updates will appear here
            </Text>
          </View>
        ) : (
          <>
            {/* New Assigned Incidents */}
            {assignedCategorized.newIncidents.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  🚨 New Incident Assignments ({assignedCategorized.newIncidents.length})
                </Text>
                {assignedCategorized.newIncidents.map(incident => renderAssignedIncidentItem(incident, true))}
              </View>
            )}

            {/* New Reported Incidents Updates */}
            {reportedCategorized.newIncidents.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  📋 New Updates on Your Reports ({reportedCategorized.newIncidents.length})
                </Text>
                {reportedCategorized.newIncidents.map(incident => renderReportedIncidentItem(incident, true))}
              </View>
            )}

            {/* New Activity Notifications */}
            {newNotifications.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  🔔 New Activity ({newNotifications.length})
                </Text>
                {newNotifications.map(log => renderNotificationItem(log, true))}
              </View>
            )}

            {/* Earlier Section */}
            {totalViewedNotifications > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Earlier ({totalViewedNotifications})
                </Text>
                {/* Viewed unresolved assigned incidents (priority) */}
                {assignedCategorized.viewedUnresolved.map(incident => renderAssignedIncidentItem(incident, false))}
                
                {/* Viewed unresolved reported incidents */}
                {reportedCategorized.viewedUnresolved.map(incident => renderReportedIncidentItem(incident, false))}
                
                {/* Viewed activity notifications */}
                {viewedNotificationsList.map(log => renderNotificationItem(log, false))}
                
                {/* Resolved assigned incidents */}
                {assignedCategorized.resolved.map(incident => renderAssignedIncidentItem(incident, false))}
                
                {/* Resolved reported incidents */}
                {reportedCategorized.resolved.map(incident => renderReportedIncidentItem(incident, false))}
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
  resolvedByMeNotification: {
    backgroundColor: "#f0f8ff",
    borderLeftWidth: 4,
    borderLeftColor: "#2196F3",
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
  resolvedByMeText: {
    fontSize: 12,
    color: "#2196F3",
    fontWeight: "bold" as const,
    marginTop: 4,
  },
  unresolvedViewedNotification: {
    backgroundColor: "#fff8e1",
    borderLeftWidth: 4,
    borderLeftColor: "#FF9800",
  },
  unresolvedViewedTitle: {
    fontWeight: "bold" as const,
    color: "#E65100",
  },
  unresolvedViewedText: {
    fontSize: 12,
    color: "#FF9800",
    fontWeight: "bold" as const,
    marginTop: 4,
  },
  unresolvedViewedBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF9800",
    marginTop: 5,
  },
  newReportedNotification: {
  backgroundColor: "#f0f8ff",
  borderLeftWidth: 4,
  borderLeftColor: "#2196F3",
},
newReportedTitle: {
  fontWeight: "bold",
  color: "#1565C0",
},
newReportedBadge: {
  width: 8,
  height: 8,
  borderRadius: 4,
  backgroundColor: "#2196F3",
  marginTop: 5,
},
});

export default Notifications;