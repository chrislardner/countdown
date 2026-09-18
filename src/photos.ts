export interface Photo {
  url: string;
  alt: string;
  color: string;
  photographer: string;
  photographerUrl: string;
  pageUrl: string;
}

const WIDTHS = [960, 1440, 1920, 2560];

export const SIZES = "100vw";

export function srcset(photo: Photo): string {
  return WIDTHS.map((width) => `${sizedUrl(photo, width)} ${width}w`).join(", ");
}

export function sizedUrl(photo: Photo, width: number): string {
  return `${photo.url}?auto=compress&cs=tinysrgb&w=${String(width)}`;
}

export async function loadPhotos(basePath: string): Promise<Photo[]> {
  try {
    const photos: unknown = await (await fetch(`${basePath}photos.json`)).json();
    if (Array.isArray(photos) && photos.length > 0) return photos as Photo[];
  } catch {
  }
  console.warn(
    "No photos loaded. The Pexels fetch runs with the build — check the terminal running Vite.",
  );
  return [];
}

export function shuffled<T>(items: readonly T[]): T[] {
  const list = [...items];
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j] as T, list[i] as T];
  }
  return list;
}
