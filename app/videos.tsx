import { View } from "react-native";
import MediaGrid from "../components/MediaGrid";

export default function VideosScreen() {
  return (
    <View style={{ flex: 1 }}>
      <MediaGrid folder="videos" />
    </View>
  );
}
