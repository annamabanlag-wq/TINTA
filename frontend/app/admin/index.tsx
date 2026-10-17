import { ScrollView, View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { colors, spacing } from "../../src/theme";
import AdminHeader from "../../src/AdminHeader";

const sections = [
  { title: "Artist applications", detail: "Review and approve artist registrations", route: "/admin/artist-applications" },
  { title: "Artists", detail: "Manage artist accounts and profiles", route: "/admin/artists" },
  { title: "Customers", detail: "Review and manage customer accounts", route: "/admin/users" },
  { title: "Bookings", detail: "Review bookings and payment status", route: "/admin/bookings" },
  { title: "Payments", detail: "Verify InstaPay QR receipts and payment references", route: "/admin/payments" },
];

export default function AdminDashboardScreen() {
  const router = useRouter();

  return (
    <View style={styles.root}>
      <AdminHeader title="TINTA ADMIN" testID="admin-dashboard-title" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Management dashboard</Text>
        <Text style={styles.subheading}>Choose an area to manage. Admin access is required.</Text>
        {sections.map((section) => (
          <Pressable
            key={section.route}
            accessibilityRole="button"
            onPress={() => router.push(section.route as any)}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
          >
            <View style={styles.copy}>
              <Text style={styles.cardTitle}>{section.title}</Text>
              <Text style={styles.detail}>{section.detail}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md },
  heading: { color: colors.onSurface, fontSize: 24, fontWeight: "900" },
  subheading: { color: colors.muted, fontSize: 13, lineHeight: 19, marginBottom: spacing.sm },
  card: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.lg, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.surfaceSecondary },
  pressed: { opacity: 0.75 },
  copy: { flex: 1, gap: 4 },
  cardTitle: { color: colors.onSurface, fontSize: 16, fontWeight: "800" },
  detail: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  arrow: { color: colors.brand, fontSize: 30, fontWeight: "700" },
});
