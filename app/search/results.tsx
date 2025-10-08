import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import Constants from 'expo-constants';

type Extra = {
  BASE_URL: string;
};
const extra = Constants.expoConfig?.extra as Extra;

interface SearchResult {
  id: number;
  name: string;
  bio: string;
  avatarUrl: string;
}

export default function SearchResultsScreen() {
  const BASE_URL = extra.BASE_URL;
  console.log('BASE_URL:', BASE_URL);


  const { query } = useLocalSearchParams();
  const router = useRouter();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSearchResults();
  }, [query]);

  const fetchSearchResults = async () => {
    try {
      const response = await fetch(`${BASE_URL}/search?q=${query}`);
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Error fetching search results:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update the SearchResult interface
  interface SearchResult {
    id: number;
    title: string;
    channelName: string;
    thumbnailUrl: string;
    views: string;
    timeAgo: string;
    duration?: string;
    videoUrl?: string;
    description?: string;
    language?: string;
    format?: string;
  }
  
  const fetchVideoDetailsAndNavigate = async (videoId: number) => {
    try {
      const response = await fetch(`${BASE_URL}/video/${videoId}`);
      const videoDetails = await response.json();
      router.push({
        pathname: "/videoplay/VideoPlayerPage",
        params: {
          videoUrl: videoDetails.videoUrl,
          title: videoDetails.title,
          description: videoDetails.description,
          language: videoDetails.language,
          format: videoDetails.format,
        },
      });
    } catch (error) {
      console.error("Error fetching video details:", error);
      // Optionally, show an alert to the user
      // Alert.alert("Error", "Could not load video details.");
    }
  };

  // Update the renderItem function
  const renderItem = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={styles.resultCard}
      onPress={() => fetchVideoDetailsAndNavigate(item.id)}
    >
      <Image
        source={{ uri: item.thumbnailUrl || 'https://placehold.co/300x200' }}
        style={styles.thumbnail}
      />
      <View style={styles.videoInfo}>
        <Text style={styles.videoTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.channelName}>{item.channelName}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{item.views} views</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.metaText}>{item.timeAgo}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.menuButton}>
        <Text style={styles.menuIcon}>⋮</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
  
  // Update styles
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#ffffff',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: '#e0e0e0',
    },
    backButton: {
      position: 'absolute',
      left: 15,
      padding: 5,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: '#000',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    listContainer: {
      padding: 15,
    },
    resultCard: {
      flexDirection: 'row',
      marginBottom: 12,
      padding: 8,
    },
    thumbnail: {
      width: 160,
      height: 90,
      borderRadius: 8,
      marginRight: 16,
    },
    videoInfo: {
      flex: 1,
      paddingRight: 8,
    },
    videoTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: '#000',
      marginBottom: 4,
    },
    channelName: {
      fontSize: 14,
      color: '#606060',
      marginBottom: 4,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    metaText: {
      fontSize: 14,
      color: '#606060',
    },
    dot: {
      color: '#606060',
      marginHorizontal: 4,
    },
    menuButton: {
      padding: 8,
      alignSelf: 'flex-start',
    },
    menuIcon: {
      fontSize: 20,
      color: '#606060',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 50,
    },
    emptyText: {
      fontSize: 16,
      color: '#666',
    },
  });
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#000" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.title}>Search Results</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0088cc" />
        </View>
      ) : (
        <FlatList
          data={results}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No results found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}