import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Picker } from "@react-native-picker/picker";

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
  const [role, setRole] = useState("Resident");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!username || !password) {
      Alert.alert("Missing fields", "Please enter username and password");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("http://192.168.138.28:3001/register", {
        username,
        password,
        role,
      });

      if (response.data.success) {
        Alert.alert("Success", "Account created successfully");
        navigation.replace("Login");
      } else {
        Alert.alert("Error", response.data.message || "Registration failed");
      }
    } catch (error: any) {
      Alert.alert("Error", "Something went wrong. Try again later.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.box}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>LOGO</Text>
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

        <TouchableOpacity onPress={() => navigation.replace("Login")}>
          <Text>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
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
    height: 45,
    backgroundColor: "#d9d9d9",
    borderRadius: 25,
    paddingHorizontal: 20,
    fontWeight: "bold",
  },
    pickerContainer: {
    width: "100%",
    height: 45, // Match TextInput height
    backgroundColor: "#d9d9d9",
    borderRadius: 25,
    justifyContent: "center", // Ensures vertical alignment
    paddingHorizontal: 10, // Add some padding
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
});

export default Register;
