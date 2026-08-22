import { LegalDocumentScreen } from "@/components/legal-document-screen";
import { privacyPolicy } from "@/lib/legal-content";

export default function PrivacyScreen() {
  return <LegalDocumentScreen document={privacyPolicy} />;
}
