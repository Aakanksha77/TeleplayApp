<<<<<<< HEAD
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import * as FileSystem from 'expo-file-system/legacy';
import { Ionicons } from '@expo/vector-icons';


type DownloadItem = {
  title: string;
  uri: string;
};


export default function DownloadScreen() {
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchDownloads = async () => {
      try {
        const stored = await AsyncStorage.getItem("downloads");
        const items = stored ? JSON.parse(stored) : [];
        setDownloads(items);
      } catch (err) {
        console.error("Error fetching downloads:", err);
      }
    };

    fetchDownloads();
  }, []);

  const playVideo = (item: DownloadItem) => {
    // Navigate to the VideoPlayerPage with local URI
    router.push({
      pathname: "/videoplay/VideoPlayerPage",
      params: {
        videoUrl: item.uri,
        title: item.title,
        description: "Downloaded Video",
        language: "N/A",
        format: "mp4",
      },
    });
  };

const deleteVideo = async (item: DownloadItem) => {
  Alert.alert("Delete Video", `Are you sure you want to delete "${item.title}"?`, [
    { text: "Cancel", style: "cancel" },
    {
      text: "Delete",
      style: "destructive",
      onPress: async () => {
        try {
          // Delete file using legacy API
          await FileSystem.deleteAsync(item.uri, { idempotent: true });

          // Update state and AsyncStorage
          const updated = downloads.filter((d) => d.uri !== item.uri);
          setDownloads(updated);
          await AsyncStorage.setItem("downloads", JSON.stringify(updated));
        } catch (err) {
          console.error("Delete error:", err);
          Alert.alert("Error", "Unable to delete video.");
        }
      },
    },
  ]);
};


  if (downloads.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Downloads</Text>
        </View>

        <View style={styles.centered}>
          <Text style={{ color: "#ccc" }}>No downloaded videos yet.</Text>
        </View>
      </View>
    );
  }

  return (
       <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Downloads</Text>
      </View>

      <FlatList
        data={downloads}
        keyExtractor={(item) => item.uri}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.title}>{item.title}</Text>
            <View style={styles.buttons}>
              <TouchableOpacity style={styles.iconBtn} onPress={() => playVideo(item)}>
                <Ionicons name="play-circle" size={28} color="#4ea1ff" />
                <Text style={styles.btnText}>Play</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => deleteVideo(item)}>
                <Ionicons name="trash" size={28} color="#ff4d4d" />
                <Text style={styles.btnText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        contentContainerStyle={{ padding: 16 }}
      />
    </View>
=======
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { Download, Play } from 'lucide-react-native';

export default function DownloadScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.downloadButton}>
          <Download size={24} color="white" />
          <Text style={styles.buttonText}>Find in Download</Text>
        </TouchableOpacity>

        <View style={styles.fileCard}>
          <Play size={24} color="white" style={styles.playIcon} />
          <View style={styles.fileInfo}>
            <Text style={styles.fileName}>Jawan.2023.720p.webrip.x26xxxxx.mp4</Text>
            <Text style={styles.fileStatus}>Seeding</Text>
            <Text style={styles.fileProgress}>0.00KB/s (0%)</Text>
          </View>
          <View style={styles.fileStats}>
            <Text style={styles.fileSize}>0.0KB/s</Text>
            <Text style={styles.fileTime}>00:00:00</Text>
          </View>
        </View>
      </View>

      <Text style={styles.findDownloadText}>Find Download File</Text>
    </SafeAreaView>
>>>>>>> 9f4fdb4c1dc6caddaeab46234ab917af46291de6
  );
}

const styles = StyleSheet.create({
<<<<<<< HEAD
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    height: 60,
    marginTop: 30,
    marginLeft: 16,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
  },
  headerTitle: { color: "#1c1c1c", fontSize: 20, fontWeight: "700" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  item: {
    backgroundColor: "#1c1c1c",
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
  },
  title: { color: "#fff", fontSize: 16, fontWeight: "600", marginBottom: 12 },
  buttons: { flexDirection: "row", justifyContent: "space-between" },
  iconBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  btnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
=======
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingTop: 20,
    marginTop: 10,
  },
  buttonContainer: {
    width: '90%',
    alignItems: 'center',
  },
  downloadButton: {
    flexDirection: 'row',
    backgroundColor: '#0088cc',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  fileCard: {
    flexDirection: 'row',
    backgroundColor: '#0088cc',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
  },
  playIcon: {
    marginRight: 15,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fileStatus: {
    color: 'white',
    fontSize: 14,
  },
  fileProgress: {
    color: 'white',
    fontSize: 14,
  },
  fileStats: {
    alignItems: 'flex-end',
  },
  fileSize: {
    color: 'white',
    fontSize: 14,
  },
  fileTime: {
    color: 'white',
    fontSize: 14,
  },
  findDownloadText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 50,
    color: '#333',
  },
>>>>>>> 9f4fdb4c1dc6caddaeab46234ab917af46291de6
});