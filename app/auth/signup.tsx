import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { ArrowLeft, User, Mail, Phone, Lock, Shield } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

type Extra = {
  BASE_URL: string;
};
const extra = Constants.expoConfig?.extra as Extra;

export default function SignUpScreen() {
  const BASE_URL = extra.BASE_URL;
  console.log('BASE_URL:', BASE_URL);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    otp: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [otpVerificationFailed, setOtpVerificationFailed] = useState(false);
  const [timer, setTimer] = useState(0);
  const [canResendOtp, setCanResendOtp] = useState(false);
  const router = useRouter();

  // Timer effect for OTP resend
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (otpSent && timer > 0) {
      interval = setTimeout(() => setTimer(prev => prev - 1), 1000);
    } else if (timer === 0 && otpSent) setCanResendOtp(true);
    return () => interval && clearTimeout(interval);
  }, [otpSent, timer]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const sendOTP = async () => {
    if (!formData.email) return Alert.alert('Error', 'Please enter your email');

    setIsLoading(true);
    setOtpVerificationFailed(false);
    setCanResendOtp(false);
    setTimer(60);

    try {
      const response = await fetch(`${BASE_URL}/sendOTP`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });

      const result = await response.json();

      if (response.ok) {
        setOtpSent(true);
        Alert.alert('Success', 'OTP sent to your email');
      } else {
        Alert.alert('Error', result.message || 'Failed to send OTP');
        setTimer(0);
        setCanResendOtp(true);
      }
    } catch (error) {
      console.error('Send OTP Error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
      setTimer(0);
      setCanResendOtp(true);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!formData.otp) return Alert.alert('Error', 'Please enter the OTP');

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:9898/verifyOTP', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp: formData.otp }),
      });

      const result = await response.json();

      if (response.ok) {
        setIsOtpVerified(true);
        setOtpVerificationFailed(false);
        Alert.alert('Success', 'OTP verified! You can now sign up.');
      } else {
        setOtpVerificationFailed(true);
        Alert.alert('Error', result.message || 'Invalid OTP');
      }
    } catch (error) {
      console.error('Verify OTP Error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    const { name, email, phone, password } = formData;
    if (!name || !email || !phone || !password)
      return Alert.alert('Error', 'Please fill in all fields');
    if (!isOtpVerified) return Alert.alert('Error', 'Please verify OTP first');

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:9898/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password }),
      });

      const result = await response.json();

      if (response.ok && result.token) {
        // Store user info + JWT token
        await SecureStore.setItemAsync('userName', name);
        await SecureStore.setItemAsync('userEmail', email);
        await SecureStore.setItemAsync('userToken', result.token);

        router.replace('/menu'); // Navigate directly to Menu/Home
      } else {
        Alert.alert('Error', result.message || 'Registration failed');
      }
    } catch (error) {
      console.error('SignUp Error:', error);
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
        <Text style={styles.title}>SIGN UP</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Name Input */}
        <View style={styles.inputContainer}>
          <User size={20} color="#0088cc" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Name"
            placeholderTextColor="#8e8e93"
            value={formData.name}
            onChangeText={text => handleInputChange('name', text)}
          />
        </View>

        {/* Email Input + OTP */}
        <View style={styles.inputContainer}>
          <Mail size={20} color="#0088cc" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#8e8e93"
            value={formData.email}
            onChangeText={text => handleInputChange('email', text)}
            editable={!otpSent}
          />
          {!otpSent && (
            <TouchableOpacity style={styles.otpButton} onPress={sendOTP} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.otpButtonText}>Send OTP</Text>}
            </TouchableOpacity>
          )}
        </View>

        {otpSent && timer > 0 && <Text style={styles.timerText}>Resend OTP in {timer}s</Text>}

        {otpSent && (
          <View style={styles.inputContainer}>
            <Shield size={20} color="#0088cc" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Enter OTP"
              placeholderTextColor="#8e8e93"
              value={formData.otp}
              onChangeText={text => handleInputChange('otp', text)}
              keyboardType="numeric"
              maxLength={6}
            />
            <TouchableOpacity
              style={styles.otpButton}
              onPress={otpVerificationFailed || canResendOtp ? sendOTP : verifyOTP}
              disabled={isLoading}
            >
              {isLoading ? <ActivityIndicator color="#fff" /> : (
                <Text style={styles.otpButtonText}>{otpVerificationFailed || canResendOtp ? 'Resend OTP' : 'Verify OTP'}</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Phone Input */}
        <View style={styles.inputContainer}>
          <Phone size={20} color="#0088cc" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            placeholderTextColor="#8e8e93"
            value={formData.phone}
            onChangeText={text => handleInputChange('phone', text)}
            keyboardType="phone-pad"
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
            onChangeText={text => handleInputChange('password', text)}
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={[styles.signUpButton, !isOtpVerified && styles.buttonDisabled]}
          onPress={handleSignUp}
          disabled={!isOtpVerified || isLoading}
        >
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.signUpButtonText}>Sign Up</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, backgroundColor: '#ffffff' },
  backButton: { position: 'absolute', left: 15, padding: 5 },
  title: { color: '#000000', fontSize: 20, fontWeight: '700' },
  content: { flex: 1, padding: 20 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 12, borderWidth:1, marginBottom: 15, paddingHorizontal: 15, height: 50 },
  icon: { marginRight: 10 },
  input: { flex: 1, color: '#000000', fontSize: 16 },
  otpButton: { backgroundColor: '#0088cc', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, marginLeft: 10 },
  otpButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  timerText: { color: '#fff', textAlign: 'center', marginBottom: 10 },
  signUpButton: { backgroundColor: '#0088cc', borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 10 },
  signUpButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  buttonDisabled: { opacity: 0.6 },
});
