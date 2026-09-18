import { mkdir, writeFile } from "node:fs/promises";
import type { Photo } from "../src/photos.ts";

const SEARCH_URL = "https://api.pexels.com/v1/search";
const PER_PAGE = 80;
const MAX_PAGE = 15;

interface PexelsPhoto {
  src: { original: string };
  alt: string;
  avg_color: string;
  photographer: string;
  photographer_url: string;
  url: string;
}

interface SearchResult {
  photos: PexelsPhoto[];
  totalResults: number;
}

async function search(apiKey: string, topic: string, page: number): Promise<SearchResult> {
  const url = `${SEARCH_URL}?query=${encodeURIComponent(topic)}&per_page=${String(PER_PAGE)}&page=${String(page)}&orientation=landscape`;
  const response = await fetch(url, { headers: { Authorization: apiKey } });

  if (!response.ok) {
    const reason =
      response.status === 401 ? "the API key was rejected" : `HTTP ${String(response.status)}`;
    throw new Error(`Pexels search for "${topic}" failed: ${reason}`);
  }
  const body = (await response.json()) as { photos: PexelsPhoto[]; total_results: number };
  return { photos: body.photos, totalResults: body.total_results };
}

function randomPage(lastPage: number): number {
  return 1 + Math.floor(Math.random() * Math.max(1, lastPage));
}

function toPhoto(photo: PexelsPhoto): Photo {
  return {
    url: photo.src.original,
    alt: photo.alt,
    color: photo.avg_color,
    photographer: photo.photographer,
    photographerUrl: photo.photographer_url,
    pageUrl: photo.url,
  };
}

export async function collectPhotos(apiKey: string, topics: readonly string[]): Promise<Photo[]> {
  const photos: Photo[] = [];

  for (const topic of topics) {
    let result = await search(apiKey, topic, randomPage(MAX_PAGE));

    if (result.photos.length === 0) {
      const lastPage = Math.ceil(result.totalResults / PER_PAGE);
      result = await search(apiKey, topic, randomPage(Math.min(lastPage, MAX_PAGE)));
    }
    if (result.photos.length === 0) {
      throw new Error(`Pexels has no landscape photos for "${topic}". Try a different topic.`);
    }
    photos.push(...result.photos.map(toPhoto));
  }

  return photos;
}

export async function writePhotos(output: URL, photos: Photo[]): Promise<void> {
  await mkdir(new URL(".", output), { recursive: true });
  await writeFile(output, JSON.stringify(photos));
}

export async function fetchPhotos(apiKey: string, topics: readonly string[], output: URL) {
  const photos = await collectPhotos(apiKey, topics);
  await writePhotos(output, photos);
  return photos.length;
}
