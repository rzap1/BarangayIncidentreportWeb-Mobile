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
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "./app";
import { Ionicons, Feather } from "@expo/vector-icons";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "IncidentReport"
>;

type IncidentReportRouteProp = RouteProp<RootStackParamList, "IncidentReport">;

const DEFAULT_COORDS = {
  latitude: 14.56535797150489,
  longitude: 121.61706714218529,
};

const IncidentReport: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<IncidentReportRouteProp>();

  const username = route.params?.username ?? "unknown";

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
  const [address, setAddress] = useState<string>("");

  useEffect(() => {
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

  useEffect(() => {
    const fetchAddress = async () => {
      try {
        const results = await Location.reverseGeocodeAsync(pinLocation);
        if (results.length > 0) {
          const addr = results[0];
          const formatted = `${addr.name || ""} ${addr.street || ""}, ${addr.city || addr.subregion || ""}, ${addr.region || ""}, ${addr.postalCode || ""}`;
          setAddress(formatted.trim());
        } else {
          setAddress("Address not found");
        }
      } catch (err) {
        setAddress("Failed to get address");
      }
    };

    fetchAddress();
  }, [pinLocation]);

  const formatDateTimeForMySQL = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, "0");
    return (
      `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
      `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    );
  };

  const formattedDateTime = formatDateTimeForMySQL(currentDateTime);

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
      const formData = new FormData();

      formData.append("incidentType", incidentType);
      formData.append("latitude", pinLocation.latitude.toString());
      formData.append("longitude", pinLocation.longitude.toString());
      formData.append("datetime", formattedDateTime);
      formData.append("address", address);
      formData.append("reported_by", username);

      if (image) {
        const filename = image.split("/").pop()!;
        const match = /\.(\w+)$/.exec(filename);
        const ext = match ? match[1] : "jpg";
        formData.append("image", {
          uri: image,
          name: filename,
          type: `image/${ext}`,
        } as any);
      }

      const response = await fetch("http://192.168.125.28:3001/api/incidents", {
        method: "POST",
        body: formData,
      });

      const text = await response.text();
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
      Alert.alert("Error", error instanceof Error ? error.message : "Unknown error");
    }
  };

  return (
    <View style={styles.container}>
      {/* Custom header with back button instead of NavBar */}
      <View style={styles.customHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PatrolNet - Report Incident</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.reportTitle}>Report an Incident</Text>
        <Text style={styles.reportSubtitle}>Help us respond quickly to your concern</Text>

        <Text style={styles.label}>Reported by:</Text>
        <Text style={styles.usernameDisplay}>{username}</Text>
        
        <Text style={styles.label}>Type of incident:</Text>
        <TextInput
          style={styles.input}
          value={incidentType}
          onChangeText={setIncidentType}
          placeholder="Enter incident type"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Current Date & Time:</Text>
        <TextInput
          style={[styles.input, styles.readOnlyInput]}
          value={formattedDateTime}
          editable={false}
        />

        <Text style={styles.label}>Location Address:</Text>
        <TextInput
          style={[styles.input, styles.readOnlyInput]}
          value={address}
          editable={false}
        />

        <View style={styles.mapContainer}>
          {!locationLoaded ? (
            <ActivityIndicator size="large" color="#4a90e2" />
          ) : (
            <MapView
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              region={mapRegion}
              onPress={handleMapPress}
            >
              {pinLocation && (
                <Marker coordinate={pinLocation} title="Pinned Location">
                  <Ionicons name="location-sharp" size={30} color="#e74c3c" />
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
          <Ionicons name="location-sharp" size={20} color="#4a90e2" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.attachPhotoButton}
          onPress={handleAttachPhoto}
        >
          <Feather
            name="camera"
            size={20}
            color="#4a90e2"
            style={{ marginRight: 10 }}
          />
          <Text style={styles.attachPhotoButtonText}>ATTACH PHOTO</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>SUBMIT REPORT</Text>
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
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#f5f6fa" 
  },
  
  // Professional header styles
  customHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    backgroundColor: "#2c3e50",
    paddingBottom: 15,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerTitle: {
    fontWeight: "600",
    fontSize: 18,
    color: "#fff",
    flex: 1,
    textAlign: "center",
  },
  headerPlaceholder: {
    width: 40,
  },
  
  body: { 
    padding: 20, 
    backgroundColor: "#f5f6fa" 
  },
  
  reportTitle: { 
    fontSize: 24, 
    fontWeight: "bold", 
    marginBottom: 8,
    color: "#2c3e50",
    textAlign: "center"
  },
  
  reportSubtitle: {
    fontSize: 16,
    color: "#7f8c8d",
    textAlign: "center",
    marginBottom: 30,
    fontWeight: "400"
  },
  
  label: { 
    fontSize: 16, 
    marginBottom: 8, 
    fontWeight: "600",
    color: "#2c3e50"
  },
  
  usernameDisplay: {
    fontSize: 16,
    color: "#4a90e2",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e1e8ed",
    marginBottom: 20,
    fontWeight: "500"
  },
  
  input: {
    width: "100%",
    backgroundColor: "#fff",
    borderColor: "#e1e8ed",
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    fontSize: 16,
    color: "#2c3e50",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  
  readOnlyInput: {
    backgroundColor: "#f8f9fa",
    color: "#6c757d"
  },
  
  mapContainer: {
    width: "100%",
    height: 250,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 20,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  
  map: { 
    ...StyleSheet.absoluteFillObject 
  },
  
  currentLocationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e1e8ed",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  
  currentLocationText: { 
    fontSize: 16, 
    marginRight: 10,
    color: "#4a90e2",
    fontWeight: "500"
  },
  
  attachPhotoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: "#e1e8ed",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  
  attachPhotoButtonText: { 
    fontSize: 16, 
    fontWeight: "600",
    color: "#4a90e2"
  },
  
  imageSection: { 
    width: "100%", 
    marginBottom: 20,
    marginTop: 20
  },
  
  imageLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    alignItems: "center"
  },
  
  imageLabel: { 
    fontSize: 16, 
    fontWeight: "600",
    color: "#2c3e50"
  },
  
  removePhotoText: {
    color: "#e74c3c",
    fontSize: 14,
    fontWeight: "500"
  },
  
  imagePreview: { 
    width: "100%", 
    height: 200, 
    borderRadius: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  
  submitButton: {
    backgroundColor: "#27ae60",
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 8,
    marginBottom: 30,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  
  submitButtonText: { 
    color: "#fff", 
    fontWeight: "bold", 
    fontSize: 18,
    textAlign: "center"
  },
  
  inputGroup: { 
    width: "100%", 
    marginBottom: 15 
  },
  
  inputLabel: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#000",
  },
});

export default IncidentReport;