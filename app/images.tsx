import { View } from "react-native";
import MediaGrid from "../components/MediaGrid";

export default function ImagesScreen() {
  return (
    <View style={{ flex: 1 }}>
      <MediaGrid folder="images" />
    </View>
  );
}
