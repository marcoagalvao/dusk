import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { APP_VERSION } from "@/domain/app-data";

const root = join(import.meta.dirname, "../..");
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("documentação em dia com o código", () => {
  it("package.json, APP_VERSION e a versão mais recente do changelog coincidem", () => {
    const latest = read("CHANGELOG.md").match(/^## \[(\d+\.\d+\.\d+)\]/m)?.[1];
    expect(JSON.parse(read("package.json")).version).toBe(APP_VERSION);
    expect(latest).toBe(APP_VERSION);
  });

  it("todo documento citado no AGENTS.md existe", () => {
    const links = [...read("AGENTS.md").matchAll(/\]\(([^)]+\.md)\)/g)].map((match) => match[1]);
    expect(links.length).toBeGreaterThan(0);
    expect(links.filter((link) => !existsSync(join(root, link)))).toEqual([]);
  });

  it("toda migration está listada no DATA_MODEL.md", () => {
    const dataModel = read("docs/DATA_MODEL.md");
    const migrations = readdirSync(join(root, "supabase/migrations"));
    expect(migrations.filter((file) => !dataModel.includes(file))).toEqual([]);
  });
});
