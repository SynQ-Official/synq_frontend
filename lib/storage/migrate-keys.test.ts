import { describe, expect, it } from "vitest";
import { migrateLegacyKeys } from "./migrate-keys";

/** A minimal in-memory Storage, enough for the migration's reads, writes and key listing. */
class MemoryStorage {
  private data = new Map<string, string>();
  get length() {
    return this.data.size;
  }
  key(index: number) {
    return [...this.data.keys()][index] ?? null;
  }
  getItem(key: string) {
    return this.data.has(key) ? (this.data.get(key) as string) : null;
  }
  setItem(key: string, value: string) {
    this.data.set(key, String(value));
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
  dump() {
    return Object.fromEntries(this.data);
  }
}

const asStorage = (s: MemoryStorage) => s as unknown as Storage;

describe("migrateLegacyKeys", () => {
  it("copies a legacy value to its synq key and removes the legacy one", () => {
    const s = new MemoryStorage();
    s.setItem("vitamind-language", "ar");
    s.setItem("vitamind_user", '{"id":"u1"}');
    migrateLegacyKeys(asStorage(s));
    expect(s.dump()).toEqual({ "synq-language": "ar", synq_user: '{"id":"u1"}' });
  });

  it("does not overwrite an existing synq key, but still removes the legacy one", () => {
    const s = new MemoryStorage();
    s.setItem("synq-language", "en");
    s.setItem("vitamind-language", "ar");
    migrateLegacyKeys(asStorage(s));
    expect(s.dump()).toEqual({ "synq-language": "en" });
  });

  it("is idempotent: a second run changes nothing", () => {
    const s = new MemoryStorage();
    s.setItem("vitamind_profile_cache", "{}");
    migrateLegacyKeys(asStorage(s));
    const after = s.dump();
    migrateLegacyKeys(asStorage(s));
    expect(s.dump()).toEqual(after);
  });

  it("keeps the suffix of per-user keys", () => {
    const s = new MemoryStorage();
    s.setItem("vitamind_journal_draft:abc", "draft text");
    s.setItem("vitamind_lang_synced:abc", "1");
    migrateLegacyKeys(asStorage(s));
    expect(s.dump()).toEqual({ "synq_journal_draft:abc": "draft text", "synq_lang_synced:abc": "1" });
  });

  it("ignores unrelated keys", () => {
    const s = new MemoryStorage();
    s.setItem("theme", "dark");
    s.setItem("synq_user", "{}");
    s.setItem("vitamindish", "x");
    migrateLegacyKeys(asStorage(s));
    expect(s.dump()).toEqual({ theme: "dark", synq_user: "{}", vitamindish: "x" });
  });

  it("survives a storage that throws, without throwing", () => {
    const broken = {
      get length() {
        throw new Error("denied");
      },
      key() {
        throw new Error("denied");
      },
    } as unknown as Storage;
    expect(() => migrateLegacyKeys(broken)).not.toThrow();
  });

});
