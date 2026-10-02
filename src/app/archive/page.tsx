import type { Metadata } from "next";

import { ArchiveView } from "@/components/archive/archive-view";

export const metadata: Metadata = { title: "Arquivo" };

export default function ArchivePage() {
  return <ArchiveView />;
}
