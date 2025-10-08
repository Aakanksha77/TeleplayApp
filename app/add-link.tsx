import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  TextInput,
  ScrollView,
} from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { addToHistory } from './util/history';

type Extra = {
  BASE_URL_STEARMING: string;
};
const extra = Constants.expoConfig?.extra as Extra;

export default function AddLinkScreen() {
  const BASE_URL_STEARMING = extra.BASE_URL_STEARMING;
  const router = useRouter();
  const [link, setLink] = useState('');

  const handleOpen = async () => {
  try {
    const inputLink = link.trim();
    if (!inputLink.startsWith('magnet:?')) {
      Alert.alert('Invalid Link', 'Please enter a valid magnet link.');
      return;
    }

    // 🔍 Extract title from magnet link (dn parameter)
    const match = inputLink.match(/[?&]dn=([^&]+)/);
    const decodedTitle = match
      ? decodeURIComponent(match[1].replace(/\+/g, ' '))
      : 'Unknown Title';

    const item = { title: decodedTitle, input_link: inputLink };
    await addToHistory(item);

    // 🔥 Send magnet link to backend
    const resp = await fetch(`https://sweptback-nickie-lately.ngrok-free.dev/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ link: inputLink }),
    });

    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();

    if (!data.streamLinks || data.streamLinks.length === 0) {
      Alert.alert('Error', 'No streamable link received from backend');
      return;
    }

    const streamUrl = data.streamLinks[0].streamUrl;
    console.log('Stream URL from backend:', streamUrl);
    const encodedStreamUrl = encodeURI(streamUrl);

    router.push({
      pathname: '/videoplay/VideoPlayerPage',
      params: { videoUrl: encodedStreamUrl, title: item.title },
    });

  } catch (err: any) {
    console.error('Error starting stream:', err);
    Alert.alert('Failed', 'Could not start stream. Try again.');
  }
};

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={{ width: '100%' }}
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft size={20} color="#000" strokeWidth={2} />
            </TouchableOpacity>
            <Text style={styles.title}>Play Video</Text>
          </View>

          {/* Input */}
          <TextInput
            style={styles.input}
            placeholder="Paste magnet link here"
            value={link}
            onChangeText={setLink}
            autoCapitalize="none"
            autoCorrect={false}
            multiline
            textAlignVertical="top"
          />

          {/* Button */}
          <TouchableOpacity style={styles.openButton} onPress={handleOpen}>
            <Text style={styles.openButtonText}>Open</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0088cc',
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  card: {
    width: '85%',
    backgroundColor: '#AFC6FF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: -2,
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#DCE5FF',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  input: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    marginBottom: 20,
    minHeight: 120,
  },
  openButton: {
    alignSelf: 'center',
    backgroundColor: '#0088cc',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  openButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
