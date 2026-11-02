import type { Metadata } from "next";

import { HelpView } from "@/components/help/help-view";

export const metadata: Metadata = { title: "Como funciona" };

export default function HelpPage() {
  return <HelpView />;
}
