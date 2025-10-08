import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function VideoPlayerPage() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const videoUrl = decodeURI((params.videoUrl as string) || "");
  const title = (params.title as string) || "Untitled";
  const description = (params.description as string) || "No description available.";
  const language = (params.language as string) || "Unknown";
  const format = (params.format as string) || "N/A";

  const [expanded, setExpanded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const playerRef = useRef<WebView>(null);
const downloadRef = useRef<any>(null);

  const screenWidth = Dimensions.get("window").width;
  const videoWidth = Math.min(screenWidth * 0.95, 1000);
  const videoHeight = (videoWidth * 9) / 16;

  // --- HTML for video.js player ---
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://vjs.zencdn.net/8.10.0/video-js.css" rel="stylesheet" />
        <script src="https://vjs.zencdn.net/8.10.0/video.min.js"></script>
        <style>
          body { margin: 0; background-color: black; display: flex; justify-content: center; align-items: center; height: 100vh; }
          video { width: 100%; height: 100%; border-radius: 12px; }
        </style>
      </head>
      <body>
        <video id="my-player" class="video-js vjs-big-play-centered" controls preload="auto">
          <source src="${videoUrl}" type="video/mp4" />
        </video>
        <script>
          var player = videojs('my-player', { autoplay: false, fluid: true });
        </script>
      </body>
    </html>
  `;

  // --- Download logic ---
const downloadVideo = async () => {
  try {
    setIsDownloading(true);
    setDownloadProgress(0);

const fileUri = (FileSystem as any).documentDirectory + title.replace(/\s+/g, "_") + ".mp4";

    const downloadResumable = FileSystem.createDownloadResumable(
      videoUrl,
      fileUri,
      {},
      (progress) => {
        setDownloadProgress(progress.totalBytesWritten / progress.totalBytesExpectedToWrite);
      }
    );

    downloadRef.current = downloadResumable;
    const result = await downloadResumable.downloadAsync();
    console.log("Downloaded to:", result.uri);

    const existing = await AsyncStorage.getItem("downloads");
    const downloads = existing ? JSON.parse(existing) : [];
    downloads.push({ title, uri: result.uri });
    await AsyncStorage.setItem("downloads", JSON.stringify(downloads));

    Alert.alert("Download Complete", "Video saved to app storage!", [
      { text: "View Downloads", onPress: () => router.push("/download") },
      { text: "OK" },
    ]);
  } catch (err) {
    console.error(err);
    Alert.alert("Download Failed", "Unable to download video.");
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#111" }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ alignItems: "center", paddingBottom: 32 }}
      >
        {/* --- Video Player --- */}
        <View style={[styles.videoWrapper, { width: videoWidth, height: videoHeight }]}>
          <WebView
            ref={playerRef}
            originWhitelist={["*"]}
            source={{ html }}
            allowsInlineMediaPlayback
            allowsFullscreenVideo
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
            mediaPlaybackRequiresUserAction={false}
            renderLoading={() => (
              <View style={styles.loaderOverlay}>
                <ActivityIndicator size="large" color="#4ea1ff" />
                <Text style={{ color: "#ccc", marginTop: 10 }}>Loading video...</Text>
              </View>
            )}
            style={{ width: "100%", height: "100%", borderRadius: 12 }}
          />
        </View>

        {/* --- Download Controls --- */}
        <View style={{ width: videoWidth, marginTop: 16 }}>
          {isDownloading ? (
            <>
              <View style={styles.progressBox}>
                <Text style={{ color: "#fff" }}>
                  Downloading... {Math.floor(downloadProgress * 100)}%
                </Text>
              </View>
              <TouchableOpacity onPress={cancelDownload} style={styles.cancelBtn}>
                <Text style={{ color: "#fff", fontWeight: "600" }}>Cancel Download</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity onPress={downloadVideo} style={styles.downloadBtn}>
              <Text style={{ color: "#fff", fontWeight: "600" }}>Download Video</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* --- Info Card --- */}
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
    alignSelf: "center",
  },
  loaderOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 10,
  },
  progressBox: {
    backgroundColor: "#333",
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  cancelBtn: {
    marginTop: 8,
    backgroundColor: "#ff4d4d",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  downloadBtn: {
    backgroundColor: "#4ea1ff",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
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
});
