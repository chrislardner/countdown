import "./style.css";
import { config } from "../site.config.ts";
import { formatTarget, timeLeft } from "./countdown.ts";
import { loadPhotos, shuffled, sizedUrl, SIZES, srcset, type Photo } from "./photos.ts";

const UNITS = ["days", "hours", "minutes", "seconds"] as const;

function element(id: string): HTMLElement {
  const found = document.getElementById(id);
  if (!found) throw new Error(`Missing element #${id}`);
  return found;
}

function link(text: string, href: string): HTMLAnchorElement {
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.textContent = text;
  return anchor;
}

function startClock(target: Date): void {
  const clock = element("clock");
  const done = element("done");
  const cells = UNITS.map((unit) => element(unit));

  function tick(): void {
    const left = timeLeft(target, new Date());

    if (!left) {
      clock.hidden = true;
      done.hidden = false;
      document.title = `${config.title}: ${config.doneMessage}`;
      return;
    }

    UNITS.forEach((unit, index) => {
      const value = left[unit];
      const cell = cells[index];
      if (cell) cell.textContent = unit === "days" ? String(value) : String(value).padStart(2, "0");
    });
    document.title = `${String(left.days)}d ${String(left.hours)}h · ${config.title}`;

    setTimeout(tick, (target.getTime() - Date.now()) % 1000 || 1000);
  }

  tick();
}

async function startPhotos(): Promise<void> {
  const photos = shuffled(await loadPhotos(import.meta.env.BASE_URL));
  if (photos.length === 0) return;

  const backdrop = element("backdrop");
  const credit = element("credit");
  const playButton = element("play");
  const layers = [element("layer-a"), element("layer-b")] as HTMLImageElement[];

  let index = 0;
  let layer = 0;
  let playing = true;
  let loading = false;
  let timer: number | undefined;

  function queueNext(): void {
    window.clearTimeout(timer);
    if (playing) timer = window.setTimeout(() => void move(1), config.photoSeconds * 1000);
  }

  async function show(photo: Photo): Promise<boolean> {
    layer = (layer + 1) % layers.length;
    const image = layers[layer];
    if (!image) return false;

    image.sizes = SIZES;
    image.srcset = srcset(photo);
    image.src = sizedUrl(photo, 1920);
    image.alt = photo.alt || `A ${config.topics[0] ?? "stock"} photo`;
    backdrop.style.setProperty("--photo-color", photo.color);
    try {
      await image.decode();
    } catch {
      return false;
    }

    for (const other of layers) other.classList.remove("visible");
    image.classList.add("visible");
    credit.replaceChildren(
      "Photo by ",
      link(photo.photographer, photo.photographerUrl),
      " on ",
      link("Pexels", "https://www.pexels.com"),
    );
    return true;
  }

  async function move(step: number): Promise<void> {
    if (loading) return;
    loading = true;
    const direction = step < 0 ? -1 : 1;
    try {
      for (let tries = 0; tries < photos.length; tries++) {
        index = (index + (tries === 0 ? step : direction) + photos.length) % photos.length;
        const photo = photos[index];
        if (photo && (await show(photo))) return;
      }
    } finally {
      loading = false;
      queueNext();
    }
  }

  playButton.addEventListener("click", () => {
    playing = !playing;
    playButton.textContent = playing ? "Pause" : "Play";
    queueNext();
  });
  element("back").addEventListener("click", () => void move(-1));
  element("next").addEventListener("click", () => void move(1));

  element("controls").hidden = photos.length < 2;
  await move(0);
}

const target = new Date(config.endsAt);

element("done").textContent = config.doneMessage;
element("ends").textContent = formatTarget(target);
document.title = config.title;

startClock(target);
void startPhotos();
