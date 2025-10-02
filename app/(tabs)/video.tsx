import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Trash2 } from 'lucide-react-native';

export default function VideoScreen() {
  const [history, setHistory] = useState<any[]>([]);

  // Load watch history when screen mounts
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const saved = await AsyncStorage.getItem("watchHistory");
        if (saved) setHistory(JSON.parse(saved));
      } catch (err) {
        console.error("Error loading watch history:", err);
      }
    };
    loadHistory();
  }, []);

  // Remove a video from history
  const removeFromHistory = async (id: string) => {
    try {
      const newHistory = history.filter(h => h.id !== id);
      setHistory(newHistory);
      await AsyncStorage.setItem("watchHistory", JSON.stringify(newHistory));
    } catch (err) {
      console.error("Error removing video from history:", err);
    }
  };

  // Render each video item
  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.videoCard}>
      <Image
        source={{ uri: item.thumbnail || "https://placehold.co/100x60" }}
        style={styles.thumbnail}
      />
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{item.title || "Untitled Video"}</Text>
        <Text style={styles.time}>
          Watched on {new Date(item.watchedAt).toLocaleString()}
        </Text>
      </View>
      <TouchableOpacity onPress={() => removeFromHistory(item.id)} style={styles.deleteButton}>
        <Trash2 size={20} color="#ff4d4f" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Watch History</Text>
      {history.length === 0 ? (
        <Text>No videos watched yet</Text>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item, index) => item.id + index.toString()}
          renderItem={renderItem}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  header: { fontSize: 20, fontWeight: "bold", marginBottom: 16 },
  videoCard: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  thumbnail: { width: 100, height: 60, marginRight: 12, borderRadius: 8 },
  title: { fontSize: 14, fontWeight: "600" },
  time: { fontSize: 12, color: "#666" },
  deleteButton: { padding: 8 },
});
