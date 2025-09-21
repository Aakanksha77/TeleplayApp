import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Easing,
  Image,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { Linking } from 'react-native';
import { Search, Music, Video, Camera, Plus, Heart } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

type Extra = {
  BASE_URL: string;
};
const extra = Constants.expoConfig?.extra as Extra;

export default function HomeScreen() {
  const BASE_URL = extra.BASE_URL;
  console.log('BASE_URL:', BASE_URL);

  // -------- State variables --------
  const [searchText, setSearchText] = useState('');
  const [isVideoMode, setIsVideoMode] = useState(false);
  const [toggleAnimation] = useState(new Animated.Value(0));
  const [highlightedChannel, setHighlightedChannel] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [channels, setChannels] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const router = useRouter();
  const abortRef = useRef<AbortController | null>(null);

  // -------- Debounced search when searchText changes --------
  useEffect(() => {
    const id = setTimeout(() => {
      void handleSearch(searchText);
    }, 300);
    return () => clearTimeout(id);
  }, [searchText]);

  // -------- Search logic (robust to different API shapes) --------
  interface Channel {
    channel_id: number;
    channel_name: string;
    username?: string;
  }

  const handleSearch = async (query: string) => {
    console.log("handleSearch called with query:", query);

    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setChannels([]);
      setHighlightedChannel(null);
      setErrorMsg(null);
      setIsSearching(false);
      return;
    }

    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();

    setIsSearching(true);
    setErrorMsg(null);

    try {
      const url = `${BASE_URL}/channel/search?query=${encodeURIComponent(trimmedQuery)}`;
      const resp = await fetch(url, { signal: abortRef.current.signal });

      if (resp.status === 404) {
        setChannels([]);
        setHighlightedChannel(null);
        return;
      }

      if (!resp.ok) {
        setChannels([]);
        setErrorMsg('Search failed. Try again.');
        return;
      }

      const data = await resp.json();

      const list: Channel[] = Array.isArray(data)
        ? data
        : Array.isArray(data.content)
          ? data.content
          : Array.isArray(data.results)
            ? data.results
            : [];

      // setChannels(list);
      // Remove duplicates by channel_id (or upload_id as fallback)
      const uniqueList = list.filter(
        (item, index, self) =>
          index ===
          self.findIndex(
            (t) =>
              (t.channel_id ?? t.upload_id) === (item.channel_id ?? item.upload_id)
          )
      );

      setChannels(uniqueList);


      if (list.length > 0) {
        const lowerQuery = trimmedQuery.toLowerCase();
        const match = list.find((ch) => (ch.channel_name || ch.username || '').toLowerCase().includes(lowerQuery));
        setHighlightedChannel(match?.channel_id ?? null);
      } else {
        setHighlightedChannel(null);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setChannels([]);
        setHighlightedChannel(null);
        setErrorMsg('Network error. Check server URL or Wi-Fi.');
      }
    } finally {
      setIsSearching(false);
    }
  };

  // -------- Toggle switch --------
  const handleToggle = () => {
    const toValue = isVideoMode ? 0 : 1;
    Animated.timing(toggleAnimation, {
      toValue,
      duration: 300,
      easing: Easing.bezier(0.4, 0.0, 0.2, 1),
      useNativeDriver: false,
    }).start();
    setIsVideoMode((s) => !s);
  };

  const toggleLeft = toggleAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [4, 52],
  });

  // -------- Subscribe --------
  const handleSubscribe = async (channelId: string) => {
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
        body: JSON.stringify({ userId, channelId: Number(channelId) }),
      });

      if (resp.status === 409) {
        Alert.alert('Already Subscribed', 'You are already subscribed to this channel.');
        return;
      }

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      Alert.alert('Subscribed', 'You subscribed to this channel successfully.');
    } catch (e) {
      Alert.alert('Failed', 'Could not subscribe. Try again.');
    }
  };

  // -------- Highlight matches --------
  const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const highlightMatch = (text: string, query: string) => {
    const base = text ?? '';
    if (!query) return <Text style={{ color: '#000' }}>{base}</Text>;
    const safe = escapeRegExp(query);
    const regex = new RegExp(`(${safe})`, 'gi');
    const parts = base.split(regex);
    return (
      <Text>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <Text key={`${part}-${i}`} style={{ color: '#0088cc', fontWeight: '700' }}>
              {part}
            </Text>
          ) : (
            <Text key={`${part}-${i}`} style={{ color: '#000' }}>
              {part}
            </Text>
          )
        )}
      </Text>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#fff" strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search music, videos, artists..."
            placeholderTextColor="#d0d0d0"
            value={searchText}
            onChangeText={setSearchText}
            autoCorrect={false}
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.cameraButton} onPress={() => { }}>
            <Camera size={20} color="#ffffff" strokeWidth={2} />
          </TouchableOpacity>
        </View>
        {!!errorMsg && <Text style={{ color: '#d00', marginTop: 8 }}>{errorMsg}</Text>}
      </View>

      {/* Toggle */}
      <View style={styles.toggleContainer}>
        <View style={styles.toggleWrapper}>
          <TouchableOpacity style={styles.toggleTrack} onPress={handleToggle} activeOpacity={0.8}>
            <View style={{ position: 'absolute', left: 12 }}>
              <Music size={18} color={isVideoMode ? '#ffffff' : '#fff'} strokeWidth={2} />
            </View>
            <View style={{ position: 'absolute', right: 12 }}>
              <Video size={18} color={isVideoMode ? '#fff' : '#ffffff'} strokeWidth={2} />
            </View>
            <Animated.View
              style={[
                {
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  position: 'absolute',
                  backgroundColor: '#fff',
                },
                { left: toggleLeft },
              ]}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Discover/Search Channels */}
      <ScrollView style={styles.channelsSection} keyboardShouldPersistTaps="handled">
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#000000', marginBottom: 16 }}>
          {isSearching ? 'Searching…' : searchText.trim() ? 'Search Results' : 'Discover Channels'}
        </Text>

        {(!channels || channels.length === 0) && !isSearching ? (
          <Text style={{ color: '#555' }}>
            {searchText.trim()
              ? 'No matches found.'
              : 'Type to search channels.'}
          </Text>
        ) : null}

        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {channels.map((item: any, idx: number) => {
            const id = item.channel_id ?? item.upload_id ?? String(idx);
            const source = item.source ?? 'channel';
            const avatar = item.avatar || 'https://via.placeholder.com/80';
            const isHighlighted = highlightedChannel === id;

            if (source === 'channel') {
              const name = item.channel_name ?? item.name ?? 'Unnamed';
              return (
                <TouchableOpacity
                  key={id}
                  style={[styles.channelCard, isHighlighted && { borderColor: '#0088cc', borderWidth: 2 }]}
                  onPress={() => router.push(`/channel/${item.channel_id}`)}
                >
                  <Image source={{ uri: avatar }} style={styles.channelAvatar} />
                  <Text style={{ fontSize: 14, fontWeight: '500', marginTop: 8 }}>
                    {highlightMatch(name, searchText)}
                  </Text>
                  <TouchableOpacity
                    style={styles.subscribeButton}
                    onPress={() => handleSubscribe(String(item.channel_id))}
                  >
                    <Heart size={16} color="#ffffff" />
                    <Text style={styles.subscribeText}>Subscribe</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            } else if (source === 'upload') {
              const title = item.title ?? 'Untitled';
              return (
                <View
                  key={id}
                  style={[styles.channelCard, { backgroundColor: '#f0f0f0' }]}
                >
                  <Image source={{ uri: avatar }} style={styles.channelAvatar} />
                  <Text style={{ fontSize: 14, fontWeight: '500', marginTop: 8, color: '#000' }}>
                    {highlightMatch(title, searchText)}
                  </Text>
                  <TouchableOpacity
                    style={[styles.subscribeButton, { backgroundColor: '#555' }]}
                    onPress={() => {
                      if (item.input_link) {
                        Linking.openURL(item.input_link).catch(() =>
                          Alert.alert('Error', 'Could not open link')
                        );
                      } else {
                        Alert.alert('No link available');
                      }
                    }}
                  >
                    <Text style={styles.subscribeText}>View</Text>
                  </TouchableOpacity>
                </View>
              );
            }
            return null;
          })}
        </View>
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity style={styles.floatingButton} onPress={() => router.push('/add-link')}>
        <Plus size={24} color="#ffffff" strokeWidth={2} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff', marginTop: 20 },
  searchContainer: { paddingHorizontal: 24, marginBottom: 16, paddingTop: 8 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0088cc',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: { flex: 1, fontSize: 16, color: '#ffffff', marginLeft: 12, marginRight: 12 },
  cameraButton: { padding: 4, marginLeft: 8 },
  toggleContainer: { paddingHorizontal: 24, marginBottom: 24 },
  toggleWrapper: { alignItems: 'flex-start' },
  toggleTrack: {
    width: 90,
    height: 40,
    backgroundColor: '#0088cc',
    borderRadius: 18,
    position: 'relative',
    justifyContent: 'center',
  },
  channelsSection: { marginTop: 8, paddingHorizontal: 24 },
  channelCard: {
    width: 120,
    marginRight: 16,
    marginBottom: 16,
    alignItems: 'center',
    borderRadius: 12,
    padding: 8,
  },
  channelAvatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#eee' },
  subscribeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0088cc',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginTop: 8,
  },
  subscribeText: { color: '#ffffff', marginLeft: 4, fontSize: 12 },
  floatingButton: {
    position: 'absolute',
    right: 24,
    bottom: 100,
    width: 56,
    height: 56,
    backgroundColor: '#0088cc',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
