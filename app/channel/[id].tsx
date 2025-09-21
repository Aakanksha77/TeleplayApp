import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, FlatList, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Link } from "expo-router";
import { useRouter } from "expo-router";
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

type Extra = {
  BASE_URL: string;
};
const extra = Constants.expoConfig?.extra as Extra;

export default function ChannelPage() {
  const BASE_URL = extra.BASE_URL;
  console.log('BASE_URL:', BASE_URL);
  
  const router = useRouter(); // ✅ this gives you router.push, router.replace, etc.
  const params = useLocalSearchParams();
  const id = params.id as string;

  const [channel, setChannel] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"All" | "popular">("All");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    const fetchChannel = async () => {
      try {
        const resp = await fetch(`${BASE_URL}/channel/${id}`);
        const data = await resp.json();
        setChannel(data);

        // fetch videos immediately after channel load
        fetchChannelContent();

      } catch (e) {
        console.error(e);
      }
    };

    fetchChannel();
  }, [id]);

  if (loading) return <Text style={{ margin: 20 }}>Loading...</Text>;
  if (!channel) return <Text style={{ margin: 20 }}>Channel not found</Text>;

  // --- Subscribe logic ---
  const handleSubscribe = async () => {
    try {
      const userIdStr = await SecureStore.getItemAsync('userId');
      if (!userIdStr) {
        Alert.alert('Not logged in', 'User ID not found.');
        return;
      }
      const userId = Number(userIdStr);

      const resp = await fetch(`${BASE_URL}/channel/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, channelId: Number(id) }),
      });

      if (resp.status === 409) {
        Alert.alert('Already Subscribed', 'You are already subscribed to this channel.');
        return;
      }

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      Alert.alert('Subscribed', 'You subscribed successfully.');
    } catch (e) {
      console.error('Error subscribing:', e);
      Alert.alert('Failed', 'Could not subscribe. Try again.');
    }
  };

  // --- Video click logic ---
  const handleVideoClick = async (item: any) => {
    try {
      const resp = await fetch(`${BASE_URL}/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          link: "magnet:?xt=urn:btih:F2390820A6CD31653B5E447E8492AF176F122A97&dn=Oppenheimer+%282023%29+NEW+ENG+1080p.MP4.InfosPack022&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce&tr=udp%3A%2F%2Ftracker.swateam.org.uk%3A2710%2Fannounce&tr=http%3A%2F%2Ftracker.gbitt.info%3A80%2Fannounce&tr=http%3A%2F%2Ftracker.bt4g.com%3A2095%2Fannounce&tr=http%3A%2F%2Ftracker.files.fm%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker-udp.gbitt.info%3A80%2Fannounce&tr=http%3A%2F%2Fopen.acgnxtracker.com%3A80%2Fannounce&tr=udp%3A%2F%2Fretracker01-msk-virt.corbina.net%3A80%2Fannounce&tr=https%3A%2F%2Ftracker.lilithraws.cf%3A443%2Fannounce&tr=udp%3A%2F%2Ffree.publictracker.xyz%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce&tr=http%3A%2F%2Ftracker.openbittorrent.com%3A80%2Fannounce&tr=udp%3A%2F%2Fopentracker.i2p.rocks%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.internetwarriors.net%3A1337%2Fannounce&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969%2Fannounce&tr=udp%3A%2F%2Fcoppersurfer.tk%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.zer0day.to%3A1337%2Fannounce", // hardcoded
        }),
      });
  
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
  
      if (!data.streamLinks || data.streamLinks.length === 0) {
        Alert.alert("Error", "No streamable link received from backend");
        return;
      }
  
      const streamUrl = data.streamLinks[0].streamUrl; // ✅ take the actual URL
  
      // navigate to player page
      router.push({
        pathname: "/videoplay/VideoPlayerPage",
        params: { videoUrl: streamUrl, title: item.title },
      });
    } catch (err: any) {
      console.error("Error starting stream:", err);
      Alert.alert("Failed", "Could not start stream. Try again.");
    }
  };
  

  


  

  const renderVideo = ({ item }: any) => (
    <Link
      href={{
        pathname: "/videoplay/VideoPlayerPage",
        params: { videoUrl: item.videoUrl, title: item.title },
      }}
      asChild
    >
      <TouchableOpacity style={styles.videoCard}>
        <Image source={{ uri: item.thumbnail }} style={styles.videoThumb} />
        <View style={styles.videoInfo}>
          <Text style={styles.videoTitle}>{item.title}</Text>
          <Text style={styles.videoDetails}>FORMAT ( {item.format} )</Text>
          <Text style={styles.videoDetails}>{item.languages}</Text>
        </View>
      </TouchableOpacity>
    </Link>
  );

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


  const fetchLatestContent = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BASE_URL}/latest/content/${id}`);
      const data = await res.json();
      if (data.content) setVideos(data.content);
      else setError(data.message || "No content found");
    } catch (err: any) {
      setError("Error fetching latest: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPopularContent = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BASE_URL}/popular/content/${id}`);
      const data = await res.json();
      if (data.content) setVideos(data.content);
      else setError(data.message || "No popular content found");
    } catch (err: any) {
      setError("Error fetching popular: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (

    <ScrollView style={styles.container}>
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
            {channel?.name || "sdasd_id"}
          </Text>
          <Text numberOfLines={1} style={styles.channelUsername}>
            @{channel?.username || "user_id"}
          </Text>
        </View>
        <TouchableOpacity style={styles.subscribeBtn} onPress={handleSubscribe}>
          <Text style={styles.subscribeText}>Subscribe</Text>
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
            fetchPopularContent();
          }}
        >
          <Text style={styles.tabText}>Popular</Text>
        </TouchableOpacity>
      </View>

      {/* Videos */}
      {error ? (
        <Text style={{ margin: 20, color: "red" }}>{error}</Text>
      ) : (
        
        // <FlatList
        //   data={videos} // videos should be set from your API response
        //   renderItem={({ item }) => (
        //     <Link
        //       href={{
        //         pathname: "/videoplay/VideoPlayerPage",
        //         params: { videoUrl: item.output_link, title: item.title }, // use output_link
        //       }}
        //       asChild
        //     >
        //       <TouchableOpacity style={styles.videoCard}>
        //         <Image
        //           source={{
        //             uri: item.thumbnail
        //               ? `data:image/jpeg;base64,${item.thumbnail}` // convert Base64 to image
        //               : "https://via.placeholder.com/150",
        //           }}
        //           style={styles.videoThumb}
        //         />
        //         <View style={styles.videoInfo}>
        //           <Text style={styles.videoTitle}>{item.title}</Text>
        //           <Text style={styles.videoDetails}>Language: {item.language}</Text>
        //           {/* <Text style={styles.videoDetails}>Tags: {item.tags}</Text> */}
        //         </View>
        //       </TouchableOpacity>
        //     </Link>
        //   )}
        //   keyExtractor={(item) => item.id.toString()}
        //   contentContainerStyle={{ paddingBottom: 40 }}
        // />

        <FlatList
        data={videos}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.videoCard}
            onPress={() => handleVideoClick(item)} // ✅ use handler
          >
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
        contentContainerStyle={{ paddingBottom: 40 }}
      />
      


      )}
    </ScrollView>

  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9', paddingHorizontal: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    width: '100%',
  },
  avatar: { width: 60, height: 60, borderRadius: 30, marginRight: 12 },
  channelInfo: { flex: 1, marginRight: 10, justifyContent: 'center' },
  channelName: { fontSize: 18, fontWeight: '700', color: '#000' },
  channelUsername: { fontSize: 14, color: '#555' },
  subscribeBtn: {
    backgroundColor: '#007bff',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    alignSelf: 'center',
    minWidth: 80,
  },
  subscribeText: { color: '#fff', fontWeight: '600', textAlign: 'center' },

  tabs: { flexDirection: 'row', marginVertical: 12 },
  tab: { marginRight: 12, paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#eee' },
  activeTab: { marginRight: 12, paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#ccc' },
  tabText: { fontSize: 14, fontWeight: '600' },

  videoCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
  },
  videoThumb: { width: 100, height: 80 },
  videoInfo: { flex: 1, padding: 8, justifyContent: 'center' },
  videoTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  videoDetails: { fontSize: 12, color: '#555' },
  menuButton: { padding: 8, justifyContent: 'center', alignItems: 'center' },
});
