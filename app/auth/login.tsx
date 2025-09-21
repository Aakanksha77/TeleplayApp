import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ArrowLeft, Mail, Lock } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

type Extra = {
  BASE_URL: string;
};
const extra = Constants.expoConfig?.extra as Extra;

export default function LoginScreen() {
  const BASE_URL = extra.BASE_URL;
  console.log('BASE_URL:', BASE_URL);

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Auto-login if token exists
  useEffect(() => {
    const checkToken = async () => {
      const token = await SecureStore.getItemAsync('userToken');
      if (token) router.replace('/menu'); // Redirect if JWT exists
    };
    checkToken();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogin = async () => {
    const { email, password } = formData;
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/user/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();
      console.log('Login result:', result);

      if (response.ok && result.token) {
        // Store user info + JWT token
        await SecureStore.setItemAsync('userId', String(result.channel.id));
        await SecureStore.setItemAsync('userName', result.name || '');
        await SecureStore.setItemAsync('userEmail', result.channel?.email || '');
        await SecureStore.setItemAsync('userData', JSON.stringify(result.channel || {})); // Store full user object
        await SecureStore.setItemAsync('userToken', result.token);

        router.replace('/menu'); // Redirect to home/menu

        const storedId = await SecureStore.getItemAsync('userId');
        console.log("Stored userId after login:", storedId);

      } else {
        Alert.alert('Error', result.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login Error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };





  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#fff" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.title}>LOGIN</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.welcomeTitle}>Welcome Back!</Text>
        <Text style={styles.welcomeSubtitle}>Sign in to your account</Text>

        <View style={styles.inputContainer}>
          <Mail size={20} color="#0088cc" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor="#8e8e93"
            value={formData.email}
            onChangeText={value => handleInputChange('email', value)}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Lock size={20} color="#0088cc" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#8e8e93"
            value={formData.password}
            onChangeText={value => handleInputChange('password', value)}
            secureTextEntry
          />
        </View>

        <TouchableOpacity style={styles.forgotPassword}>
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginButtonText}>Login</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/auth/signup')}>
            <Text style={styles.signupLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    backgroundColor: '#ffffff',
  },
  backButton: { position: 'absolute', left: 15, padding: 5 },
  title: { color: '#000', fontSize: 20, fontWeight: '700' },
  content: { flex: 1, padding: 20 },
  welcomeTitle: { color: '#000', fontSize: 24, fontWeight: '700', marginBottom: 4 },
  welcomeSubtitle: { color: '#8e8e93', fontSize: 16, marginBottom: 20 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 15,
    height: 50,
  },
  icon: { marginRight: 10 },
  input: { flex: 1, color: '#000000', fontSize: 16 },
  forgotPassword: { alignSelf: 'flex-end', marginBottom: 20 },
  forgotPasswordText: { color: '#0088cc', fontSize: 14, fontWeight: '500' },
  loginButton: {
    backgroundColor: '#0088cc',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  loginButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { color: '#8e8e93', fontSize: 14 },
  signupLink: { color: '#0088cc', fontSize: 14, fontWeight: '500', marginLeft: 4 },
});
