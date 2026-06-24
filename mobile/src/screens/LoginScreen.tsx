import React, { useState } from 'react';
import { View, Text, TextInput, Button, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { Colors, Spacing } from '../utils/theme';

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loading: authLoading, error } = useAuth();
  const navigation = useNavigation();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Validation Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      // Navigate to home screen after successful login
      navigation.navigate('Home');
    } catch (err) {
      // Error is already handled by the hook
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: Spacing.md, backgroundColor: '#fff' }}>
      {!authLoading ? (
        <>
          <Text style={{ textAlign: 'center', marginBottom: Spacing.lg, fontSize: 24, fontWeight: '600', color: Colors.primary }}>
            Engine Fault Detector
          </Text>
          
          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={{
              borderWidth: 1,
              borderColor: '#ddd',
              borderRadius: 4,
              padding: Spacing.md,
              marginBottom: Spacing.sm,
            }}
          />
          
          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={{
              borderWidth: 1,
              borderColor: '#ddd',
              borderRadius: 4,
              padding: Spacing.md,
              marginBottom: Spacing.lg,
            }}
          />
          
          <Button
            title="Login"
            onPress={handleLogin}
            color={Colors.primary}
            disabled={loading}
          />
          
          {loading && (
            <ActivityIndicator size="small" color={Colors.primary} style={{ marginTop: Spacing.sm }} />
          )}
          
          {error && (
            <Text style={{ color: Colors.error, marginTop: Spacing.sm, textAlign: 'center' }}>
              {error}
            </Text>
          )}
        </>
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={{ marginTop: Spacing.sm, color: Colors.textSecondary }}>Loading...</Text>
        </View>
      )}
    </View>
  );
};

export default LoginScreen;
