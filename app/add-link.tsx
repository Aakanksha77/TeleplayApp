import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as DocumentPicker from "expo-document-picker";
import Constants from 'expo-constants';

type Extra = {
  BASE_URL: string;
};
const extra = Constants.expoConfig?.extra as Extra;


export default function AddLinkScreen() {

  const BASE_URL = extra.BASE_URL;
  console.log('BASE_URL:', BASE_URL);


  const [linkText, setLinkText] = useState('');
  const [fileSelected, setFileSelected] = useState(false); // track if file is chosen
  const router = useRouter();

  const handleSelectTorrentFile1 = () => {
    if (linkText.trim()) {
      Alert.alert("Error", "You can only use one method at a time (link or file)");
      return;
    }
    setFileSelected(true);
    Alert.alert('Select Torrent File', 'File picker functionality would be implemented here');
  };

  const handleSelectTorrentFile = async () => {
    if (linkText.trim()) {
      Alert.alert("Error", "You can only use one method at a time (link or file)");
      return;
    }
  
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/x-bittorrent"], // only .torrent files
        copyToCacheDirectory: true,
      });
  
      if (result.canceled) {
        return; // user pressed cancel
      }
  
      const file = result.assets[0]; // file info
      console.log("Selected file:", file);
  
      setFileSelected(true);
  
      Alert.alert("File Selected", `Name: ${file.name}`);
      // later, send file.uri to backend for streaming
    } catch (err) {
      console.error("Error picking file:", err);
      Alert.alert("Error", "Could not pick file");
    }
  };

  
  const handleOpen = async () => {
    try {
      // case 1: link is entered
      if (linkText.trim() && !fileSelected) {
        const resp = await fetch(`${BASE_URL}/stream`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ link: linkText.trim() }),
        });

        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();

        if (!data.streamLinks || data.streamLinks.length === 0) {
          Alert.alert("Error", "No streamable link received from backend");
          return;
        }

        const streamUrl = data.streamLinks[0].streamUrl;

        // ✅ Navigate to video player
        router.push({
          pathname: "/videoplay/VideoPlayerPage",
          params: { videoUrl: streamUrl, title: "Streaming Video" },
        });

        setLinkText('');
      }
      // case 2: file is selected
      else if (fileSelected) {
        Alert.alert("Coming Soon", "File upload & streaming not yet implemented");
      } 
      else {
        Alert.alert("Error", "Please enter a link or select a file");
      }
    } catch (err: any) {
      console.error("Error starting stream:", err);
      Alert.alert("Failed", "Could not start stream. Try again.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={20} color="#000" strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.title}>ADD Link</Text>
        </View>

        {/* Show Link input only if file is NOT selected */}
        {!fileSelected && (
          <>
            <Text style={styles.label}>Link</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Paste link here"
              placeholderTextColor="#666"
              value={linkText}
              onChangeText={(txt) => {
                setLinkText(txt);
                if (txt.trim()) setFileSelected(false); // reset file if user starts typing
              }}
            />
          </>
        )}

        {/* Show File selector only if link is NOT typed */}
        {!linkText.trim() && (
          <>
            <Text style={styles.label}>Select File</Text>
            <TouchableOpacity
              style={styles.torrentBox}
              onPress={handleSelectTorrentFile}
            >
              <Text style={styles.torrentText}>
                {fileSelected ? "File Selected ✅" : "Select torrent file"}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* Open button */}
        <TouchableOpacity
          style={styles.openButton}
          onPress={handleOpen}
        >
          <Text style={styles.openButtonText}>Open</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0088cc',
    alignItems: 'center',
    justifyContent: 'center',
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
  label: {
    fontSize: 14,
    color: '#000',
    alignSelf: 'flex-start',
    marginTop: 10,
    marginBottom: 6,
  },
  textInput: {
    width: '100%',
    backgroundColor: '#E3EBFF',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    marginBottom: 16,
    color: '#000',
  },
  torrentBox: {
    width: '100%',
    height: 120,
    backgroundColor: '#E3EBFF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  torrentText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  openButton: {
    alignSelf: 'flex-end',
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
