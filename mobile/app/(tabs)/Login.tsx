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
import AsyncStorage from '@react-native-async-storage/async-storage';

type RootStackParamList = {
  Login: undefined;
  Home: { username: string };
  Register: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const Login: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  const [username, setUsername] = useState("Frank");
  const [password, setPassword] = useState("frank");  
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Missing fields", "Please enter username and password");
      return;
    }

    setLoading(true);
    try {
        const response = await axios.post("http://192.168.125.28:3001/login", {
          username,
          password,
        });

        if (response.data.success) {
          navigation.navigate("Home", { username });
        }
      } catch (error: any) {
        if (error.response?.status === 401) {
          Alert.alert("Login Failed", "Invalid username or password");
        } else if (error.response?.status === 403) {
          Alert.alert("Login Failed", error.response.data.error);
        } else {
          Alert.alert("Error", "Something went wrong. Try again later.");
          console.error(error);
        }
      }
 finally {
      setLoading(false);
    }
  };

return (
  <View style={styles.loginContainer}>
    <View style={styles.loginBox}>
      {/* Header Section */}
      <View style={styles.headerSection}>
        <View style={styles.logoCircle}>
          <View style={styles.logoInner}>
            <Text style={styles.logoText}>PN</Text>
            <View style={styles.logoAccent} />
          </View>
          <View style={styles.logoGlow} />
        </View>
        <Text style={styles.appTitle}>PatrolNet</Text>
        <Text style={styles.appSubtitle}>Emergency Response System</Text>
        <Text style={styles.welcomeText}>Secure Access</Text>
      </View>

      {/* Form Section */}
      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>OFFICER ID / USERNAME</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputIcon}>👮‍♂️</Text>
            <TextInput
              style={styles.inputBox}
              value={username}
              onChangeText={setUsername}
              placeholder="Enter your credentials"
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>SECURE PASSWORD</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputIcon}>🔐</Text>
            <TextInput
              style={styles.inputBox}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter secure password"
              placeholderTextColor="#94A3B8"
              secureTextEntry
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.loginButton, loading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <Text style={styles.loadingText}>AUTHENTICATING...</Text>
            </View>
          ) : (
            <View style={styles.buttonContent}>
              <Text style={styles.loginButtonText}>ACCESS SYSTEM</Text>
              <Text style={styles.buttonArrow}>→</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Emergency Access */}
        <TouchableOpacity style={styles.emergencyButton} activeOpacity={0.7}>
          <Text style={styles.emergencyIcon}>🚨</Text>
          <Text style={styles.emergencyText}>EMERGENCY ACCESS</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footerSection}>
          <Text style={styles.footerLabel}>Need credentials?</Text>
          <TouchableOpacity 
            onPress={() => navigation.replace("Register")}
            style={styles.createAccountButton}
            activeOpacity={0.7}
          >
            <Text style={styles.createAccountText}>REQUEST ACCESS</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Security Badge */}
      <View style={styles.securityBadge}>
        <Text style={styles.securityIcon}>🛡️</Text>
        <Text style={styles.securityText}>MILITARY-GRADE ENCRYPTION</Text>
      </View>

      {/* Status Indicator */}
      <View style={styles.statusBar}>
        <View style={styles.statusDot} />
        <Text style={styles.statusText}>SYSTEM OPERATIONAL</Text>
      </View>
    </View>
  </View>
);
};

const styles = StyleSheet.create({
  loginContainer: {
    flex: 1,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  loginBox: {
    width: "100%",
    maxWidth: 380,
    alignItems: "center",
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    position: "relative",
  },
  logoInner: {
    width: 100,
    height: 100,
    backgroundColor: "#DC2626",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FEF2F2",
    shadowColor: "#DC2626",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  logoText: {
    fontSize: 24,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 2,
  },
  logoAccent: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 12,
    height: 12,
    backgroundColor: "#FEF2F2",
    borderRadius: 6,
  },
  logoGlow: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(220, 38, 38, 0.2)",
    top: 0,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 1,
    marginBottom: 4,
  },
  appSubtitle: {
    fontSize: 14,
    color: "#DC2626",
    fontWeight: "600",
    letterSpacing: 2,
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 18,
    color: "#E2E8F0",
    fontWeight: "600",
    marginBottom: 4,
  },
  formContainer: {
    width: "100%",
    marginBottom: 30,
  },
  inputGroup: {
    width: "100%",
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 8,
    color: "#DC2626",
    letterSpacing: 1,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E293B",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    paddingHorizontal: 16,
    height: 54,
  },
  inputIcon: {
    fontSize: 18,
    marginRight: 12,
    color: "#64748B",
  },
  inputBox: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: "#FFFFFF",
    height: "100%",
  },
  loginButton: {
    width: "100%",
    height: 56,
    backgroundColor: "#DC2626",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#DC2626",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 1,
    marginRight: 8,
  },
  buttonArrow: {
    fontSize: 18,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 8,
    letterSpacing: 1,
  },
  emergencyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: 48,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1,
    borderColor: "#EF4444",
    borderRadius: 8,
    marginTop: 16,
  },
  emergencyIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  emergencyText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#EF4444",
    letterSpacing: 1,
  },
  footerSection: {
    alignItems: "center",
    marginTop: 24,
  },
  footerLabel: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 8,
  },
  createAccountButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  createAccountText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#DC2626",
    letterSpacing: 0.5,
  },
  securityBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    borderWidth: 1,
    borderColor: "#22C55E",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
  },
  securityIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  securityText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#22C55E",
    letterSpacing: 1,
  },
  statusBar: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    backgroundColor: "#22C55E",
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#22C55E",
    letterSpacing: 0.5,
  },
});

export default Login;
