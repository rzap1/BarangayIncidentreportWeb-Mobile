// IncidentReport.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "./app"; // ✅ Adjust path if needed
import { Ionicons, AntDesign, Feather } from "@expo/vector-icons"; // Import icon libraries
import NavBar from "./NavBar";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "IncidentReport">;

const IncidentReport: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [incidentType, setIncidentType] = useState("");
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Permission to access location was denied");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setCurrentLocation(location);
      setMapRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
    })();
  }, []);

  const handleUseCurrentLocation = () => {
    if (currentLocation) {
      setMapRegion({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
    }
  };

  const handleAttachPhoto = () => {
    // Implement photo attachment logic here
    console.log("Attach photo pressed");
  };

  const handleSubmit = () => {
    // Implement submit logic here
    console.log("Submit pressed", { incidentType, currentLocation });
    // After submitting, maybe navigate back
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <NavBar />

      <View style={styles.body}>
        <Text style={styles.reportTitle}>OH NO! HURRY UP AND REPORT THE INCIDENT</Text>
        <Text style={styles.sadEmoji}>&#x1F61E;</Text>

        <Text style={styles.label}>Type of incident:</Text>
        <TextInput
          style={styles.input}
          value={incidentType}
          onChangeText={setIncidentType}
          placeholder="Enter incident type"
        />

        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            region={mapRegion}
            showsUserLocation={true}
            loadingEnabled
          >
            {/* No default pins as requested */}
          </MapView>
        </View>

        <TouchableOpacity style={styles.currentLocationButton} onPress={handleUseCurrentLocation}>
          <Text style={styles.currentLocationText}>Use my current location</Text>
          <Ionicons name="location-sharp" size={20} color="black" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.attachPhotoButton} onPress={handleAttachPhoto}>
          <Feather name="camera" size={20} color="black" style={{ marginRight: 10 }} />
          <Text style={styles.attachPhotoButtonText}>ATTACH PHOTO</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>SUBMIT</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f0f0",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#e0e0e0",
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  body: {
    padding: 20,
    alignItems: "center",
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  sadEmoji: {
    fontSize: 24,
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    marginBottom: 5,
    alignSelf: "flex-start",
  },
  input: {
    width: "100%",
    backgroundColor: "#fff",
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  mapContainer: {
    width: "100%",
    height: 300,
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 15,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  currentLocationButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e0e0e0",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginBottom: 15,
  },
  currentLocationText: {
    fontSize: 14,
    marginRight: 10,
  },
  attachPhotoButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#d9d9d9",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginBottom: 15,
  },
  attachPhotoButtonText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  submitButton: {
    backgroundColor: "#a9a9a9",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default IncidentReport;