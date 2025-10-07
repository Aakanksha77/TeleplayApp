// app/videoplay/VideoPlayerPage.tsx
import React, { useEffect, useRef, useState } from "react";
import { Audio, Video as ExpoVideo, VideoFullscreenUpdate } from "expo-av";
import * as ScreenOrientation from "expo-screen-orientation";
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function VideoPlayerPage() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const videoRef = useRef<ExpoVideo | null>(null);

  const videoUrl = (params.videoUrl as string) || "";
  const title = (params.title as string) || "Untitled";
  const description = (params.description as string) || "No description available.";
  const language = (params.language as string) || "Unknown";
  const format = (params.format as string) || "N/A";

  const [expanded, setExpanded] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const downloadRef = useRef<FileSystem.DownloadResumable | null>(null);

  const screenWidth = Dimensions.get("window").width;
  const videoWidth = Math.min(screenWidth * 0.95, 1000);
  const videoHeight = (videoWidth * 9) / 16;

  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
    });

    return () => {
      (async () => {
        try {
          await videoRef.current?.pauseAsync?.();
        } catch {}
      })();
    };
  }, []);

  // Seek function
  const seekVideo = async (direction: "forward" | "backward") => {
    try {
      const status: any = await videoRef.current?.getStatusAsync();
      if (status?.isLoaded) {
        let newPos =
          direction === "forward"
            ? status.positionMillis + 10000
            : status.positionMillis - 10000;
        if (newPos < 0) newPos = 0;
        if (newPos > status.durationMillis) newPos = status.durationMillis;
        await videoRef.current?.setPositionAsync(newPos);
      }
    } catch (e) {
      console.warn("Seek error:", e);
    }
  };

  // Download video
  const downloadVideo = async () => {
    try {
      setIsDownloading(true);
      setDownloadProgress(0);

      const fileUri = FileSystem.documentDirectory + title.replace(/\s+/g, "_") + ".mp4";

      const downloadResumable = FileSystem.createDownloadResumable(
        videoUrl,
        fileUri,
        {},
        (progress) => {
          const percentage = progress.totalBytesWritten / progress.totalBytesExpectedToWrite;
          setDownloadProgress(percentage);
        }
      );

      downloadRef.current = downloadResumable;

      const result = await downloadResumable.downloadAsync();
      if (!result) throw new Error("Download failed: no result returned");
      const uri = result.uri;
      console.log("Downloaded to:", uri);

      // Save downloaded video info
      const existing = await AsyncStorage.getItem("downloads");
      const downloads = existing ? JSON.parse(existing) : [];
      downloads.push({ title, uri });
      await AsyncStorage.setItem("downloads", JSON.stringify(downloads));

      Alert.alert("Download Complete", "Video saved to app storage!", [
        {
          text: "View Downloads",
          onPress: () => router.push("/download"),
        },
        { text: "OK" },
      ]);
    } catch (err) {
      console.error("Download error:", err);
      if (err && typeof err === "object" && "message" in err && err.message === "Download cancelled") {
        Alert.alert("Download Cancelled", "Video download was cancelled.");
      } else {
        Alert.alert("Download Failed", "Unable to download video.");
      }
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
      downloadRef.current = null;
    }
  };

  const cancelDownload = async () => {
    if (downloadRef.current) {
      await downloadRef.current.pauseAsync();
      downloadRef.current = null;
      setIsDownloading(false);
      setDownloadProgress(0);
      Alert.alert("Cancelled", "Download has been cancelled.");
    }
  };

  const VideoComponent: any = ExpoVideo;
  if (!VideoComponent) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#111" }}>
        <View style={styles.centeredFallback}>
          <Text style={{ color: "#fff", marginBottom: 8 }}>
            Video component is unavailable.
          </Text>
          <Text style={{ color: "#ccc", textAlign: "center", paddingHorizontal: 20 }}>
            Make sure you have installed and linked the correct package. For Expo projects:
            run `expo install expo-av` and restart the bundler.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#111" }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ alignItems: "center", paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.videoWrapper, { width: videoWidth, height: videoHeight }]}>
          {/* Expo Video */}
          <VideoComponent
            ref={videoRef}
            source={{ uri: videoUrl }}
            style={styles.video}
            useNativeControls
            resizeMode="contain"
            shouldPlay={false}
            isLooping={false}
            onError={(e: any) => console.warn("Video error:", e)}
            onFullscreenUpdate={async ({ fullscreenUpdate }: any) => {
              if (fullscreenUpdate === VideoFullscreenUpdate.PLAYER_DID_PRESENT) {
                await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
              } else if (fullscreenUpdate === VideoFullscreenUpdate.PLAYER_WILL_DISMISS) {
                await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
              }
            }}
            onPlaybackStatusUpdate={(status: any) => {
              setIsBuffering(status.isBuffering);
            }}
          />

          {/* Loading indicator */}
          {isBuffering && (
            <View style={styles.bufferOverlay}>
              <ActivityIndicator size="large" color="#4ea1ff" />
              <Text style={{ color: "#fff", marginTop: 8 }}>Loading video...</Text>
            </View>
          )}

          {/* Tap zones for seek */}
          <View style={styles.overlay}>
            <TouchableOpacity
              style={styles.leftZone}
              activeOpacity={0.3}
              onPress={() => seekVideo("backward")}
            />
            <TouchableOpacity
              style={styles.rightZone}
              activeOpacity={0.3}
              onPress={() => seekVideo("forward")}
            />
          </View>
        </View>

        {/* Download button and progress */}
        <View style={{ width: videoWidth, marginTop: 16 }}>
          {isDownloading ? (
            <>
              <View
                style={{
                  backgroundColor: "#333",
                  height: 40,
                  borderRadius: 8,
                  justifyContent: "center",
                  paddingHorizontal: 12,
                }}
              >
                <Text style={{ color: "#fff" }}>
                  Downloading... {Math.floor(downloadProgress * 100)}%
                </Text>
              </View>
              <TouchableOpacity
                onPress={cancelDownload}
                style={{
                  marginTop: 8,
                  backgroundColor: "#ff4d4d",
                  padding: 10,
                  borderRadius: 8,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>Cancel Download</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              onPress={downloadVideo}
              style={{
                backgroundColor: "#4ea1ff",
                padding: 12,
                borderRadius: 8,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "600" }}>Download Video</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Info card */}
        <View style={styles.infoCard}>
          <Text style={styles.title}>{title}</Text>

          <Text style={styles.description} numberOfLines={expanded ? undefined : 3}>
            {description}
          </Text>

          {description.length > 120 && (
            <TouchableOpacity onPress={() => setExpanded((s) => !s)}>
              <Text style={styles.readMore}>{expanded ? "Read less" : "Read more"}</Text>
            </TouchableOpacity>
          )}

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111", width: "100%", height: "100%" },
  videoWrapper: {
    backgroundColor: "black",
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 20,
    position: "relative",
  },
  video: { width: "100%", height: "100%", backgroundColor: "black" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leftZone: { flex: 1, justifyContent: "center", alignItems: "flex-start", paddingLeft: 20 },
  rightZone: { flex: 1, justifyContent: "center", alignItems: "flex-end", paddingRight: 20 },
  infoCard: {
    backgroundColor: "#1c1c1c",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    marginTop: 20,
    width: "100%",
    maxWidth: 1100,
  },
  title: { fontSize: 20, fontWeight: "700", color: "#fff", marginBottom: 8 },
  description: { fontSize: 14, color: "#ccc", lineHeight: 20, marginBottom: 8 },
  readMore: { color: "#4ea1ff", marginBottom: 8 },
  metaRow: { flexDirection: "row", marginBottom: 8 },
  metaLabel: { fontSize: 14, color: "#aaa", fontWeight: "600", marginRight: 8 },
  metaValue: { fontSize: 14, color: "#fff" },
  centeredFallback: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#111",
  },
  bufferOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
});
