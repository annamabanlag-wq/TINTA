import { useEffect, useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useSession } from "../../src/session";
import { api, uploadImage } from "../../src/api";
import { colors, spacing } from "../../src/theme";

type Package = { id: string; name: string; price: number; days: number; description: string };

const php = (n:number) => `₱${Number(n || 0).toLocaleString("en-PH", { maximumFractionDigits: 0 })}`;

export default function PromoteArtist() {
  const router = useRouter();
  const { token } = useSession();
  const [packages, setPackages] = useState<Package[]>([]);
  const [gcashName, setGcashName] = useState("TINTA");
  const [gcashNumber, setGcashNumber] = useState("09381447214");
  const [history, setHistory] = useState<any[]>([]);
  const [selected, setSelected] = useState("spotlight_7d");
  const [reference, setReference] = useState("");
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [receiptPath, setReceiptPath] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    if (!token) return;
    try {
      setError("");
      const [catalog, rows] = await Promise.all([
        api<any>("/artist/promotions/packages", {}, token),
        api<any[]>("/artist/promotions", {}, token),
      ]);
      setPackages(catalog.packages || []);
      setGcashName(catalog.gcash_name || "TINTA");
      setGcashNumber(catalog.gcash_number || "09381447214");
      setHistory(rows || []);
      if ((catalog.packages || []).length && !(catalog.packages || []).some((p:Package) => p.id === selected)) {
        setSelected(catalog.packages[0].id);
      }
    } catch (e:any) {
      setError(e?.message || "Could not load promotion options.");
    }
  };

  useEffect(() => { load(); }, [token]);

  const pickReceipt = async () => {
    if (!token || busy) return;
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted && typeof window === "undefined") {
        setError("Photo library permission is required.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: false,
        quality: 0.9,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0] as any;
      setBusy(true);
      const filename = asset.file?.name || `tinta-spotlight-${Date.now()}.jpg`;
      const out = await uploadImage(asset.uri, token, filename, asset.file);
      if (!out?.path) throw new Error("Receipt upload did not return a valid path.");
      setReceiptUri(asset.uri);
      setReceiptPath(out.path);
      setError("");
    } catch (e:any) {
      setError(e?.message || "Could not upload your GCash receipt.");
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (!token) { setError("Please sign in as an approved TINTA artist."); return; }
    if (!selected) { setError("Choose a promotion package."); return; }
    if (!reference.trim()) { setError("Enter your GCash reference number."); return; }
    if (!receiptPath) { setError("Upload your GCash payment receipt."); return; }
    setError("");
    setBusy(true);
    try {
      await api("/artist/promotions", {
        method: "POST",
        body: JSON.stringify({
          package_id: selected,
          gcash_reference: reference.trim(),
          receipt_path: receiptPath,
        }),
      }, token);
      setReference("");
      setReceiptUri(null);
      setReceiptPath("");
      Alert.alert("Promotion submitted", "Your Spotlight request is pending TINTA admin payment verification.");
      await load();
    } catch (e:any) {
      setError(e?.message || "Could not submit promotion request.");
    } finally {
      setBusy(false);
    }
  };

  const active = history.find((x:any) => x.status === "approved" && x.promotion_until && new Date(x.promotion_until).getTime() > Date.now());
  const selectedPackage = packages.find((p) => p.id === selected);

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content}>
      <Pressable onPress={() => router.replace("/artist/portal")}><Text style={s.back}>← ARTIST PORTAL</Text></Pressable>
      <Text style={s.kicker}>TINTA ARTIST GROWTH</Text>
      <Text style={s.title}>PROMOTE MY PROFILE</Text>
      <Text style={s.subtitle}>GET MORE VISIBILITY · KEEP CUSTOMER BROWSING FREE</Text>

      {active ? (
        <View style={s.active}>
          <Text style={s.activeKicker}>SPOTLIGHT ACTIVE</Text>
          <Text style={s.activeTitle}>FEATURED IN DISCOVER</Text>
          <Text style={s.text}>Your sponsored placement is active until {new Date(active.promotion_until).toLocaleString()}.</Text>
        </View>
      ) : null}

      <View style={s.card}>
        <Text style={s.section}>CHOOSE YOUR SPOTLIGHT</Text>
        {packages.map((p) => {
          const on = p.id === selected;
          return (
            <Pressable key={p.id} onPress={() => setSelected(p.id)} style={[s.package, on && s.packageOn]}>
              <View style={s.row}>
                <Text style={s.packageTitle}>{p.name}</Text>
                <Text style={s.price}>{php(p.price)}</Text>
              </View>
              <Text style={s.text}>{p.description}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={s.card}>
        <Text style={s.section}>PAY BY GCASH</Text>
        <Text style={s.payTitle}>SEND {selectedPackage ? php(selectedPackage.price) : "THE PACKAGE PRICE"} TO</Text>
        <Image source={require("../../assets/GCash-MyQR-12092026210418.PNG.jpg")} style={s.qr} resizeMode="contain" />
        <Text style={s.merchant}>{gcashName}</Text>
        <Text style={s.number}>GCash: {gcashNumber}</Text>
        <Text style={s.text}>After payment, upload the receipt and enter the GCash reference number. Your profile is not promoted until an admin verifies the payment.</Text>
        <TextInput testID="promotion-gcash-reference" value={reference} onChangeText={setReference} placeholder="GCash Reference Number *" placeholderTextColor={colors.muted} style={s.input} autoCapitalize="characters" />
        {receiptUri ? (
          <View style={s.receiptWrap}>
            <Image source={{ uri: receiptUri }} style={s.receipt} />
            <Pressable disabled={busy} onPress={() => { setReceiptUri(null); setReceiptPath(""); }} style={s.secondary}><Text style={s.secondaryText}>REMOVE RECEIPT</Text></Pressable>
          </View>
        ) : (
          <Pressable testID="promotion-pick-receipt" disabled={busy} onPress={pickReceipt} style={s.upload}>
            <Text style={s.uploadText}>{busy ? "UPLOADING..." : "SELECT GCASH RECEIPT"}</Text>
          </Pressable>
        )}
        {!!error && <Text style={s.error}>{error.toUpperCase()}</Text>}
        <Pressable testID="promotion-submit" disabled={busy || !selectedPackage} onPress={submit} style={[s.cta, busy && { opacity: 0.5 }]}>
          <Text style={s.ctaText}>{busy ? "SUBMITTING..." : `REQUEST ${selectedPackage ? php(selectedPackage.price) : ""} SPOTLIGHT`}</Text>
        </Pressable>
      </View>

      <View style={s.card}>
        <Text style={s.section}>PROMOTION HISTORY</Text>
        {history.length === 0 ? <Text style={s.text}>No promotion payments yet.</Text> : history.map((p:any) => (
          <View key={p.id} style={s.history}>
            <View style={s.row}><Text style={s.packageTitle}>{p.package_name}</Text><Text style={s.badge}>{String(p.status).toUpperCase()}</Text></View>
            <Text style={s.text}>{php(p.amount)} · Ref {p.gcash_reference}</Text>
            {p.promotion_until ? <Text style={s.text}>Active until {new Date(p.promotion_until).toLocaleString()}</Text> : null}
            {p.admin_note ? <Text style={s.note}>ADMIN: {p.admin_note}</Text> : null}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:{flex:1,backgroundColor:colors.surface},
  content:{padding:spacing.lg,gap:spacing.md,maxWidth:900,width:"100%",alignSelf:"center",paddingBottom:60},
  back:{color:colors.brand,fontWeight:"900",letterSpacing:1.5},
  kicker:{color:colors.brand,fontSize:11,fontWeight:"900",letterSpacing:2,marginTop:10},
  title:{color:colors.onSurface,fontSize:36,fontWeight:"900",letterSpacing:2},
  subtitle:{color:colors.muted,fontSize:11,fontWeight:"800",letterSpacing:1.5},
  section:{color:colors.brand,fontSize:11,fontWeight:"900",letterSpacing:2},
  card:{borderWidth:2,borderColor:colors.border,padding:18,gap:10},
  active:{borderWidth:2,borderColor:colors.brand,padding:18,gap:6,backgroundColor:colors.surfaceSecondary},
  activeKicker:{color:colors.brand,fontSize:10,fontWeight:"900",letterSpacing:2},
  activeTitle:{color:colors.onSurface,fontSize:22,fontWeight:"900",letterSpacing:1},
  package:{borderWidth:2,borderColor:colors.border,padding:16,gap:7,backgroundColor:colors.surfaceSecondary},
  packageOn:{borderColor:colors.brand},
  row:{flexDirection:"row",justifyContent:"space-between",gap:12,alignItems:"center"},
  packageTitle:{color:colors.onSurface,fontWeight:"900",fontSize:14,flex:1},
  price:{color:colors.brand,fontWeight:"900",fontSize:18},
  payTitle:{color:colors.onSurface,fontWeight:"900",textAlign:"center",letterSpacing:1.5},
  qr:{width:230,height:230,alignSelf:"center"},
  merchant:{color:colors.onSurface,fontSize:17,fontWeight:"900",textAlign:"center"},
  number:{color:colors.muted,textAlign:"center",fontWeight:"800"},
  text:{color:colors.muted,fontSize:13,lineHeight:20},
  input:{backgroundColor:colors.surfaceSecondary,borderWidth:2,borderColor:colors.border,color:colors.onSurface,padding:14,fontSize:15,minHeight:52},
  upload:{borderWidth:2,borderColor:colors.border,borderStyle:"dashed",paddingVertical:22,alignItems:"center"},
  uploadText:{color:colors.onSurface,fontWeight:"900",letterSpacing:1.5},
  receiptWrap:{gap:10},
  receipt:{width:"100%",height:260,backgroundColor:colors.surfaceSecondary},
  cta:{backgroundColor:colors.brand,padding:17,alignItems:"center"},
  ctaText:{color:colors.onBrand,fontWeight:"900",letterSpacing:1.5},
  secondary:{borderWidth:2,borderColor:colors.borderStrong,padding:14,alignItems:"center"},
  secondaryText:{color:colors.onSurface,fontWeight:"900",letterSpacing:1.3},
  error:{color:colors.error,fontSize:11,fontWeight:"900",letterSpacing:1},
  badge:{color:colors.brand,fontSize:10,fontWeight:"900",letterSpacing:1},
  history:{borderTopWidth:1,borderTopColor:colors.border,paddingTop:12,gap:5},
  note:{color:colors.brand,fontSize:11,fontWeight:"800"},
});
