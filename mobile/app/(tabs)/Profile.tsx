// Profile.tsx with auto-logout after saving changes
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import axios from "axios";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import type { RootStackParamList } from "./app"; // Adjust path if needed

type ProfileRouteProp = RouteProp<RootStackParamList, "Profile">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface UserData {
  ID: string;
  USER: string;
  NAME: string;
  EMAIL: string;
  ADDRESS: string;
  ROLE: string;
  STATUS: string;
  IMAGE?: string;
}

const Profile: React.FC = () => {
  const route = useRoute<ProfileRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const username = route.params?.username || "";
  
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editMode, setEditMode] = useState(false);
  
  // Form fields
  const [formUsername, setFormUsername] = useState("");
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [image, setImage] = useState<string | null>(null);
  
  // Get user data on component mount
  useEffect(() => {
    fetchUserData();
  }, [username]);
  
  const fetchUserData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://192.168.125.28:3001/api/user/${username}`);
      
      if (response.data) {
        setUserData(response.data);
        // Initialize form values
        setFormUsername(response.data.USER || "");
        setFormName(response.data.NAME || "");
        setFormEmail(response.data.EMAIL || "");
        setFormAddress(response.data.ADDRESS || "");
        setImage(response.data.IMAGE ? `http://192.168.125.28:3001/uploads/${response.data.IMAGE}` : null);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      Alert.alert("Error", "Failed to load user profile");
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpdate = async () => {
    // Validate form
    if (!formUsername || !formName || !formEmail || !formAddress) {
      Alert.alert("Missing fields", "Please fill in all required fields");
      return;
    }
    
    // Validate password if provided
    if (formPassword && formPassword !== confirmPassword) {
      Alert.alert("Password error", "Passwords do not match");
      return;
    }
    
    setUpdating(true);
    
    try {
      const formData = new FormData();
      
      // Add text fields
      formData.append("username", formUsername);
      formData.append("name", formName);
      formData.append("email", formEmail);
      formData.append("address", formAddress);
      
      // Add password if provided
      if (formPassword) {
        formData.append("password", formPassword);
      }
      
      // Add image if selected
      if (image && !image.startsWith("http")) {
        const uriParts = image.split(".");
        const fileType = uriParts[uriParts.length - 1];
        
        formData.append("image", {
          uri: image,
          name: `profile-${Date.now()}.${fileType}`,
          type: `image/${fileType}`,
        } as any);
      }
      
      // Update user
      const response = await axios.put(
        `http://192.168.125.28:3001/api/users/${userData?.ID}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      
      if (response.data.success) {
        Alert.alert(
          "Success", 
          "Profile updated successfully. You will be logged out to apply changes.",
          [
            {
              text: "OK",
              onPress: () => handleAutoLogout()
            }
          ]
        );
      }
    } catch (error: any) {
      if (error.response?.status === 409) {
        Alert.alert("Error", "Username already exists");
      } else {
        console.error("Error updating profile:", error);
        Alert.alert("Error", "Failed to update profile");
      }
    } finally {
      setUpdating(false);
    }
  };
  
  // Function to handle automatic logout after successful profile update
  const handleAutoLogout = () => {
    // Navigate to Login screen and reset navigation stack
    navigation.reset({
      index: 0,
      routes: [{ name: "Login" }],
    });
  };
  
  const pickImage = async () => {
    // Request permissions
    if (Platform.OS !== "web") {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission required", "Camera roll permission is needed to upload images");
        return;
      }
    }
    
    // Pick image
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0].uri);
    }
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#555" />
        <Text style={styles.loadingText}>Loading user data...</Text>
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileHeader}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => setEditMode(!editMode)}
        >
          <Text style={styles.editButtonText}>
            {editMode ? "Cancel" : "Edit"}
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.profileContainer}>
        <TouchableOpacity 
          style={styles.imageContainer}
          onPress={editMode ? pickImage : undefined}
          disabled={!editMode}
        >
          {image ? (
            <Image source={{ uri: image }} style={styles.profileImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="person" size={60} color="#999" />
            </View>
          )}
          {editMode && (
            <View style={styles.cameraIconContainer}>
              <Ionicons name="camera" size={20} color="#fff" />
            </View>
          )}
        </TouchableOpacity>
        
        <View style={styles.infoContainer}>
          {editMode ? (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>USERNAME</Text>
                <TextInput
                  style={styles.inputField}
                  value={formUsername}
                  onChangeText={setFormUsername}
                  placeholder="Username"
                  autoCapitalize="none"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>NAME</Text>
                <TextInput
                  style={styles.inputField}
                  value={formName}
                  onChangeText={setFormName}
                  placeholder="Full Name"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>EMAIL</Text>
                <TextInput
                  style={styles.inputField}
                  value={formEmail}
                  onChangeText={setFormEmail}
                  placeholder="Email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>ADDRESS</Text>
                <TextInput
                  style={styles.inputField}
                  value={formAddress}
                  onChangeText={setFormAddress}
                  placeholder="Address"
                  multiline
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>PASSWORD</Text>
                <TextInput
                  style={styles.inputField}
                  value={formPassword}
                  onChangeText={setFormPassword}
                  placeholder="New Password (leave blank to keep current)"
                  secureTextEntry
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
                <TextInput
                  style={styles.inputField}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm New Password"
                  secureTextEntry
                />
              </View>
              
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleUpdate}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            // View mode
            <>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Username:</Text>
                <Text style={styles.infoValue}>{userData?.USER}</Text>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Full Name:</Text>
                <Text style={styles.infoValue}>{userData?.NAME}</Text>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Email:</Text>
                <Text style={styles.infoValue}>{userData?.EMAIL}</Text>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Address:</Text>
                <Text style={styles.infoValue}>{userData?.ADDRESS}</Text>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Role:</Text>
                <Text style={styles.infoValue}>{userData?.ROLE}</Text>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Status:</Text>
                <Text style={styles.infoValue}>{userData?.STATUS}</Text>
              </View>
            </>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 10,
    color: "#555",
  },
  profileHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    backgroundColor: "#555",
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontWeight: "bold",
    fontSize: 18,
    color: "#fff",
  },
  editButton: {
    padding: 8,
  },
  editButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  profileContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    alignItems: "center",
  },
  imageContainer: {
    marginBottom: 20,
    position: "relative",
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#d9d9d9",
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#d9d9d9",
  },
  cameraIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#555",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  infoContainer: {
    width: "100%",
  },
  infoItem: {
    flexDirection: "row",
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoLabel: {
    fontWeight: "bold",
    width: "35%",
    fontSize: 14,
    color: "#555",
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
  },
  inputGroup: {
    width: "100%",
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#555",
  },
  inputField: {
    width: "100%",
    height: 45,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  saveButton: {
    width: "100%",
    height: 45,
    backgroundColor: "#555",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 40,
  },
  saveButtonText: {
    fontWeight: "bold",
    color: "#fff",
  },
});

export default Profile;