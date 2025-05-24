import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import type { RootStackParamList } from "./app";

type TimeInRouteProp = RouteProp<RootStackParamList, "TimeIn">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, "TimeIn">;

interface UserTimeStatus {
  schedule: {
    id: number;
    user: string;
    status: string;
    scheduledTime: string | null;
  };
  logs: {
    timeIn: {
      time: string;
      action: string;
    } | null;
    timeOut: {
      time: string;
      action: string;
    } | null;
  };
  currentTime: string;
  hasTimeInToday: boolean;
  hasTimeOutToday: boolean;
}

const TimeIn: React.FC = () => {
  const route = useRoute<TimeInRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const username = route.params?.username || "";
  
  const [currentTime, setCurrentTime] = useState("");
  const [userStatus, setUserStatus] = useState<UserTimeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Update current time every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', {
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      setCurrentTime(timeString);
    };

    updateTime(); // Initial call
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  // Fetch user's log status
  useEffect(() => {
    fetchUserTimeStatus();
  }, [username]);

  const fetchUserTimeStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://192.168.164.28:3001/api/user-time-status/${username}`);
      const data = await response.json();
      
      if (response.ok) {
        setUserStatus(data);
      } else {
        Alert.alert("Error", data.error || "Failed to fetch user status");
      }
    } catch (error) {
      console.error("Error fetching user status:", error);
      Alert.alert("Error", "Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const handleTimeRecord = async (action: 'TIME-IN' | 'TIME-OUT') => {
    if (submitting) return;

    // Check if action is allowed based on current status
    if (action === 'TIME-IN' && userStatus?.hasTimeInToday) {
      Alert.alert("Already Timed In", "You have already timed in today. Please time out first if needed.");
      return;
    }

    if (action === 'TIME-OUT' && !userStatus?.hasTimeInToday) {
      Alert.alert("No Time In Record", "You need to time in first before you can time out.");
      return;
    }

    if (action === 'TIME-OUT' && userStatus?.hasTimeOutToday) {
      Alert.alert("Already Timed Out", "You have already timed out today.");
      return;
    }

    // Show confirmation dialog
    const currentTimeFormatted = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });

    Alert.alert(
      "Confirm Time Record",
      `Are you sure you want to record ${action}?\n\nTime: ${currentTimeFormatted}`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              setSubmitting(true);
              
              const response = await fetch('http://192.168.164.28:3001/api/time-record', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  user: username,
                  action: action
                }),
              });

              const data = await response.json();

              if (response.ok) {
                Alert.alert(
                  "Success", 
                  `${action} recorded successfully at ${new Date(data.time).toLocaleTimeString()}`,
                  [
                    {
                      text: "OK",
                      onPress: () => {
                        // Refresh user status after successful time record
                        fetchUserTimeStatus();
                      }
                    }
                  ]
                );
              } else {
                Alert.alert("Error", data.message || `Failed to record ${action}`);
              }
            } catch (error) {
              console.error("Error recording time:", error);
              Alert.alert("Error", "Failed to connect to server");
            } finally {
              setSubmitting(false);
            }
          }
        }
      ]
    );
  };

  const formatScheduleTime = (timeString: string | null) => {
    if (!timeString) return "No schedule set";
    
    try {
      const date = new Date(timeString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return "Invalid time format";
    }
  };

  const formatLogTime = (timeString: string) => {
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch (error) {
      return "Invalid time";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'on duty':
        return '#28a745';
      case 'off duty':
        return '#dc3545';
      case 'available':
        return '#17a2b8';
      default:
        return '#6c757d';
    }
  };

  const canTimeIn = !userStatus?.hasTimeInToday;
  const canTimeOut = userStatus?.hasTimeInToday && !userStatus?.hasTimeOutToday;

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.customHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Time Tracking</Text>
          <View style={styles.headerPlaceholder} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Loading user data...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Custom header with back button */}
      <View style={styles.customHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Time Tracking</Text>
        <View style={styles.headerPlaceholder} />
      </View>
      
      <View style={styles.content}>
        {/* Schedule Time Section */}
        <View style={styles.scheduleSection}>
          <Text style={styles.scheduleLabel}>Scheduled Time:</Text>
          <TextInput
            style={styles.scheduleInput}
            value={formatScheduleTime(userStatus?.schedule.scheduledTime || null)}
            editable={false}
            placeholder="No schedule set"
          />
        </View>

        {/* Current Time Display */}
        <View style={styles.currentTimeSection}>
          <Text style={styles.currentTimeLabel}>Current Time:</Text>
          <Text style={styles.currentTimeDisplay}>{currentTime}</Text>
        </View>

        {/* Show existing log entries if they exist */}
        {userStatus?.logs.timeIn && (
          <View style={styles.logSection}>
            <Text style={styles.logTitle}>Today's Records:</Text>
            <View style={styles.logEntry}>
              <Ionicons name="log-in" size={16} color="#28a745" />
              <Text style={styles.logText}>
                TIME-IN: {formatLogTime(userStatus.logs.timeIn.time)}
              </Text>
            </View>
            {userStatus.logs.timeOut && (
              <View style={styles.logEntry}>
                <Ionicons name="log-out" size={16} color="#dc3545" />
                <Text style={styles.logText}>
                  TIME-OUT: {formatLogTime(userStatus.logs.timeOut.time)}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* TIME-IN Section */}
        <View style={styles.section}>
          <Text style={styles.label}>TIME-IN:</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.timeInput, 
                !canTimeIn && styles.timeInputDisabled
              ]}
              value={canTimeIn ? currentTime : "Already timed in"}
              editable={false}
              placeholder={canTimeIn ? "Ready to time in" : "Already timed in today"}
            />
            <TouchableOpacity
              style={[
                styles.submitButton,
                canTimeIn ? styles.submitButtonEnabled : styles.submitButtonDisabled
              ]}
              onPress={() => handleTimeRecord('TIME-IN')}
              disabled={!canTimeIn || submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons 
                    name={canTimeIn ? "log-in" : "checkmark-circle"} 
                    size={20} 
                    color={canTimeIn ? "#fff" : "#28a745"} 
                  />
                  <Text style={[
                    styles.submitButtonText,
                    !canTimeIn && styles.submitButtonTextDisabled
                  ]}>
                    {canTimeIn ? "TIME-IN" : "DONE"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* TIME-OUT Section */}
        <View style={styles.section}>
          <Text style={styles.label}>TIME-OUT:</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.timeInput,
                !canTimeOut && styles.timeInputDisabled
              ]}
              value={canTimeOut ? currentTime : userStatus?.hasTimeOutToday ? "Already timed out" : "Time in first"}
              editable={false}
              placeholder={canTimeOut ? "Ready to time out" : "Time in required first"}
            />
            <TouchableOpacity
              style={[
                styles.submitButton,
                canTimeOut ? styles.submitButtonTimeOut : styles.submitButtonDisabled
              ]}
              onPress={() => handleTimeRecord('TIME-OUT')}
              disabled={!canTimeOut || submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons 
                    name={canTimeOut ? "log-out" : userStatus?.hasTimeOutToday ? "checkmark-circle" : "close-circle"} 
                    size={20} 
                    color={canTimeOut ? "#fff" : userStatus?.hasTimeOutToday ? "#28a745" : "#dc3545"} 
                  />
                  <Text style={[
                    styles.submitButtonText,
                    !canTimeOut && styles.submitButtonTextDisabled
                  ]}>
                    {canTimeOut ? "TIME-OUT" : userStatus?.hasTimeOutToday ? "DONE" : "N/A"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Status Display */}
        <View style={styles.statusSection}>
          <Text style={styles.statusLabel}>Current Status:</Text>
          <Text style={[
            styles.statusText, 
            { color: getStatusColor(userStatus?.schedule.status || 'Off Duty') }
          ]}>
            {userStatus?.schedule.status || 'Off Duty'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  // Custom header styles
  customHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    backgroundColor: "#555",
    paddingBottom: 10,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontWeight: "bold",
    fontSize: 18,
    color: "#fff",
    flex: 1,
    textAlign: "center",
  },
  headerPlaceholder: {
    width: 34,
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
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 20,
  },
  scheduleSection: {
    marginBottom: 20,
  },
  scheduleLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  scheduleInput: {
    backgroundColor: "#e9ecef",
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: "#6c757d",
    fontWeight: "500",
  },
  currentTimeSection: {
    marginBottom: 20,
    alignItems: "center",
  },
  currentTimeLabel: {
    fontSize: 16,
    color: "#666",
    marginBottom: 5,
  },
  currentTimeDisplay: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#007bff",
  },
  logSection: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#007bff",
  },
  logTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  logEntry: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  logText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#333",
  },
  section: {
    marginBottom: 25,
  },
  label: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  timeInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  timeInputDisabled: {
    backgroundColor: "#f8f8f8",
    color: "#999",
  },
  submitButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonEnabled: {
    backgroundColor: "#007bff",
  },
  submitButtonTimeOut: {
    backgroundColor: "#dc3545",
  },
  submitButtonDisabled: {
    backgroundColor: "#e9ecef",
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  submitButtonTextDisabled: {
    color: "#6c757d",
  },
  statusSection: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    marginTop: 10,
  },
  statusLabel: {
    fontSize: 16,
    color: "#666",
    marginBottom: 5,
  },
  statusText: {
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default TimeIn;