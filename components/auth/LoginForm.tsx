import { signInWithEmail } from "@/utils/SupaLegend";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import Alert from "@/utils/Alert";
import Animated, {
    FadeIn,
    FadeInDown,
    FadeInUp,
    Layout,
    ZoomIn,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

interface LoginFormProps {
  onToggleMode: () => void;
}

export default function LoginForm({ onToggleMode }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<"email" | "password" | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Animation values
  const logoScale = useSharedValue(1);
  const logoRotation = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    // Logo breathing animation
    logoScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 2000 }),
        withTiming(1, { duration: 2000 })
      ),
      -1,
      true
    );

    // Logo rotation animation
    logoRotation.value = withRepeat(
      withTiming(360, { duration: 20000 }),
      -1,
      false
    );
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: logoScale.value },
      { rotateZ: `${logoRotation.value}deg` },
    ],
  }));

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }

    // Button press animation
    buttonScale.value = withSequence(
      withSpring(0.95),
      withSpring(1)
    );

    setLoading(true);
    try {
      await signInWithEmail(email, password);
      Alert.alert("Succès", "Connexion réussie !");
    } catch (error: any) {
      Alert.alert("Erreur de connexion", error.message);
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (type: "admin" | "family" | "senior" | "saad") => {
    const accounts = {
      admin: "admin@mycompanion.fr",
      family: "marie.dubois@gmail.com",
      senior: "suzanne.demo@senior.fr",
      saad: "saad.lyon@saad.fr",
    };

    setEmail(accounts[type]);
    setPassword("demo123");
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <LinearGradient
        colors={["#6366f1", "#8b5cf6", "#d946ef"]}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View 
            entering={FadeInUp.delay(100).duration(1000)}
            style={styles.header}
          >
            <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
              <LinearGradient
                colors={["#ffffff", "#f0f0f0"]}
                style={styles.logoGradient}
              >
                <Text style={styles.logoEmoji}>🤖</Text>
              </LinearGradient>
            </Animated.View>
            <Animated.Text 
              entering={FadeInUp.delay(200).duration(1000)}
              style={styles.title}
            >
              MyCompanion
            </Animated.Text>
            <Animated.Text 
              entering={FadeInUp.delay(300).duration(1000)}
              style={styles.subtitle}
            >
              Bienvenue dans votre espace
            </Animated.Text>
          </Animated.View>

          <Animated.View 
            entering={FadeInDown.delay(400).duration(1000)}
            style={styles.formContainer}
          >
            <BlurView intensity={20} tint="light" style={styles.form}>
              <View style={styles.inputWrapper}>
                <Animated.View 
                  entering={FadeIn.delay(500).duration(800)}
                  style={[
                    styles.inputContainer,
                    focusedInput === "email" && styles.inputContainerFocused
                  ]}
                >
                  <Text style={styles.label}>📧 Email</Text>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="votre@email.com"
                    placeholderTextColor="#9ca3af"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    onFocus={() => setFocusedInput("email")}
                    onBlur={() => setFocusedInput(null)}
                  />
                </Animated.View>

                <Animated.View 
                  entering={FadeIn.delay(600).duration(800)}
                  style={[
                    styles.inputContainer,
                    focusedInput === "password" && styles.inputContainerFocused
                  ]}
                >
                  <Text style={styles.label}>🔒 Mot de passe</Text>
                  <View style={styles.passwordInputWrapper}>
                    <TextInput
                      style={[styles.input, styles.passwordInput]}
                      value={password}
                      onChangeText={setPassword}
                      placeholder="••••••••"
                      placeholderTextColor="#9ca3af"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      onFocus={() => setFocusedInput("password")}
                      onBlur={() => setFocusedInput(null)}
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Text style={styles.eyeIcon}>
                        {showPassword ? "👁️" : "👁️‍🗨️"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              </View>

              <Animated.View 
                entering={FadeIn.delay(700).duration(800)}
                style={buttonAnimatedStyle}
              >
                <TouchableOpacity
                  onPress={handleSignIn}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={loading ? ["#9ca3af", "#6b7280"] : ["#6366f1", "#8b5cf6"]}
                    style={styles.primaryButton}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {loading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text style={styles.buttonText}>Se connecter ✨</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              <Animated.View entering={FadeIn.delay(800).duration(800)}>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={onToggleMode}
                  activeOpacity={0.8}
                >
                  <Text style={styles.secondaryButtonText}>
                    Créer un compte →
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </BlurView>
          </Animated.View>

          {/* Comptes de démonstration */}
          <Animated.View 
            entering={FadeInUp.delay(900).duration(1000)}
            style={styles.demoSection}
          >
            <BlurView intensity={15} tint="light" style={styles.demoBlur}>
              <Text style={styles.demoTitle}>🎯 Comptes de démonstration</Text>
              <View style={styles.demoButtons}>
                {[
                  { type: "admin" as const, emoji: "👑", label: "Admin" },
                  { type: "family" as const, emoji: "👨‍👩‍👧‍👦", label: "Famille" },
                  { type: "senior" as const, emoji: "👴", label: "Senior" },
                  { type: "saad" as const, emoji: "🏢", label: "SAAD" },
                ].map((account, index) => (
                  <Animated.View
                    key={account.type}
                    entering={ZoomIn.delay(1000 + index * 100).duration(500)}
                  >
                    <TouchableOpacity
                      style={styles.demoButton}
                      onPress={() => fillDemoAccount(account.type)}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={["#ffffff", "#f9fafb"]}
                        style={styles.demoButtonGradient}
                      >
                        <Text style={styles.demoButtonEmoji}>{account.emoji}</Text>
                        <Text style={styles.demoButtonText}>{account.label}</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
              <Animated.Text 
                entering={FadeIn.delay(1400).duration(800)}
                style={styles.demoPassword}
              >
                🔑 Mot de passe : demo123
              </Animated.Text>
            </BlurView>
          </Animated.View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  logoEmoji: {
    fontSize: 60,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: "rgba(255, 255, 255, 0.9)",
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  formContainer: {
    marginBottom: 20,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  form: {
    padding: 24,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },
  inputWrapper: {
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    padding: 4,
    borderWidth: 2,
    borderColor: "transparent",
    transition: "all 0.3s",
  },
  inputContainerFocused: {
    borderColor: "#8b5cf6",
    shadowColor: "#8b5cf6",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 8,
    marginLeft: 12,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: "rgba(249, 250, 251, 0.8)",
    color: "#1f2937",
  },
  passwordInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  passwordInput: {
    flex: 1,
    paddingRight: 50,
  },
  eyeButton: {
    position: "absolute",
    right: 16,
    padding: 8,
  },
  eyeIcon: {
    fontSize: 20,
  },
  primaryButton: {
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    shadowColor: "#6366f1",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  secondaryButton: {
    marginTop: 16,
    padding: 16,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#6366f1",
    fontSize: 16,
    fontWeight: "600",
  },
  demoSection: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  demoBlur: {
    padding: 20,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
  },
  demoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4b5563",
    marginBottom: 16,
    textAlign: "center",
  },
  demoButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  demoButton: {
    marginBottom: 10,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  demoButtonGradient: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 80,
    alignItems: "center",
  },
  demoButtonEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  demoButtonText: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "600",
  },
  demoPassword: {
    fontSize: 14,
    color: "#ef4444",
    fontWeight: "bold",
    textAlign: "center",
  },
});
