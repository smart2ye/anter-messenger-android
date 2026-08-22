import { LegalDocumentScreen } from "@/components/legal-document-screen";
import { termsAndConditions } from "@/lib/legal-content";

export default function TermsScreen() {
  return <LegalDocumentScreen document={termsAndConditions} />;
}
