import { useCallback, useEffect, useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useSession } from "../../src/session";
import { API_URL, api } from "../../src/api";
import { colors, spacing } from "../../src/theme";

const php=(n:number)=>`₱${Number(n||0).toLocaleString("en-PH",{maximumFractionDigits:0})}`;

function receiptUrl(path:string, token:string){
  const encoded=String(path||"").split("/").map(encodeURIComponent).join("/");
  return encoded ? `${API_URL}/files/${encoded}?token=${encodeURIComponent(token)}` : "";
}

export default function AdminPromotions(){
  const router=useRouter();
  const {token,user}=useSession();
  const [rows,setRows]=useState<any[]>([]);
  const [busy,setBusy]=useState("");
  const [note,setNote]=useState("");

  const load=useCallback(async()=>{
    if(!token)return;
    try{setRows(await api<any[]>("/admin/promotions",{},token));}
    catch(e:any){Alert.alert("Unable to load promotions",e?.message||"Admin access required.");}
  },[token]);

  useEffect(()=>{load()},[load]);

  const review=async(id:string,approved:boolean)=>{
    if(!token)return;
    setBusy(id);
    try{
      await api(`/admin/promotions/${id}/review`,{
        method:"POST",
        body:JSON.stringify({approved,admin_note:note.trim()||null})
      },token);
      setNote("");
      await load();
      Alert.alert(approved?"Spotlight activated":"Promotion rejected",approved?"The artist is now sponsored in Discover for the paid period.":"The promotion payment was marked rejected.");
    }catch(e:any){Alert.alert("Review failed",e?.message||"Try again.");}
    finally{setBusy("")}
  };

  if(!user?.is_admin)return <View style={s.center}><Text style={s.title}>ADMIN ONLY</Text></View>;

  const pending=rows.filter(r=>r.status==="pending");
  const reviewed=rows.filter(r=>r.status!=="pending");

  return <ScrollView style={s.root} contentContainerStyle={s.content}>
    <Pressable onPress={()=>router.replace("/(tabs)/admin")}><Text style={s.back}>← ADMIN DASHBOARD</Text></Pressable>
    <Text style={s.kicker}>TINTA REVENUE</Text>
    <Text style={s.title}>PROMOTION PAYMENTS</Text>
    <Text style={s.subtitle}>{pending.length} PENDING REVIEW · {rows.length} TOTAL</Text>

    <View style={s.noteCard}>
      <Text style={s.section}>ADMIN RULE</Text>
      <Text style={s.text}>Check the GCash reference and receipt against the TINTA account before approving. Approval activates the artist's sponsored Discover placement.</Text>
      <TextInput value={note} onChangeText={setNote} placeholder="Optional admin note" placeholderTextColor={colors.muted} style={s.input}/>
    </View>

    {pending.length===0?<View style={s.empty}><Text style={s.text}>NO PENDING PROMOTION PAYMENTS.</Text></View>:pending.map((p:any)=><View key={p.id} style={s.card}>
      <View style={s.row}><Text style={s.artist}>{p.artist_name}</Text><Text style={s.badge}>PENDING</Text></View>
      <Text style={s.package}>{p.package_name}</Text>
      <Text style={s.price}>{php(p.amount)}</Text>
      <Text style={s.text}>GCash Ref: {p.gcash_reference}</Text>
      <Text style={s.text}>Submitted: {p.submitted_at?new Date(p.submitted_at).toLocaleString():""}</Text>
      {p.receipt_path&&token?<Image source={{uri:receiptUrl(p.receipt_path,token)}} style={s.receipt}/>:null}
      <View style={s.actions}>
        <Pressable disabled={busy===p.id} onPress={()=>review(p.id,true)} style={s.cta}><Text style={s.ctaText}>{busy===p.id?"WORKING...":"APPROVE & FEATURE"}</Text></Pressable>
        <Pressable disabled={busy===p.id} onPress={()=>review(p.id,false)} style={s.reject}><Text style={s.rejectText}>REJECT</Text></Pressable>
      </View>
    </View>)}

    <Text style={s.section}>REVIEWED</Text>
    {reviewed.length===0?<Text style={s.text}>No reviewed promotions yet.</Text>:reviewed.map((p:any)=><View key={p.id} style={s.reviewed}>
      <View style={s.row}><Text style={s.artist}>{p.artist_name}</Text><Text style={s.badge}>{String(p.status).toUpperCase()}</Text></View>
      <Text style={s.text}>{p.package_name} · {php(p.amount)} · Ref {p.gcash_reference}</Text>
      {p.promotion_until?<Text style={s.text}>Active until {new Date(p.promotion_until).toLocaleString()}</Text>:null}
    </View>)}
  </ScrollView>
}

const s=StyleSheet.create({
 root:{flex:1,backgroundColor:colors.surface},
 content:{padding:spacing.lg,gap:spacing.md,maxWidth:1000,width:"100%",alignSelf:"center",paddingBottom:60},
 back:{color:colors.brand,fontWeight:"900",letterSpacing:1.5},
 kicker:{color:colors.brand,fontSize:11,fontWeight:"900",letterSpacing:2,marginTop:10},
 title:{color:colors.onSurface,fontSize:34,fontWeight:"900",letterSpacing:2},
 subtitle:{color:colors.muted,fontSize:10,fontWeight:"900",letterSpacing:1.4},
 section:{color:colors.brand,fontSize:11,fontWeight:"900",letterSpacing:2},
 noteCard:{borderWidth:2,borderColor:colors.brand,padding:16,gap:9},
 card:{borderWidth:2,borderColor:colors.border,padding:18,gap:8,backgroundColor:colors.surfaceSecondary},
 row:{flexDirection:"row",justifyContent:"space-between",gap:10},
 artist:{color:colors.onSurface,fontWeight:"900",fontSize:17},
 package:{color:colors.muted,fontWeight:"800",letterSpacing:1},
 price:{color:colors.brand,fontWeight:"900",fontSize:25},
 text:{color:colors.muted,fontSize:13,lineHeight:20},
 badge:{color:colors.brand,fontSize:10,fontWeight:"900",letterSpacing:1},
 input:{backgroundColor:colors.surfaceSecondary,borderWidth:2,borderColor:colors.border,color:colors.onSurface,padding:14,minHeight:50},
 receipt:{width:"100%",height:320,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},
 actions:{flexDirection:"row",gap:10,flexWrap:"wrap"},
 cta:{backgroundColor:colors.brand,padding:15,alignItems:"center",flexGrow:1},
 ctaText:{color:colors.onBrand,fontWeight:"900",letterSpacing:1.5},
 reject:{borderWidth:2,borderColor:colors.borderStrong,padding:15,alignItems:"center",minWidth:120},
 rejectText:{color:colors.onSurface,fontWeight:"900",letterSpacing:1.5},
 empty:{borderWidth:2,borderColor:colors.border,padding:30,alignItems:"center"},
 reviewed:{borderTopWidth:1,borderTopColor:colors.border,paddingTop:13,gap:4}
});
