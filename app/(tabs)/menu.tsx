import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { User, Heart, Download, LogOut, Info, MessageSquare, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

export default function MenuScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Check for JWT and user info on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await SecureStore.getItemAsync('userToken');
        const name = await SecureStore.getItemAsync('userName');
        const email = await SecureStore.getItemAsync('userEmail');

        if (!token) {
          Alert.alert('Unauthorized', 'Please login first', [
            { text: 'OK', onPress: () => router.replace('/auth/login') },
          ]);
        } else {
          setUserName(name);
          setUserEmail(email);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        Alert.alert('Error', 'Failed to verify login. Please login again.', [
          { text: 'OK', onPress: () => router.replace('/auth/login') },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleSignOut = async () => {
    try {
      await SecureStore.deleteItemAsync('userToken');
      await SecureStore.deleteItemAsync('userName');
      await SecureStore.deleteItemAsync('userEmail');
      router.replace('/auth/login');
    } catch (error) {
      console.error('Sign out error:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  const menuItems = [
    { title: 'Create Channel', icon: Heart, color: '#000000', onPress: () => Alert.alert('Create Channel', 'Coming Soon!') },
    { title: 'Downloads', icon: Download, color: '#000000', onPress: () => router.push('/download') },
    { title: 'About', icon: Info, color: '#000000', onPress: () => Alert.alert('Create Channel', 'Coming Soon!') },
    { title: 'Help & Feedback', icon: MessageSquare, color: '#000000', onPress: () => router.push('/help-feedback') },
    { title: 'Sign Out', icon: LogOut, color: '#ff4d4d', onPress: handleSignOut },
  ];

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0088cc" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <View style={styles.userCard}>
        <View style={styles.avatar}>
          <User size={28} color="#fff" strokeWidth={2} />
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{userName ?? 'User'}</Text>
          <Text style={styles.userEmail}>{userEmail ?? 'No Email'}</Text>
        </View>
      </View>

      <View style={styles.menuSection}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIcon, { backgroundColor: `${item.color}20` }]}>
              <item.icon size={20} color={item.color} strokeWidth={2} />
            </View>
            <Text style={styles.menuText}>{item.title}</Text>
            <ChevronRight size={20} color="#8e8e93" strokeWidth={2} />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff', marginTop: 10  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f0f23' },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0088cc',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#0088cc',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0088cc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userInfo: { flex: 1 },
  userName: { fontSize: 20, fontWeight: '600', color: '#fff', marginBottom: 4 },
  userEmail: { fontSize: 14, color: '#e0e0e0' },
  menuSection: {},
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuText: { flex: 1, fontSize: 16, fontWeight: '500', color: '#000000' },
});
