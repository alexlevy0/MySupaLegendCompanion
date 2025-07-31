import ProfileEdit from "@/components/ProfileEdit";
import UserProfile from "@/components/UserProfile";
import { useMyCompanionAuth } from "@/utils/SupaLegend";
import React, { useState } from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Animated,
    Dimensions,
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function ProfileScreen() {
  const { userProfile, loading } = useMyCompanionAuth();
  const [isEditing, setIsEditing] = useState(false);
  const fadeAnim = new Animated.Value(0);

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  if (loading) {
    return (
      <LinearGradient
        colors={['#6366f1', '#8b5cf6', '#a855f7']}
        style={styles.loadingContainer}
      >
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </LinearGradient>
    );
  }

  if (!userProfile) {
    return (
      <LinearGradient
        colors={['#6366f1', '#8b5cf6', '#a855f7']}
        style={styles.errorContainer}
      >
        <Ionicons name="alert-circle-outline" size={64} color="#ffffff" />
        <Text style={styles.errorText}>Erreur de chargement du profil</Text>
      </LinearGradient>
    );
  }

  if (isEditing) {
    return (
      <View style={styles.fullContainer}>
        <LinearGradient
          colors={['#6366f1', '#8b5cf6', '#a855f7']}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              onPress={() => setIsEditing(false)}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Éditer le profil</Text>
            <View style={{ width: 40 }} />
          </View>
        </LinearGradient>
        <ProfileEdit onClose={() => setIsEditing(false)} />
      </View>
    );
  }

  return (
    <View style={styles.fullContainer}>
      <LinearGradient
        colors={['#6366f1', '#8b5cf6', '#a855f7']}
        style={styles.headerGradient}
      >
        <Animated.View 
          style={[
            styles.headerContent,
            { opacity: fadeAnim }
          ]}
        >
          <Text style={styles.title}>Mon Profil</Text>
          <Text style={styles.subtitle}>
            {userProfile.first_name} {userProfile.last_name}
          </Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setIsEditing(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="create-outline" size={20} color="#6366f1" />
            <Text style={styles.editButtonText}>Éditer</Text>
          </TouchableOpacity>
        </Animated.View>
        
        <View style={styles.decorativeCircle} />
        <View style={styles.decorativeCircle2} />
      </LinearGradient>
      
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              }),
            }],
          },
        ]}
      >
        <UserProfile />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  fullContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: "#ffffff",
    fontWeight: "600",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: "#ffffff",
    textAlign: "center",
    marginTop: 16,
    fontWeight: "600",
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.34,
    shadowRadius: 6.27,
    position: 'relative',
    overflow: 'hidden',
  },
  headerContent: {
    paddingHorizontal: 24,
    alignItems: "center",
    zIndex: 2,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 20,
    color: "#e0e7ff",
    marginBottom: 20,
  },
  editButton: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  editButtonText: {
    color: "#6366f1",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
  },
  content: {
    flex: 1,
    marginTop: -20,
    zIndex: 1,
  },
  decorativeCircle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: -100,
    right: -50,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    bottom: -75,
    left: -75,
  },
});