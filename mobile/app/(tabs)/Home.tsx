// Home.tsx
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from "react-native";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import axios from "axios";
// Import Call functionality
import { Linking } from "react-native";

import NavBar from "./NavBar";
import type { RootStackParamList } from "./app"; // ✅ Use shared type from App.tsx

type HomeRouteProp = RouteProp<RootStackParamList, "Home">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Home">;

interface UserData {
  ID: string;
  USER: string;
  NAME: string;
  EMAIL: string;
  ADDRESS: string;
  ROLE: string;
  STATUS: string;
  IMAGE?: string | null;
}

const Home: React.FC = () => {
  const route = useRoute<HomeRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const username = route.params?.username || "";
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Emergency contacts - you can make this configurable or fetch from backend
  const emergencyContacts = {
    barangay: "+639123456789", // Replace with actual barangay number

  };
  
  // Fetch user data on component mount
  useEffect(() => {
    if (username) {
      fetchUserData();
    }
  }, [username]);
  
  const fetchUserData = async () => {
    try {
      const response = await axios.get(`http://192.168.164.28:3001/api/user/${username}`);
      
      if (response.data) {
        setUserData(response.data);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);     
    } finally {
      setLoading(false);
    }
  };

  // Function to make emergency call
  const makeEmergencyCall = () => {
    const phoneNumber = emergencyContacts.barangay;
    const url = `tel:${phoneNumber}`;
    
    // Direct call without checking canOpenURL (for better compatibility)
    Linking.openURL(url).catch((err) => {
      console.error('Call Error:', err);
      // Fallback: try alternative formats
      const alternativeUrl = `telprompt:${phoneNumber}`;
      Linking.openURL(alternativeUrl).catch((fallbackErr) => {
        console.error('Fallback Call Error:', fallbackErr);
        Alert.alert("Error", "Unable to open phone dialer. Please call " + phoneNumber + " manually.");
      });
    });
  };

  // Alternative direct call function (bypasses confirmation)
  const makeDirectCall = (phoneNumber: string) => {
    const url = `tel:${phoneNumber}`;
    
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          Alert.alert("Error", "Phone calls are not supported on this device");
        }
      })
      .catch((err) => {
        console.error('Call Error:', err);
        Alert.alert("Error", "Failed to make call");
      });
  };
  
  return (
    <View style={styles.container}>
      <NavBar username={username} userImage={userData?.IMAGE} />
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

        {/* Updated Emergency Call Button */}
        <TouchableOpacity
          style={styles.emergencyButton}
          onPress={makeEmergencyCall}
        >
          <Text style={styles.emergencyButtonText}>📞 EMERGENCY CALL</Text>
        </TouchableOpacity>

        <Text style={styles.offlineText}>Works with cellular network</Text>
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
  // Updated styles for emergency call button
  emergencyButton: {
    marginTop: 15,
    backgroundColor: "#ff4444", // Retained red color
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  emergencyButtonText: {
    fontWeight: "bold",
    color: "#fff",
    fontSize: 14,
  },
  offlineText: {
    fontSize: 10,
    color: "#666",
    marginTop: 5,
    fontStyle: "italic",
  },
});

export default Home;