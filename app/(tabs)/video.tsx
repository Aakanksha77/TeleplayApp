import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Play, TrendingUp, Clock } from 'lucide-react-native';

export default function VideoScreen() {
  const videoCategories = [
    { title: 'Trending', icon: TrendingUp, count: '2.4K videos' },
    { title: 'Recently Added', icon: Clock, count: '156 videos' },
    { title: 'Music Videos', icon: Play, count: '892 videos' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Videos</Text>
        <Text style={styles.subtitle}>Watch and discover</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {videoCategories.map((category, index) => (
          <TouchableOpacity key={index} style={styles.categoryCard}>
            <View style={styles.categoryIcon}>
              <category.icon size={24} color="#0088cc" strokeWidth={2} />
            </View>
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryTitle}>{category.title}</Text>
              <Text style={styles.categoryCount}>{category.count}</Text>
            </View>
            <Play size={20} color="#8e8e93" strokeWidth={2} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#8e8e93',
    fontWeight: '400',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0088cc',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#0088cc',
  },
  categoryIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 14,
    color: '#8e8e93',
  },
});