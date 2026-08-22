import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { IconSymbol } from "@/components/ui/icon-symbol";
import type { LegalDocument } from "@/lib/legal-content";
import { ScreenContainer } from "@/components/screen-container";

export function LegalDocumentScreen({ document }: { document: LegalDocument }) {
  const router = useRouter();

  function goBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/login" as never);
  }

  return (
    <ScreenContainer containerClassName="bg-[#071526]" className="px-4" edges={["top", "bottom", "left", "right"]}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="رجوع" onPress={goBack} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <IconSymbol name="chevron.right" size={23} color="#D7ECFF" />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>{document.eyebrow}</Text>
          <Text style={styles.title}>{document.title}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}><IconSymbol name="lock.fill" size={22} color="#CFE9FF" /></View>
          <Text style={styles.summary}>{document.summary}</Text>
          <Text style={styles.updatedAt}>آخر تحديث: {document.updatedAt}</Text>
        </View>

        {document.sections.map((section, index) => (
          <View key={section.title} style={styles.section}>
            <View style={styles.sectionHeading}><Text style={styles.sectionNumber}>{String(index + 1).padStart(2, "0")}</Text><Text style={styles.sectionTitle}>{section.title}</Text></View>
            {section.paragraphs.map((paragraph) => <Text key={paragraph} style={styles.paragraph}>{paragraph}</Text>)}
          </View>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { minHeight: 72, flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: 1, borderBottomColor: "#193550" },
  backButton: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#102A45" },
  headerCopy: { flex: 1 },
  eyebrow: { color: "#74BFFF", fontSize: 11, fontWeight: "800", textAlign: "right" },
  title: { color: "#F3F8FF", fontSize: 20, fontWeight: "900", marginTop: 2, textAlign: "right" },
  content: { paddingVertical: 16, paddingBottom: 30, gap: 12 },
  heroCard: { alignItems: "flex-end", padding: 16, borderRadius: 20, borderWidth: 1, borderColor: "#2B5279", backgroundColor: "#0D2138" },
  heroIcon: { width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "#1B4E78" },
  summary: { color: "#D9EBFC", fontSize: 14, lineHeight: 23, marginTop: 12, textAlign: "right", writingDirection: "rtl" },
  updatedAt: { color: "#8CA8C7", fontSize: 11, marginTop: 12, textAlign: "right" },
  section: { padding: 16, borderRadius: 20, borderWidth: 1, borderColor: "#1D3854", backgroundColor: "#0A1A2D" },
  sectionHeading: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 8, marginBottom: 9 },
  sectionNumber: { color: "#7FC4FF", fontSize: 11, fontWeight: "900" },
  sectionTitle: { color: "#ECF6FF", fontSize: 16, fontWeight: "900", textAlign: "right" },
  paragraph: { color: "#B4C8DE", fontSize: 13, lineHeight: 22, marginTop: 8, textAlign: "right", writingDirection: "rtl" },
  pressed: { opacity: 0.76, transform: [{ scale: 0.97 }] },
});
