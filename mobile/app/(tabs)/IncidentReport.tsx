import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
  Alert,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "./app";
import { Ionicons, Feather } from "@expo/vector-icons";
import NavBar from "./NavBar";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "IncidentReport"
>;

const DEFAULT_COORDS = {
  latitude: 14.56535797150489,
  longitude: 121.61706714218529,
};

const IncidentReport: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [incidentType, setIncidentType] = useState("");
  const [locationLoaded, setLocationLoaded] = useState(false);
  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: DEFAULT_COORDS.latitude,
    longitude: DEFAULT_COORDS.longitude,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  });
  const [pinLocation, setPinLocation] = useState(DEFAULT_COORDS);
  const [latInput, setLatInput] = useState(DEFAULT_COORDS.latitude.toString());
  const [longInput, setLongInput] = useState(DEFAULT_COORDS.longitude.toString());
  const [image, setImage] = useState<string | null>(null);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    // Always set default location on mount
    setMapRegion({
      latitude: DEFAULT_COORDS.latitude,
      longitude: DEFAULT_COORDS.longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    });
    setPinLocation(DEFAULT_COORDS);
    setLatInput(DEFAULT_COORDS.latitude.toString());
    setLongInput(DEFAULT_COORDS.longitude.toString());
    setLocationLoaded(true);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDateTime12Hour = (date: Date) => {
    return date.toLocaleString("en-US", {
      hour12: true,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formattedDateTime = formatDateTime12Hour(currentDateTime);

  const handleUseCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Location permission is required.");
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const region = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };

      setMapRegion(region);
      setPinLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      setLatInput(location.coords.latitude.toString());
      setLongInput(location.coords.longitude.toString());
    } catch (error) {
      Alert.alert("Location Error", "Unable to get current location.");
    }
  };

  const handleMapPress = (e: any) => {
    const newLocation = e.nativeEvent.coordinate;
    setPinLocation({
      latitude: newLocation.latitude,
      longitude: newLocation.longitude,
    });
    setLatInput(newLocation.latitude.toString());
    setLongInput(newLocation.longitude.toString());
    setMapRegion({
      latitude: newLocation.latitude,
      longitude: newLocation.longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    });
  };

  const handleAttachPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleRemovePhoto = () => {
    setImage(null);
  };

  const handleSubmit = async () => {
  try {
    const response = await fetch("http://192.168.138.28:3001/api/incidents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ incidentType, pinLocation, datetime: formattedDateTime, image }),
    });

    const text = await response.text(); // get raw response text
    console.log("Response text:", text);

    // Now parse json safely:
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error("Response is not valid JSON");
    }

    if (response.ok) {
      Alert.alert("Success", "Incident reported successfully", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } else {
      Alert.alert("Error", data.error || "Failed to report incident");
    }
  } catch (error) {
    let errorMessage = "Network error";
    if (error instanceof Error) {
      errorMessage += ": " + error.message;
    }
    Alert.alert("Error", errorMessage);
  }
};



  return (
    <View style={styles.container}>
      <NavBar />
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.reportTitle}>OH NO!</Text>
        <Text style={styles.reportTitle}>HURRY UP AND REPORT THE INCIDENT</Text>
        <Text style={styles.sadEmoji}>&#x1F61E;</Text>

        <Text style={styles.label}>Type of incident:</Text>
        <TextInput
          style={styles.input}
          value={incidentType}
          onChangeText={setIncidentType}
          placeholder="Enter incident type"
        />

        <Text style={styles.label}>Current Date & Time:</Text>
        <TextInput
          style={[styles.input, { backgroundColor: "#e0e0e0" }]}
          value={formattedDateTime}
          editable={false}
        />

        <View style={styles.mapContainer}>
          {!locationLoaded ? (
            <ActivityIndicator size="large" color="#999" />
          ) : (
            <MapView
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              region={mapRegion}
              onPress={handleMapPress}
            >
              {pinLocation && (
                <Marker coordinate={pinLocation} title="Pinned Location">
                  <Ionicons name="location-sharp" size={30} color="red" />
                </Marker>
              )}
            </MapView>
          )}
        </View>

        <TouchableOpacity
          style={styles.currentLocationButton}
          onPress={handleUseCurrentLocation}
        >
          <Text style={styles.currentLocationText}>Use my current location</Text>
          <Ionicons name="location-sharp" size={20} color="black" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.attachPhotoButton}
          onPress={handleAttachPhoto}
        >
          <Feather
            name="camera"
            size={20}
            color="black"
            style={{ marginRight: 10 }}
          />
          <Text style={styles.attachPhotoButtonText}>ATTACH PHOTO</Text>
        </TouchableOpacity>
          <View style={[styles.inputGroup, { display: "none" }]}>
          <Text style={styles.inputLabel}>Latitude</Text>
          <TextInput style={styles.input} value={latInput} editable={false} />
        </View>

        <View style={[styles.inputGroup, { display: "none" }]}>
          <Text style={styles.inputLabel}>Longitude</Text>
          <TextInput style={styles.input} value={longInput} editable={false} />
        </View>
        {image && (
          <View style={styles.imageSection}>
            <View style={styles.imageLabelRow}>
              <Text style={styles.imageLabel}>Attached Photo:</Text>
              <TouchableOpacity onPress={handleRemovePhoto}>
                <Text style={styles.removePhotoText}>Remove Photo</Text>
              </TouchableOpacity>
            </View>
            <Image source={{ uri: image }} style={styles.imagePreview} />
          </View>
        )}

        

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>SUBMIT</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f0f0",
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
    justifyContent: "center",
    alignItems: "center",
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
  imageSection: {
    width: "100%",
    marginBottom: 20,
  },
  imageLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  imageLabel: {
    fontSize: 14,
    fontWeight: "bold",
  },
  removePhotoText: {
    color: "red",
    textDecorationLine: "underline",
    fontSize: 13,
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 10,
  },
  submitButton: {
    backgroundColor: "#a9a9a9",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginBottom: 30,
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  inputGroup: {
    width: "100%",
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#000",
  },
});

export default IncidentReport;
