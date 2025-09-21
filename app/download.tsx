import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { Download, Play } from 'lucide-react-native';

export default function DownloadScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.downloadButton}>
          <Download size={24} color="white" />
          <Text style={styles.buttonText}>Find in Download</Text>
        </TouchableOpacity>

        <View style={styles.fileCard}>
          <Play size={24} color="white" style={styles.playIcon} />
          <View style={styles.fileInfo}>
            <Text style={styles.fileName}>Jawan.2023.720p.webrip.x26xxxxx.mp4</Text>
            <Text style={styles.fileStatus}>Seeding</Text>
            <Text style={styles.fileProgress}>0.00KB/s (0%)</Text>
          </View>
          <View style={styles.fileStats}>
            <Text style={styles.fileSize}>0.0KB/s</Text>
            <Text style={styles.fileTime}>00:00:00</Text>
          </View>
        </View>
      </View>

      <Text style={styles.findDownloadText}>Find Download File</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingTop: 20,
    marginTop: 10,
  },
  buttonContainer: {
    width: '90%',
    alignItems: 'center',
  },
  downloadButton: {
    flexDirection: 'row',
    backgroundColor: '#0088cc',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  fileCard: {
    flexDirection: 'row',
    backgroundColor: '#0088cc',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
  },
  playIcon: {
    marginRight: 15,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fileStatus: {
    color: 'white',
    fontSize: 14,
  },
  fileProgress: {
    color: 'white',
    fontSize: 14,
  },
  fileStats: {
    alignItems: 'flex-end',
  },
  fileSize: {
    color: 'white',
    fontSize: 14,
  },
  fileTime: {
    color: 'white',
    fontSize: 14,
  },
  findDownloadText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 50,
    color: '#333',
  },
});