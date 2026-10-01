import { Redirect } from "expo-router";
import { View } from "react-native";
import { useSession } from "../src/session";
import { colors } from "../src/theme";
import { InkLoader } from "../src/motion";

const APP_ROLE = process.env.EXPO_PUBLIC_APP_ROLE ?? "customer";

function isArtistDeployment() {
  if (APP_ROLE === "artist") return true;
  if (typeof window !== "undefined") {
    return window.location.hostname.toLowerCase().includes("tinta-artist");
  }
  return false;
}

function ArtistEntry() {
  return <Redirect href="/artist/apply" />;
}

function AppEntry() {
  const { user, loading } = useSession();
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}>
        <InkLoader label="TINTA" />
      </View>
    );
  }

  if (APP_ROLE === "admin") {
    return <Redirect href={user ? "/admin/payments" : "/(auth)/sign-in?next=admin"} />;
  }

  return <Redirect href={user ? "/(tabs)" : "/(tabs)"} />;
}

export default function Index() {
  return isArtistDeployment() ? <ArtistEntry /> : <AppEntry />;
}
