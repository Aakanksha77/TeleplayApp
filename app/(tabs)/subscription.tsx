import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from "expo-router";
import * as SecureStore from 'expo-secure-store';
import { Play, MoveHorizontal as MoreHorizontal } from 'lucide-react-native';
import Constants from 'expo-constants';

type Extra = {
  BASE_URL: string;
};
const extra = Constants.expoConfig?.extra as Extra;


export default function SubscriptionScreen() {
  const BASE_URL = extra.BASE_URL;
  console.log('BASE_URL:', BASE_URL);


  const router = useRouter();
  const [subscribedChannels, setSubscribedChannels] = useState<any[]>([]);
  const [latestVideos, setLatestVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch subscriptions + latest videos
  const fetchSubscriptions = async () => {
    try {
      // const userId = await SecureStore.getItemAsync("userId");
      const userId = await SecureStore.getItemAsync('userId');
      console.log("Stored userId after login:", userId);
      if (!userId) {
        Alert.alert("Error", "User not logged in");
        return;
      }

      // 🔹 Step 1: Fetch user subscriptions
      const resp = await fetch(`${BASE_URL}/channel/subscriptions/${userId}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      const data = await resp.json();
      console.log("Fetched subscriptions:", data.subscriptions);

      const subs = data.subscriptions || [];
      setSubscribedChannels(subs);

      // 🔹 Step 2: Fetch latest content for each subscribed channel
      const videos: any[] = [];
      for (const channel of subs) {
        try {
          const latestResp = await fetch(`${BASE_URL}/content/${channel.id}`);
          if (!latestResp.ok) {
            console.log(`No content for channel ${channel.id}`);
            continue;
          }
          const latestData = await latestResp.json();
          if (latestData.content && latestData.content.length > 0) {
            // Attach channel name + avatar for UI
            videos.push({
              ...latestData.content[0], // latest video
              channelName: channel.name,
              channelAvatar: channel.avatar,
            });
          }
        } catch (err) {
          console.error(`Error fetching latest for channel ${channel.id}:`, err);
        }
      }

      setLatestVideos(videos);
    } catch (err) {
      console.error("Error fetching subscriptions:", err);
      Alert.alert("Failed", "Could not fetch subscriptions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#0088cc" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        {/* Subscribed Channels Section */}
        <View style={styles.channelsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Subscriptions</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {subscribedChannels.length === 0 ? (
            <Text style={styles.emptyText}>You haven't subscribed to any channels yet.</Text>

          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.channelsContainer}
            >
              {subscribedChannels.map((channel, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.channelStory}
                  onPress={() => {
                    console.log("Clicked channel ID:", channel.channelId);
                    console.log("Clicked channel Name:", channel.name);
                    router.push(`/channel/${channel.channelId}`);
                  }}


                >

                  <View style={styles.storyRing}>
                    <Image
                      source={{ uri: channel.avatar || "https://placehold.co/100x100" }}
                      style={styles.channelAvatar}
                    />
                  </View>
                  <Text style={styles.channelName} numberOfLines={1}>
                    {channel.name}
                  </Text>
                </TouchableOpacity>

              ))}
            </ScrollView>
          )}
        </View>

        {/* Divider Line */}
        <View style={styles.divider} />

        {/* Latest Videos Section */}
        <View style={styles.latestSection}>
          <Text style={styles.sectionTitle}>Latest</Text>

          {latestVideos.length === 0 ? (
            <Text style={styles.emptyText}>No videos yet from your subscriptions</Text>
          ) : (
            latestVideos.map((video, index) => (
              <TouchableOpacity key={index} style={styles.videoCard}>

                {/* Thumbnail */}
                <View style={styles.thumbnailContainer}>
                  <Image
                    source={{ uri: video.thumbnail || "https://placehold.co/300x200" }}
                    style={styles.videoThumbnail}
                  />
                  <View style={styles.durationBadge}>
                    <Text style={styles.durationText}>{video.duration || "00:00"}</Text>
                  </View>
                  <View style={styles.playButton}>
                    <Play size={16} color="#fff" strokeWidth={2} fill="#fff" />
                  </View>
                </View>

                {/* Info */}
                <View style={styles.videoInfo}>
                  <Text style={styles.videoTitle} numberOfLines={2}>
                    {video.title || "Untitled Video"}
                  </Text>
                  <Text style={styles.channelNameText}>{video.channelName}</Text>
                  <Text style={styles.videoMeta}>
                    {video.views || "0 views"} • {video.timeAgo || "just now"}
                  </Text>
                </View>

                <TouchableOpacity style={styles.moreButton}>
                  <MoreHorizontal size={20} color="#8e8e93" strokeWidth={2} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>

  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', marginTop: 20 },
  content: { flex: 1 },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0088cc',
  },

  // Channels row
  channelsSection: { paddingTop: 20, paddingBottom: 12 },
  channelsContainer: { paddingHorizontal: 16 },
  channelStory: { alignItems: 'center', marginRight: 16, width: 72 },
  storyRing: {
    width: 64,
    height: 64,
    padding: 2,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#0088cc',
    marginBottom: 6,
  },
  channelAvatar: { width: '100%', height: '100%', borderRadius: 32 },
  channelName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#000',
    textAlign: 'center',
  },

  divider: { height: 1, backgroundColor: '#e9ecef', marginVertical: 10 },

  // Latest videos
  latestSection: { paddingTop: 12, paddingHorizontal: 20 },
  videoCard: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  thumbnailContainer: { position: 'relative', marginRight: 12 },
  videoThumbnail: { width: 140, height: 80, borderRadius: 8 },
  durationBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  durationText: { fontSize: 10, fontWeight: '600', color: '#fff' },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -12 }, { translateY: -12 }],
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,136,204,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  videoInfo: { flex: 1, paddingRight: 8 },
  videoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  channelNameText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#0088cc',
    marginBottom: 2,
  },
  videoMeta: { fontSize: 11, color: '#8e8e93' },

  moreButton: { padding: 4 },

  // Empty text
  emptyText: {
    fontSize: 13,
    color: '#8e8e93',
    textAlign: 'center',
    marginVertical: 12,
  },
});

