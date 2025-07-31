import { UserType, signUpMyCompanionUser } from "@/utils/SupaLegend";
import { Picker } from "@react-native-picker/picker";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    KeyboardAvoidingView,
    Dimensions,
} from "react-native";
import Animated, {
    FadeInDown,
    FadeInUp,
    FadeIn,
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    interpolate,
    Extrapolate,
    runOnJS,
    withSequence,
    withDelay,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");

interface SignUpFormProps {
  onToggleMode: () => void;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function SignUpForm({ onToggleMode }: SignUpFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [userType, setUserType] = useState<UserType>("family");
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Animation values
  const buttonScale = useSharedValue(1);
  const formProgress = useSharedValue(0);
  const logoScale = useSharedValue(0);
  const successAnimation = useSharedValue(0);

  useEffect(() => {
    // Animate logo on mount
    logoScale.value = withSpring(1, {
      damping: 10,
      stiffness: 100,
    });
    
    // Animate form progress
    formProgress.value = withTiming(1, { duration: 800 });
  }, []);

  const animatedLogoStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: logoScale.value }],
    };
  });

  const animatedButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
    };
  });

  const handleSignUp = async () => {
    if (!email || !password || !firstName || !lastName) {
      // Shake animation for error
      buttonScale.value = withSequence(
        withTiming(0.95, { duration: 50 }),
        withTiming(1.05, { duration: 50 }),
        withTiming(0.95, { duration: 50 }),
        withTiming(1, { duration: 50 })
      );
      Alert.alert("Erreur", "Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (password.length < 6) {
      buttonScale.value = withSequence(
        withTiming(0.95, { duration: 50 }),
        withTiming(1.05, { duration: 50 }),
        withTiming(0.95, { duration: 50 }),
        withTiming(1, { duration: 50 })
      );
      Alert.alert(
        "Erreur",
        "Le mot de passe doit contenir au moins 6 caractères"
      );
      return;
    }

    setLoading(true);
    buttonScale.value = withSpring(0.95);

    try {
      const result = await signUpMyCompanionUser(email, password, {
        user_type: userType,
        first_name: firstName,
        last_name: lastName,
        phone: phone || undefined,
      });

      buttonScale.value = withSpring(1);
      successAnimation.value = withSequence(
        withTiming(1, { duration: 300 }),
        withDelay(1000, withTiming(0, { duration: 300 }))
      );

      if (!result.session) {
        Alert.alert(
          "Vérification requise",
          "Veuillez vérifier votre email pour confirmer votre compte !",
          [{ text: "OK", onPress: onToggleMode }]
        );
      } else {
        Alert.alert(
          "Succès",
          `Compte ${getUserTypeLabel(userType)} créé avec succès !`
        );
      }
    } catch (error: any) {
      buttonScale.value = withSpring(1);
      Alert.alert("Erreur d'inscription", error.message);
    } finally {
      setLoading(false);
    }
  };

  const getUserTypeLabel = (type: UserType) => {
    const labels = {
      admin: "👑 Administrateur",
      senior: "👴 Senior",
      family: "👨‍👩‍👧‍👦 Famille",
      saad_admin: "🏢 Directeur SAAD",
      saad_worker: "👩‍⚕️ Auxiliaire SAAD",
      insurer: "🏛️ Assureur",
    };
    return labels[type];
  };

  const getUserTypeDescription = (type: UserType) => {
    const descriptions = {
      admin: "Accès complet à la plateforme",
      senior: "Bénéficiaire des appels MyCompanion",
      family: "Proche d'un senior, reçoit les rapports",
      saad_admin: "Directeur d'un service d'aide à domicile",
      saad_worker: "Auxiliaire de vie à domicile",
      insurer: "Représentant d'une compagnie d'assurance",
    };
    return descriptions[type];
  };

  const getUserTypeColor = (type: UserType) => {
    const colors = {
      admin: "#f59e0b",
      senior: "#3b82f6",
      family: "#10b981",
      saad_admin: "#8b5cf6",
      saad_worker: "#ec4899",
      insurer: "#6366f1",
    };
    return colors[type];
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View 
          style={[styles.header, animatedLogoStyle]}
        >
          <Animated.View
            entering={FadeIn.duration(600).delay(200)}
            style={styles.logoContainer}
          >
            <Text style={styles.logo}>🤖</Text>
            <View style={styles.logoGlow} />
          </Animated.View>
          
          <Animated.Text 
            entering={FadeInUp.duration(600).delay(400)}
            style={styles.title}
          >
            MyCompanion
          </Animated.Text>
          <Animated.Text 
            entering={FadeInUp.duration(600).delay(600)}
            style={styles.subtitle}
          >
            Créez votre compte en quelques secondes
          </Animated.Text>
        </Animated.View>

        <View style={styles.form}>
          {/* Type de compte */}
          <Animated.View 
            entering={FadeInDown.duration(500).delay(100)}
            style={[
              styles.inputContainer,
              { borderColor: userType ? getUserTypeColor(userType) : "#e5e7eb" }
            ]}
          >
            <Text style={styles.label}>Type de compte</Text>
            <View style={[
              styles.pickerContainer,
              { borderColor: userType ? getUserTypeColor(userType) : "#e5e7eb" }
            ]}>
              <Picker
                selectedValue={userType}
                onValueChange={setUserType}
                style={styles.picker}
                mode="dropdown"
                dropdownIconColor={getUserTypeColor(userType)}
              >
                <Picker.Item
                  label={getUserTypeLabel("family")}
                  value="family"
                  color="#374151"
                />
                <Picker.Item
                  label={getUserTypeLabel("senior")}
                  value="senior"
                  color="#374151"
                />
                <Picker.Item
                  label={getUserTypeLabel("saad_admin")}
                  value="saad_admin"
                  color="#374151"
                />
                <Picker.Item
                  label={getUserTypeLabel("saad_worker")}
                  value="saad_worker"
                  color="#374151"
                />
                <Picker.Item
                  label={getUserTypeLabel("admin")}
                  value="admin"
                  color="#374151"
                />
              </Picker>
            </View>
            <Animated.Text 
              entering={FadeIn.duration(300).delay(200)}
              style={[styles.typeDescription, { color: getUserTypeColor(userType) }]}
            >
              {getUserTypeDescription(userType)}
            </Animated.Text>
          </Animated.View>

          {/* Email */}
          <Animated.View 
            entering={FadeInDown.duration(500).delay(200)}
            style={[
              styles.inputContainer,
              focusedInput === 'email' && styles.inputContainerFocused
            ]}
          >
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>📧</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="votre@email.com"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => setFocusedInput('email')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>
          </Animated.View>

          {/* Mot de passe */}
          <Animated.View 
            entering={FadeInDown.duration(500).delay(300)}
            style={[
              styles.inputContainer,
              focusedInput === 'password' && styles.inputContainerFocused
            ]}
          >
            <Text style={styles.label}>Mot de passe</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                onFocus={() => setFocusedInput('password')}
                onBlur={() => setFocusedInput(null)}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Text>{showPassword ? '👁️' : '🔐'}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.hint}>Minimum 6 caractères</Text>
          </Animated.View>

          {/* Prénom */}
          <Animated.View 
            entering={FadeInDown.duration(500).delay(400)}
            style={[
              styles.inputContainer,
              focusedInput === 'firstName' && styles.inputContainerFocused
            ]}
          >
            <Text style={styles.label}>Prénom</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>👤</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Jean"
                placeholderTextColor="#9ca3af"
                onFocus={() => setFocusedInput('firstName')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>
          </Animated.View>

          {/* Nom */}
          <Animated.View 
            entering={FadeInDown.duration(500).delay(500)}
            style={[
              styles.inputContainer,
              focusedInput === 'lastName' && styles.inputContainerFocused
            ]}
          >
            <Text style={styles.label}>Nom</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>👥</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Dupont"
                placeholderTextColor="#9ca3af"
                onFocus={() => setFocusedInput('lastName')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>
          </Animated.View>

          {/* Téléphone */}
          <Animated.View 
            entering={FadeInDown.duration(500).delay(600)}
            style={[
              styles.inputContainer,
              focusedInput === 'phone' && styles.inputContainerFocused
            ]}
          >
            <Text style={styles.label}>Téléphone (optionnel)</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>📱</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="+33 1 23 45 67 89"
                placeholderTextColor="#9ca3af"
                keyboardType="phone-pad"
                onFocus={() => setFocusedInput('phone')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInUp.duration(500).delay(700)}>
            <AnimatedTouchableOpacity
              style={[
                styles.button, 
                styles.primaryButton,
                animatedButtonStyle,
                { backgroundColor: getUserTypeColor(userType) }
              ]}
              onPress={handleSignUp}
              disabled={loading}
              onPressIn={() => {
                buttonScale.value = withSpring(0.95);
              }}
              onPressOut={() => {
                buttonScale.value = withSpring(1);
              }}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Créer mon compte</Text>
                  <Text style={styles.buttonEmoji}>✨</Text>
                </>
              )}
            </AnimatedTouchableOpacity>
          </Animated.View>

          <Animated.View entering={FadeInUp.duration(500).delay(800)}>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={onToggleMode}
            >
              <Text style={styles.secondaryButtonText}>
                J'ai déjà un compte
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View 
            entering={FadeIn.duration(500).delay(900)}
            style={styles.footer}
          >
            <Text style={styles.footerText}>
              En créant un compte, vous acceptez nos
            </Text>
            <View style={styles.linksContainer}>
              <TouchableOpacity>
                <Text style={styles.link}>Conditions d'utilisation</Text>
              </TouchableOpacity>
              <Text style={styles.footerText}> et notre </Text>
              <TouchableOpacity>
                <Text style={styles.link}>Politique de confidentialité</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 40,
  },
  logoContainer: {
    position: "relative",
    marginBottom: 16,
  },
  logo: {
    fontSize: 60,
    textAlign: "center",
  },
  logoGlow: {
    position: "absolute",
    top: 10,
    left: -20,
    right: -20,
    bottom: -10,
    backgroundColor: "#4f46e5",
    opacity: 0.1,
    borderRadius: 30,
    transform: [{ scale: 1.2 }],
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
  },
  form: {
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 24,
    borderRadius: 16,
    padding: 4,
    borderWidth: 2,
    borderColor: "transparent",
    transition: "all 0.3s ease",
  },
  inputContainerFocused: {
    borderColor: "#4f46e5",
    shadowColor: "#4f46e5",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    backgroundColor: "#f9fafb",
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1f2937",
    height: "100%",
  },
  eyeButton: {
    padding: 8,
    marginLeft: 8,
  },
  pickerContainer: {
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    backgroundColor: "#f9fafb",
    overflow: "hidden",
    ...Platform.select({
      ios: {},
      android: {
        minHeight: 56,
      },
      web: {
        height: 56,
      },
    }),
  },
  picker: {
    color: "#374151",
    ...Platform.select({
      ios: {
        height: 180,
        color: "#374151",
      },
      android: {
        height: 56,
        color: "#374151",
        backgroundColor: "transparent",
      },
      web: {
        height: 56,
        color: "#374151",
        border: "none",
        outline: "none",
        backgroundColor: "transparent",
      },
    }),
  },
  typeDescription: {
    fontSize: 13,
    fontWeight: "500",
    fontStyle: "italic",
    marginTop: 6,
    marginLeft: 4,
  },
  hint: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 6,
    marginLeft: 4,
  },
  button: {
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  primaryButton: {
    backgroundColor: "#4f46e5",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#e5e7eb",
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    marginRight: 8,
  },
  buttonEmoji: {
    fontSize: 20,
  },
  secondaryButtonText: {
    color: "#6b7280",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    marginTop: 24,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: "#9ca3af",
    textAlign: "center",
  },
  linksContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 4,
  },
  link: {
    fontSize: 12,
    color: "#4f46e5",
    fontWeight: "600",
  },
});
