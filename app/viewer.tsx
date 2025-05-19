import { useLocalSearchParams, useRouter } from "expo-router";
import { View, TouchableOpacity, StyleSheet, Modal } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video"; // Use correct expo-video imports
import { Ionicons } from "@expo/vector-icons";
import ImageViewer from "react-native-image-zoom-viewer";

export default function MediaViewer() {
  const { url, type } = useLocalSearchParams();
  const router = useRouter();

  // Initialize the video player if the media type is "videos"
  const player = useVideoPlayer(url, (player) => {
    player.loop = true; // Loop the video
    player.play(); // Auto-play video on load
  });

  return (
    <View style={styles.container}>
      {/* Close Button */}
      <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
        <Ionicons name="close" size={32} color="white" />
      </TouchableOpacity>

      {type === "videos" ? ( // Fixed type check
        <VideoView
          style={styles.video}
          player={player}
          allowsFullscreen
          allowsPictureInPicture
        />
      ) : (
        <Modal visible={true} transparent={true}>
          <ImageViewer
            imageUrls={[{ url: url }]}
            enableSwipeDown={true}
            onCancel={() => router.back()}
          />
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
  },
  video: {
    width: "100%",
    height: "100%",
  },
});
