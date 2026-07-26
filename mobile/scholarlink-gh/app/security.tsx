import React, { useState } from 'react';
import { router, Stack } from 'expo-router';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';

export default function SecurityScreen() {
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);

  const isPasswordValid = newPassword.length >= 8 && newPassword.length <= 72 && /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(newPassword);
  
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New password and confirm password do not match.');
      return;
    }
    
    if (!isPasswordValid) {
      Alert.alert('Error', 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const message = await authService.changePassword(currentPassword, newPassword);
      Alert.alert('Success', message, [
        { text: 'OK', onPress: () => signOut() }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Could not change password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogoutAllDevices = () => {
    Alert.alert(
      'Logout All Devices',
      'This will sign you out on all devices. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Continue', 
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOutAll(true);
            try {
              await authService.logoutAllDevices();
              signOut();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Could not logout all devices.');
            } finally {
              setIsLoggingOutAll(false);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Security & Password</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Change Password Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Change Password</Text>
          <Text style={styles.sectionSubtitle}>
            Update your password to keep your account secure.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Current Password</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
              placeholderTextColor={colors.muted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>New Password</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password"
              placeholderTextColor={colors.muted}
            />
            {newPassword.length > 0 && !isPasswordValid && (
              <Text style={styles.errorText}>
                Must contain at least one uppercase, lowercase, number, and special character.
              </Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm New Password</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
              placeholderTextColor={colors.muted}
            />
          </View>

          <Pressable 
            style={[styles.primaryButton, isChangingPassword && styles.buttonDisabled]} 
            onPress={handleChangePassword}
            disabled={isChangingPassword}
          >
            {isChangingPassword ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.primaryButtonText}>Update Password</Text>
            )}
          </Pressable>
        </View>

        {/* Device Management Placeholder */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Device Management</Text>
          <Text style={styles.sectionSubtitle}>
            Sign out of all other active sessions across your devices.
          </Text>
          
          <Pressable 
            style={[styles.dangerButton, isLoggingOutAll && styles.buttonDisabled]} 
            onPress={handleLogoutAllDevices}
            disabled={isLoggingOutAll}
          >
            {isLoggingOutAll ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <View style={styles.dangerButtonContent}>
                <Ionicons name="log-out-outline" size={20} color={colors.danger} />
                <Text style={styles.dangerButtonText}>Logout All Devices</Text>
              </View>
            )}
          </Pressable>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    minHeight: 56,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 18,
    color: colors.ink,
  },
  scrollContent: {
    padding: 24,
  },
  section: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 20,
    color: colors.ink,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 14,
    color: colors.muted,
    marginBottom: 24,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontFamily: 'BeVietnamPro_600SemiBold',
    fontSize: 14,
    color: colors.ink,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    color: colors.ink,
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 16,
  },
  errorText: {
    color: colors.danger,
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 12,
    marginTop: 4,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    fontFamily: 'BeVietnamPro_600SemiBold',
    color: '#ffffff',
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  dangerButton: {
    backgroundColor: '#fff0f0',
    borderWidth: 1,
    borderColor: '#ffc1c1',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  dangerButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dangerButtonText: {
    fontFamily: 'BeVietnamPro_600SemiBold',
    color: colors.danger,
    fontSize: 16,
  },
});
