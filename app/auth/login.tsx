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
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

type Extra = {
  BASE_URL: string;
};
const extra = Constants.expoConfig?.extra as Extra;

export default function LoginScreen() {
  const BASE_URL = extra.BASE_URL;
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkToken = async () => {
      const token = await SecureStore.getItemAsync('userToken');
      if (token) router.replace('/menu');
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

      if (response.ok && result.token) {
        await SecureStore.setItemAsync('userId', String(result.channel.id));
        await SecureStore.setItemAsync('userName', result.name || '');
        await SecureStore.setItemAsync('userEmail', result.channel?.email || '');
        await SecureStore.setItemAsync('userData', JSON.stringify(result.channel || {}));
        await SecureStore.setItemAsync('userToken', result.token);

        router.replace('/menu');
      } else {
        Alert.alert('Error', result.message || 'Login failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#000" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.title}>Login</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.welcomeTitle}>Welcome Back</Text>

        {/* Email Input */}
        <View style={styles.inputContainer}>
          <Mail size={20} color="#0088cc" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor="#8e8e93"
            value={formData.email}
            onChangeText={value => handleInputChange('email', value)}
            keyboardType="email-address"
            cursorColor="#0088cc"
          />
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <Lock size={20} color="#0088cc" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#8e8e93"
            value={formData.password}
            onChangeText={value => handleInputChange('password', value)}
            secureTextEntry={!showPassword}
            cursorColor="#0088cc"
            
          />
          <TouchableOpacity onPress={() => setShowPassword(prev => !prev)}>
            {showPassword ? (
              <EyeOff size={20} color="#8e8e93" />
            ) : (
              <Eye size={20} color="#8e8e93" />
            )}
          </TouchableOpacity>
        </View>

        {/* Login Button */}
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

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don’t have an account?</Text>
          <TouchableOpacity onPress={() => router.push('/auth/signup')}>
            <Text style={styles.signupLink}> Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 35,
    paddingHorizontal: 20,
  },
  backButton: { marginRight: 10 },
  title: { color: '#000', fontSize: 20, fontWeight: '600' },
  content: { flex: 1, paddingHorizontal: 20 },
  welcomeTitle: { color: '#000', fontSize: 22, fontWeight: '700', marginBottom: 20, textAlign: 'center' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 15,
    height: 50,
  },
  icon: { marginRight: 8 },
  input: { flex: 1, color: '#fff', fontSize: 16 },
  loginButton: {
    backgroundColor: '#0088cc',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerText: { color: '#8e8e93', fontSize: 14 },
  signupLink: { color: '#0088cc', fontSize: 14, fontWeight: '600' },
});
