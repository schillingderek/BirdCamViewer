import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="images" options={{ title: "Images" }} />
      <Stack.Screen name="videos" options={{ title: "Videos" }} />
      <Stack.Screen name="viewer" options={{ title: "Viewer" }} />
    </Stack>
  );
}
