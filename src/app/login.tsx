import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  UIManager,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Env } from '../config/env';
import { ThemeColors } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function LoginScreen() {
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isDesktop = width >= 768;
  const styles = getStyles(colors, isDark, isDesktop);

  const router = useRouter();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const usernameInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => {
      if (Platform.OS !== 'web') {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      }
      setIsKeyboardVisible(true);
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      if (Platform.OS !== 'web') {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      }
      setIsKeyboardVisible(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

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

  const isKeyboardOpenOnMobile = isKeyboardVisible && !isDesktop;

  const handleUsernameFocus = () => {
    if (!isDesktop) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }, 100);
    }
  };

  const handlePasswordFocus = () => {
    if (!isDesktop) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 120);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
      style={styles.root}
    >
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={[
          styles.scrollContent,
          isKeyboardOpenOnMobile && styles.scrollContentKeyboard,
          {
            paddingTop: isKeyboardOpenOnMobile
              ? Math.max(insets.top + 8, 16)
              : isDesktop
              ? 32
              : Math.max(insets.top + 16, 20),
            paddingBottom: isKeyboardOpenOnMobile
              ? Math.max(insets.bottom + 16, 24)
              : isDesktop
              ? 32
              : Math.max(insets.bottom + 16, 20),
          },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.touchableWrapper}>
            <View style={styles.cardContainer}>
              {/* Brand Header */}
              <View
                style={[
                  styles.brandContainer,
                  isKeyboardOpenOnMobile && styles.brandContainerKeyboard,
                ]}
              >
                <Image
                  source={require('../../assets/Logo.png')}
                  style={[
                    styles.brandLogo,
                    isKeyboardOpenOnMobile && styles.brandLogoKeyboard,
                  ]}
                  resizeMode="contain"
                />
                <Text
                  style={[
                    styles.appName,
                    isKeyboardOpenOnMobile && styles.appNameKeyboard,
                  ]}
                >
                  {Env.APP_NAME}
                </Text>

                {!isKeyboardOpenOnMobile && (
                  <>
                    <Text style={styles.appSub}>{Env.APP_SUBTITLE}</Text>
                    <View style={[styles.modeBadge, styles.modeBadgeLive]}>
                      <View style={[styles.modeDot, styles.modeDotLive]} />
                      <Text style={[styles.modeText, styles.modeTextLive]}>
                        Live Cloud Server
                      </Text>
                    </View>
                  </>
                )}
              </View>

              {/* Form Card */}
              <View
                style={[
                  styles.formCard,
                  isKeyboardOpenOnMobile && styles.formCardKeyboard,
                ]}
              >
                <Text style={styles.formTitle}>Sign In</Text>
                <Text
                  style={[
                    styles.formSubtitle,
                    isKeyboardOpenOnMobile && styles.formSubtitleKeyboard,
                  ]}
                >
                  Enter your credentials to access the portfolio
                </Text>

                {/* Error Banner */}
                {errorMessage ? (
                  <View style={styles.errorBanner}>
                    <Ionicons
                      name="alert-circle"
                      size={18}
                      color="#dc2626"
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  </View>
                ) : null}

                {/* Username Input */}
                <View
                  style={[
                    styles.inputGroup,
                    isKeyboardOpenOnMobile && styles.inputGroupKeyboard,
                  ]}
                >
                  <Text style={styles.inputLabel}>Username</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="person-outline"
                      size={18}
                      color={colors.textSecondary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      ref={usernameInputRef}
                      style={styles.input}
                      placeholder="Enter username"
                      placeholderTextColor={colors.placeholder}
                      value={username}
                      onChangeText={setUsername}
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!submitting}
                      returnKeyType="next"
                      blurOnSubmit={false}
                      onSubmitEditing={() => passwordInputRef.current?.focus()}
                      onFocus={handleUsernameFocus}
                    />
                  </View>
                </View>

                {/* Password Input */}
                <View
                  style={[
                    styles.inputGroup,
                    isKeyboardOpenOnMobile && styles.inputGroupKeyboard,
                  ]}
                >
                  <Text style={styles.inputLabel}>Password</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={18}
                      color={colors.textSecondary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      ref={passwordInputRef}
                      style={styles.input}
                      placeholder="Enter password"
                      placeholderTextColor={colors.placeholder}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      editable={!submitting}
                      returnKeyType="go"
                      onSubmitEditing={handleLogin}
                      onFocus={handlePasswordFocus}
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
                  style={[
                    styles.submitBtn,
                    submitting && styles.submitBtnDisabled,
                  ]}
                  onPress={handleLogin}
                  disabled={submitting}
                  activeOpacity={0.8}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <View style={styles.submitBtnContent}>
                      <Text style={styles.submitBtnText}>Sign In</Text>
                      <Ionicons
                        name="arrow-forward"
                        size={18}
                        color="#ffffff"
                        style={{ marginLeft: 6 }}
                      />
                    </View>
                  )}
                </TouchableOpacity>

                {/* Security Footer Note */}
                <View
                  style={[
                    styles.securityNote,
                    isKeyboardOpenOnMobile && styles.securityNoteKeyboard,
                  ]}
                >
                  <Ionicons
                    name="shield-checkmark"
                    size={14}
                    color={colors.success}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.securityNoteText}>
                    256-Bit Encrypted Session Security
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
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
    scrollContentKeyboard: {
      justifyContent: 'flex-start',
    },
    touchableWrapper: {
      width: '100%',
      alignItems: 'center',
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
    brandContainerKeyboard: {
      marginBottom: 10,
    },
    brandLogo: {
      width: 72,
      height: 72,
      marginBottom: 12,
    },
    brandLogoKeyboard: {
      width: 44,
      height: 44,
      marginBottom: 6,
    },
    appName: {
      fontSize: 26,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: 0.5,
    },
    appNameKeyboard: {
      fontSize: 20,
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
    modeDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    modeDotLive: {
      backgroundColor: '#10b981',
    },
    modeText: {
      fontSize: 11,
      fontWeight: '600',
    },
    modeTextLive: {
      color: isDark ? '#a7f3d0' : '#047857',
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
    formCardKeyboard: {
      padding: isDesktop ? 32 : 18,
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
    formSubtitleKeyboard: {
      marginBottom: 10,
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
    inputGroupKeyboard: {
      marginBottom: 12,
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
    securityNote: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 20,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    securityNoteKeyboard: {
      marginTop: 10,
      paddingTop: 8,
    },
    securityNoteText: {
      fontSize: 11,
      fontWeight: '500',
      color: colors.textSecondary,
    },
  });
