// app/videoplay/VideoPlayerPage.tsx
import React, { useEffect, useRef, useState } from "react";
import { Audio, Video as ExpoVideo, VideoFullscreenUpdate } from "expo-av"; // <- use expo-av (named export)
import * as ScreenOrientation from "expo-screen-orientation";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function VideoPlayerPage() {
  const params = useLocalSearchParams();
  const videoRef = useRef<ExpoVideo | null>(null);

  const videoUrl = (params.videoUrl as string) || "";
  const title = (params.title as string) || "Untitled";
  const description = (params.description as string) || "No description available.";
  const language = (params.language as string) || "Unknown";
  const format = (params.format as string) || "N/A";

  const [expanded, setExpanded] = useState(false);

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
        } catch { }
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
                // Entering fullscreen → lock to landscape
                await ScreenOrientation.lockAsync(
                  ScreenOrientation.OrientationLock.LANDSCAPE
                );
              } else if (fullscreenUpdate === VideoFullscreenUpdate.PLAYER_WILL_DISMISS) {
                // Exiting fullscreen → unlock back to portrait
                await ScreenOrientation.lockAsync(
                  ScreenOrientation.OrientationLock.PORTRAIT_UP
                );
              }
            }}
          />


          {/* Tap zones for seek */}
          <View style={styles.overlay}>
            <TouchableOpacity
              style={styles.leftZone}
              activeOpacity={0.3}
              onPress={() => seekVideo("backward")}
            >
              {/* <Text style={styles.seekText}>⏪ -10s</Text> */}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.rightZone}
              activeOpacity={0.3}
              onPress={() => seekVideo("forward")}
            >
              {/* <Text style={styles.seekText}>⏪ +10s</Text> */}
            </TouchableOpacity>
          </View>
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
  leftZone: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-start",
    paddingLeft: 20,
  },
  rightZone: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-end",
    paddingRight: 20,
  },
  seekText: { color: "white", fontSize: 14, opacity: 0.7 },
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
});
