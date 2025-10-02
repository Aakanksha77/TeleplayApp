import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { addToHistory } from '../util/history';
type Extra = {
  BASE_URL: string;
};
const extra = Constants.expoConfig?.extra as Extra;

export default function ChannelPage() {
  const BASE_URL = extra.BASE_URL;
  const router = useRouter();
  const params = useLocalSearchParams();
  const id = params.id as string;

  const [channel, setChannel] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"All" | "popular">("All");
  const [error, setError] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  // --- Fetch functions ---
  const fetchChannelContent = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BASE_URL}/content/${id}`);
      const data = await res.json();
      if (data.content) setVideos(data.content);
      else setError(data.message || "No content found");
    } catch (err: any) {
      setError("Error fetching content: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Subscribe ---
  const handleSubscribe = async () => {
    try {
      const userIdStr = await SecureStore.getItemAsync("userId");
      if (!userIdStr) {
        Alert.alert("Not logged in", "User ID not found.");
        return;
      }
      const userId = Number(userIdStr);

      const resp = await fetch(`${BASE_URL}/channel/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, channelId: Number(id) }),
      });

      if (!resp.ok && resp.status !== 409) throw new Error(`HTTP ${resp.status}`);
      setIsSubscribed(true);
      Alert.alert("Subscribed", "You subscribed successfully.");
    } catch (e) {
      console.error("Error subscribing:", e);
      Alert.alert("Failed", "Could not subscribe. Try again.");
    }
  };

  // --- Unsubscribe ---
  const handleUnsubscribe = async () => {
    try {
      const userIdStr = await SecureStore.getItemAsync("userId");
      if (!userIdStr) {
        Alert.alert("Not logged in", "User ID not found.");
        return;
      }
      const userId = Number(userIdStr);

      const resp = await fetch(`${BASE_URL}/channel/unsubscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, channelId: Number(id) }),
      });

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      setIsSubscribed(false);
      Alert.alert("Unsubscribed", "You unsubscribed successfully.");
    } catch (e) {
      console.error("Error unsubscribing:", e);
      Alert.alert("Failed", "Could not unsubscribe. Try again.");
    }
  };

  useEffect(() => {
    if (!id) return;

    const fetchChannel = async () => {
      try {
        const resp = await fetch(`${BASE_URL}/channel/${id}`);
        const data = await resp.json();
        setChannel(data);

        // check if user is already subscribed
        const userIdStr = await SecureStore.getItemAsync("userId");
        if (userIdStr) {
          const userId = Number(userIdStr);
          const checkResp = await fetch(`${BASE_URL}/channel/${id}/isSubscribed?userId=${userId}`);
          if (checkResp.ok) {
            const result = await checkResp.json();
            setIsSubscribed(result.subscribed === true);
          }
        }

        fetchChannelContent();
      } catch (e) {
        console.error(e);
      }
    };

    fetchChannel();
  }, [id]);

  if (loading) return <Text style={{ margin: 20 }}>Loading...</Text>;
  if (!channel) return <Text style={{ margin: 20 }}>Channel not found</Text>;

  // --- Video click logic ---
  const handleVideoClick = async (item: any) => {
    try {
      // ✅ Save to history
    await addToHistory(item);

      const resp = await fetch(`${BASE_URL}/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          { link: item.input_link || "" 

          }
        ),
      });

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();

      if (!data.streamLinks || data.streamLinks.length === 0) {
        Alert.alert("Error", "No streamable link received from backend");
        return;
      }

      const streamUrl = data.streamLinks[0].streamUrl;

      router.push({
        pathname: "/videoplay/VideoPlayerPage",
        params: { videoUrl: streamUrl, title: item.title },
      });
    } catch (err: any) {
      console.error("Error starting stream:", err);
      Alert.alert("Failed", "Could not start stream. Try again.");
    }
  };

  return (
    <FlatList
      data={videos}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.videoCard} onPress={() => handleVideoClick(item)}>
          <Image
            source={{
              uri: item.thumbnail
                ? `data:image/jpeg;base64,${item.thumbnail}`
                : "https://via.placeholder.com/150",
            }}
            style={styles.videoThumb}
          />
          <View style={styles.videoInfo}>
            <Text style={styles.videoTitle}>{item.title}</Text>
            <Text style={styles.videoDetails}>Language: {item.language}</Text>
          </View>
        </TouchableOpacity>
      )}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 16 }}
      ListHeaderComponent={
        <>
          {/* Header */}
          <View style={styles.header}>
            <Image
              source={{
                uri:
                  typeof channel?.avatar === "string" && channel.avatar
                    ? channel.avatar
                    : "https://via.placeholder.com/100",
              }}
              style={styles.avatar}
            />
            <View style={styles.channelInfo}>
              <Text numberOfLines={1} style={styles.channelName}>
                {channel?.name || "Channel"}
              </Text>
              <Text numberOfLines={1} style={styles.channelUsername}>
                @{channel?.username || "user"}
              </Text>
            </View>

            {/* Subscribe/Unsubscribe button */}
            <TouchableOpacity
              style={[styles.subscribeBtn, isSubscribed && styles.subscribedBtn]}
              onPress={isSubscribed ? handleUnsubscribe : handleSubscribe}
            >
              <Text style={[styles.subscribeText, isSubscribed && styles.subscribedText]}>
                {isSubscribed ? "Unsubscribe" : "Subscribe"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={activeTab === "All" ? styles.activeTab : styles.tab}
              onPress={() => {
                setActiveTab("All");
                fetchChannelContent();
              }}
            >
              <Text style={styles.tabText}>All</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={activeTab === "popular" ? styles.activeTab : styles.tab}
              onPress={() => {
                setActiveTab("popular");
              }}
            >
              <Text style={styles.tabText}>Popular</Text>
            </TouchableOpacity>
          </View>
        </>
      }
      ListEmptyComponent={error ? <Text style={{ margin: 20, color: "red" }}>{error}</Text> : null}
    />
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    width: "100%",
  },
  avatar: { width: 60, height: 60, borderRadius: 30, marginRight: 12 },
  channelInfo: { flex: 1, marginRight: 10, justifyContent: "center" },
  channelName: { fontSize: 18, fontWeight: "700", color: "#000" },
  channelUsername: { fontSize: 14, color: "#555" },

  subscribeBtn: {
    backgroundColor: "#007bff",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    alignSelf: "center",
    minWidth: 100,
  },
  subscribedBtn: {
    backgroundColor: "red",
  },
  subscribeText: { color: "#fff", fontWeight: "600", textAlign: "center" },
  subscribedText: { color: "#fff", fontWeight: "600", textAlign: "center" },

  tabs: { flexDirection: "row", marginVertical: 12 },
  tab: {
    marginRight: 12,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#eee",
  },
  activeTab: {
    marginRight: 12,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#ccc",
  },
  tabText: { fontSize: 14, fontWeight: "600" },

  videoCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginBottom: 12,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
  },
  videoThumb: { width: 100, height: 80 },
  videoInfo: { flex: 1, padding: 8, justifyContent: "center" },
  videoTitle: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  videoDetails: { fontSize: 12, color: "#555" },
});
