import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Picker } from "@react-native-picker/picker";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";

type RootStackParamList = {
  Login: undefined;
  Home: { username: string };
  Register: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const Register: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [role, setRole] = useState("Resident");
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const handleUseCurrentLocation = async () => {
    setLocationLoading(true);
    try {
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Location permission is required to get your current address.");
        setLocationLoading(false);
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // Reverse geocode to get address
      const results = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (results.length > 0) {
        const addr = results[0];
        const formatted = `${addr.name || ""} ${addr.street || ""}, ${addr.city || addr.subregion || ""}, ${addr.region || ""}, ${addr.postalCode || ""}`;
        setAddress(formatted.trim());
      } else {
        Alert.alert("Error", "Unable to determine address from current location");
      }
    } catch (error) {
      console.error("Location error:", error);
      Alert.alert("Location Error", "Unable to get current location. Please try again or enter address manually.");
    } finally {
      setLocationLoading(false);
    }
  };

  const handleRegister = async () => {
    // Validate all required fields
    if (!username || !password || !name || !email || !address) {
      Alert.alert("Missing fields", "Please fill all required fields");
      return;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Invalid email", "Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("http://192.168.180.28:3001/register", {
        username,
        password,
        role,
        name,
        email,
        address,
      });

      if (response.data.success) {
        Alert.alert("Success", "Account created successfully");
        navigation.replace("Login");
      } else {
        Alert.alert("Error", response.data.message || "Registration failed");
      }
    } catch (error: any) {
      console.error(error);
      if (error.response && error.response.status === 409) {
        Alert.alert("Error", "Username already exists");
      } else {
        Alert.alert("Error", "Something went wrong. Try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <View style={styles.box}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>LOGO</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>FULL NAME</Text>
            <TextInput
              style={styles.inputBox}
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>USERNAME</Text>
            <TextInput
              style={styles.inputBox}
              value={username}
              onChangeText={setUsername}
              placeholder="Choose a username"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>PASSWORD</Text>
            <TextInput
              style={styles.inputBox}
              value={password}
              onChangeText={setPassword}
              placeholder="Create a password"
              secureTextEntry
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>EMAIL</Text>
            <TextInput
              style={styles.inputBox}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>ADDRESS</Text>
            <View style={styles.addressInputContainer}>
              <TextInput
                style={styles.addressInput}
                value={address}
                onChangeText={setAddress}
                placeholder="Enter your address or use current location"
                multiline={true}
                numberOfLines={2}
              />
              <TouchableOpacity
                style={styles.locationButton}
                onPress={handleUseCurrentLocation}
                disabled={locationLoading}
              >
                {locationLoading ? (
                  <ActivityIndicator size="small" color="#666" />
                ) : (
                  <Ionicons name="location-sharp" size={20} color="#666" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Account Type</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={role}
                onValueChange={(itemValue) => setRole(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="Resident" value="Resident" />
                <Picker.Item label="Tanod" value="Tanod" />
              </Picker>
            </View>
          </View>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.loginButtonText}>Create</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => navigation.replace("Login")}
            style={styles.backButton}
          >
            <Text>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 30,
  },
  box: {
    width: "80%",
    alignItems: "center",
  },
  logoCircle: {
    width: 100,
    height: 100,
    backgroundColor: "#d9d9d9",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
  },
  logoText: {
    fontWeight: "bold",
    color: "#000",
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
  inputBox: {
    width: "100%",
    minHeight: 45,
    backgroundColor: "#d9d9d9",
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 10,
    fontWeight: "bold",
  },
  addressInputContainer: {
    flexDirection: "row",
    alignItems: "stretch",
    width: "100%",
  },
  addressInput: {
    flex: 1,
    minHeight: 45,
    backgroundColor: "#d9d9d9",
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 10,
    fontWeight: "bold",
    marginRight: 10,
  },
  locationButton: {
    width: 45,
    height: 45,
    backgroundColor: "#d9d9d9",
    borderRadius: 22.5,
    justifyContent: "center",
    alignItems: "center",
  },
  pickerContainer: {
    width: "100%",
    height: 45,
    backgroundColor: "#d9d9d9",
    borderRadius: 25,
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  picker: {
    width: "100%",
    color: "#000",
  },
  loginButton: {
    width: 120,
    height: 40,
    backgroundColor: "#d9d9d9",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  loginButtonText: {
    fontWeight: "bold",
    color: "#000",
  },
  backButton: {
    marginTop: 15,
    padding: 10,
  }
});

export default Register;