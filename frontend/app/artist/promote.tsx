import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSession } from "../../src/session";
import { colors, spacing } from "../../src/theme";

export default function PromoteArtist() {
  const router = useRouter();
  const { user } = useSession();

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Pressable onPress={() => router.replace("/artist/portal")}>
        <Text style={styles.back}>← ARTIST PORTAL</Text>
      </Pressable>

      <Text style={styles.kicker}>TINTA ARTIST GROWTH</Text>
      <Text style={styles.title}>YOUR PROFILE IS FREE</Text>
      <Text style={styles.subtitle}>NO ARTIST SUBSCRIPTION · NO SPOTLIGHT FEE · NO JOINING FEE</Text>

      <View style={styles.card}>
        <Text style={styles.section}>WHAT ARTISTS GET</Text>
        <Text style={styles.item}>✓ FREE ARTIST ACCOUNT</Text>
        <Text style={styles.item}>✓ FREE PROFILE + PORTFOLIO</Text>
        <Text style={styles.item}>✓ FREE DISCOVER LISTING</Text>
        <Text style={styles.item}>✓ FREE WEEKLY EDITORIAL FEATURE ROTATION</Text>
        <Text style={styles.item}>✓ PAY ONLY WHEN YOU GET A COMPLETED BOOKING</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>HOW TINTA EARNS</Text>
        <Text style={styles.headline}>15% PLATFORM COMMISSION</Text>
        <Text style={styles.text}>TINTA earns a commission from completed paid bookings while artists keep the remainder of the commissionable booking amount.</Text>
        <Text style={styles.headline}>ADVERTISING</Text>
        <Text style={styles.text}>TINTA can also earn from paid advertising inventory shown to customers. Artist accounts are not charged for joining or normal visibility.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>LAUNCH PROMISE</Text>
        <Text style={styles.text}>Bring your best work, complete verification, stay active, and focus on getting bookings. TINTA is removing artist promotion fees to grow the marketplace first.</Text>
      </View>

      {!user ? (
        <Pressable onPress={() => router.replace({ pathname: "/(auth)/sign-up", params: { role: "artist" } })} style={styles.cta}>
          <Text style={styles.ctaText}>CREATE FREE ARTIST ACCOUNT</Text>
        </Pressable>
      ) : (
        <Pressable onPress={() => router.replace("/artist/apply")} style={styles.cta}>
          <Text style={styles.ctaText}>OPEN ARTIST VERIFICATION</Text>
        </Pressable>
      )}

      <Pressable onPress={() => router.replace("/artist/portal")} style={styles.secondary}>
        <Text style={styles.secondaryText}>BACK TO ARTIST PORTAL</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:{flex:1,backgroundColor:colors.surface},
  content:{padding:spacing.lg,gap:spacing.md,maxWidth:900,width:"100%",alignSelf:"center",paddingBottom:60},
  back:{color:colors.brand,fontWeight:"900",letterSpacing:1.5},
  kicker:{color:colors.brand,fontSize:11,fontWeight:"900",letterSpacing:2,marginTop:10},
  title:{color:colors.onSurface,fontSize:36,fontWeight:"900",letterSpacing:2},
  subtitle:{color:colors.muted,fontSize:10,fontWeight:"900",letterSpacing:1.4,lineHeight:16},
  section:{color:colors.brand,fontSize:11,fontWeight:"900",letterSpacing:2},
  card:{borderWidth:2,borderColor:colors.border,padding:18,gap:10,backgroundColor:colors.surfaceSecondary},
  item:{color:colors.onSurface,fontSize:13,fontWeight:"900",letterSpacing:1.1},
  headline:{color:colors.onSurface,fontSize:18,fontWeight:"900",letterSpacing:1,marginTop:4},
  text:{color:colors.muted,fontSize:13,lineHeight:20},
  cta:{backgroundColor:colors.brand,padding:17,alignItems:"center"},
  ctaText:{color:colors.onBrand,fontWeight:"900",letterSpacing:1.5},
  secondary:{borderWidth:2,borderColor:colors.borderStrong,padding:15,alignItems:"center"},
  secondaryText:{color:colors.onSurface,fontWeight:"900",letterSpacing:1.5}
});
