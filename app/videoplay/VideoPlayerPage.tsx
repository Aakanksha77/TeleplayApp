import { Audio, Video } from "expo-av";
import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, Dimensions } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function VideoPlayerPage() {
  const params = useLocalSearchParams();
  const videoRef = useRef<Video>(null);

  const videoUrl = params.videoUrl as string;
  const title = params.title as string;
  const description = (params.description as string) || "No description available.";
  const language = (params.language as string) || "Unknown";
  const format = (params.format as string) || "N/A";

  const screenWidth = Dimensions.get("window").width;
  const videoWidth = screenWidth * 0.55; // ✅ only 55% of screen width (smaller)
  const videoHeight = (videoWidth * 9) / 16; // keep 16:9 ratio

  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
    });
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ alignItems: "center" }}>
      {/* ✅ Smaller Centered Video */}
      <View
        style={{
          width: videoWidth,
          height: videoHeight,
          backgroundColor: "black",
          borderRadius: 12,
          overflow: "hidden",
          marginTop: 20,
        }}
      >
        <Video
          ref={videoRef}
          source={{ uri: videoUrl }}
          style={{ width: "100%", height: "100%" }}
          useNativeControls
          resizeMode="contain"
          shouldPlay
        />
      </View>

      {/* Movie Info */}
      <View style={styles.infoCard}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Language:</Text>
          <Text style={styles.metaValue}>{language}</Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Format:</Text>
          <Text style={styles.metaValue}>{format}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111" },
  infoCard: {
    backgroundColor: "#1c1c1c",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    marginTop: 20,
    width: "100%",
  },
  title: { fontSize: 20, fontWeight: "700", color: "#fff", marginBottom: 8 },
  description: { fontSize: 14, color: "#ccc", lineHeight: 20, marginBottom: 16 },
  metaRow: { flexDirection: "row", marginBottom: 8 },
  metaLabel: { fontSize: 14, color: "#aaa", fontWeight: "600", marginRight: 8 },
  metaValue: { fontSize: 14, color: "#fff" },
});
