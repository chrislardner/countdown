import { afterEach, describe, expect, it, vi } from "vitest";
import { collectPhotos } from "./fetch-photos.ts";

const pexelsPhoto = {
  src: { original: "https://images.pexels.com/photos/1/kitten.jpeg" },
  alt: "A kitten",
  avg_color: "#8a8578",
  photographer: "Test Photographer",
  photographer_url: "https://www.pexels.com/@test",
  url: "https://www.pexels.com/photo/1/",
};

function stubPexels(pages: Record<number, number>, totalResults: number) {
  const requested: number[] = [];
  vi.stubGlobal("fetch", (url: string) => {
    const page = Number(new URL(url).searchParams.get("page"));
    requested.push(page);
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          photos: Array.from({ length: pages[page] ?? 0 }, () => pexelsPhoto),
          total_results: totalResults,
        }),
    });
  });
  return requested;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("collectPhotos", () => {
  it("returns the photos from the page it lands on", async () => {
    stubPexels({ 1: 80, 2: 80, 3: 80 }, 240);
    const photos = await collectPhotos("key", ["kittens"]);
    expect(photos).toHaveLength(80);
    expect(photos[0]).toEqual({
      url: "https://images.pexels.com/photos/1/kitten.jpeg",
      alt: "A kitten",
      color: "#8a8578",
      photographer: "Test Photographer",
      photographerUrl: "https://www.pexels.com/@test",
      pageUrl: "https://www.pexels.com/photo/1/",
    });
  });

  it("retries within range when the random page is past the last one", async () => {
    const requested = stubPexels({ 1: 80, 2: 40 }, 120);
    const photos = await collectPhotos("key", ["kittens"]);
    expect(photos.length).toBeGreaterThan(0);
    expect(requested.at(-1)).toBeLessThanOrEqual(2);
  });

  it("explains itself when a topic has no photos at all", async () => {
    stubPexels({}, 0);
    await expect(collectPhotos("key", ["notathing"])).rejects.toThrow(/no landscape photos/);
  });

  it("says so when the key is rejected", async () => {
    vi.stubGlobal("fetch", () => Promise.resolve({ ok: false, status: 401 }));
    await expect(collectPhotos("bad", ["kittens"])).rejects.toThrow(/key was rejected/);
  });
});
