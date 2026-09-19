import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  useWindowDimensions,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Colors, ThemeColors } from '../constants/theme';
import { ApiConfig } from '../config/api';
import { Env } from '../config/env';

export default function LoginScreen() {
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const styles = getStyles(colors, isDark, isDesktop);

  const router = useRouter();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async () => {
    setErrorMessage(null);
    const trimmedUser = username.trim();
    const trimmedPass = password.trim();

    if (!trimmedUser) {
      setErrorMessage('Please enter your username.');
      return;
    }
    if (!trimmedPass) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await login(trimmedUser, trimmedPass);
      if (res.success) {
        router.replace('/(tabs)' as any);
      } else {
        setErrorMessage(res.error || 'Invalid username or password.');
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Unable to connect. Please check your network.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.root}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.cardContainer}>
          {/* Brand Header */}
          <View style={styles.brandContainer}>
            <Image
              source={require('../../assets/Logo.png')}
              style={styles.brandLogo}
              resizeMode="contain"
            />
            <Text style={styles.appName}>{Env.APP_NAME}</Text>
            <Text style={styles.appSub}>{Env.APP_SUBTITLE}</Text>

            <View style={styles.modeBadge}>
              <View style={styles.modeDot} />
              <Text style={styles.modeText}>Live Cloud Server</Text>
            </View>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Sign In</Text>
            <Text style={styles.formSubtitle}>Enter your credentials to access the portfolio</Text>

            {/* Error Banner */}
            {errorMessage ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color="#dc2626" style={{ marginRight: 8 }} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Username Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Username</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={18} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter username"
                  placeholderTextColor={colors.placeholder}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!submitting}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter password"
                  placeholderTextColor={colors.placeholder}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!submitting}
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
              onPress={handleLogin}
              disabled={submitting}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <View style={styles.submitBtnContent}>
                  <Text style={styles.submitBtnText}>Sign In</Text>
                  <Ionicons name="arrow-forward" size={18} color="#ffffff" style={{ marginLeft: 6 }} />
                </View>
              )}
            </TouchableOpacity>


            {/* Security Footer Note */}
            <View style={styles.securityNote}>
              <Ionicons name="shield-checkmark" size={14} color={colors.success} style={{ marginRight: 6 }} />
              <Text style={styles.securityNoteText}>256-Bit Encrypted Session Security</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const getStyles = (colors: ThemeColors, isDark: boolean, isDesktop: boolean) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: isDesktop ? 32 : 20,
    },
    cardContainer: {
      width: '100%',
      maxWidth: isDesktop ? 440 : '100%',
      alignItems: 'center',
    },
    brandContainer: {
      alignItems: 'center',
      marginBottom: 24,
    },
    brandLogo: {
      width: 72,
      height: 72,
      marginBottom: 12,
    },
    appName: {
      fontSize: 26,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: 0.5,
    },
    appSub: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    modeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 9999,
      marginTop: 10,
      gap: 6,
    },
    modeBadgeLive: {
      backgroundColor: isDark ? '#064e3b' : '#ecfdf5',
      borderWidth: 1,
      borderColor: isDark ? '#059669' : '#a7f3d0',
    },
    modeBadgeDemo: {
      backgroundColor: isDark ? '#451a03' : '#fffbeb',
      borderWidth: 1,
      borderColor: isDark ? '#d97706' : '#fde68a',
    },
    modeDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    modeDotLive: {
      backgroundColor: '#10b981',
    },
    modeDotDemo: {
      backgroundColor: '#f59e0b',
    },
    modeText: {
      fontSize: 11,
      fontWeight: '600',
    },
    modeTextLive: {
      color: isDark ? '#a7f3d0' : '#047857',
    },
    modeTextDemo: {
      color: isDark ? '#fde68a' : '#b45309',
    },
    formCard: {
      width: '100%',
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: isDesktop ? 32 : 24,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.3 : 0.08,
      shadowRadius: 16,
      elevation: 6,
    },
    formTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 4,
    },
    formSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 20,
    },
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#450a0a' : '#fef2f2',
      borderWidth: 1,
      borderColor: isDark ? '#991b1b' : '#fecaca',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 10,
      marginBottom: 16,
    },
    errorText: {
      flex: 1,
      fontSize: 12,
      color: isDark ? '#fca5a5' : '#dc2626',
      fontWeight: '500',
    },
    inputGroup: {
      marginBottom: 16,
    },
    inputLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 6,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? colors.background : '#f8fafc',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 12,
      height: 48,
    },
    inputIcon: {
      marginRight: 8,
    },
    input: {
      flex: 1,
      fontSize: 14,
      color: colors.textPrimary,
      height: '100%',
    },
    eyeBtn: {
      padding: 6,
    },
    submitBtn: {
      backgroundColor: isDark ? '#d97706' : colors.primaryDark,
      height: 48,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 8,
      shadowColor: isDark ? '#d97706' : colors.primaryDark,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 4,
    },
    submitBtnDisabled: {
      opacity: 0.6,
    },
    submitBtnContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    submitBtnText: {
      fontSize: 15,
      fontWeight: '700',
      color: '#ffffff',
    },
    demoHelper: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 16,
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.surfaceSubtle,
    },
    demoHelperText: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    securityNote: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 20,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    securityNoteText: {
      fontSize: 11,
      fontWeight: '500',
      color: colors.textSecondary,
    },
  });
