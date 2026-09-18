import { defineConfig, loadEnv, type Plugin } from "vite";
import { fetchPhotos, writePhotos } from "./build/fetch-photos.ts";
import { config } from "./site.config.ts";

const MANIFEST = new URL("public/photos.json", import.meta.url);

function photos(apiKey: string | undefined): Plugin {
  return {
    name: "photos",
    async buildStart() {
      if (!apiKey) {
        this.warn(
          "\nNo PEXELS_API_KEY, so the page will have no photos." +
            "\nPut  PEXELS_API_KEY=your-key  in a file called .env.local (with the leading dot)." +
            "\nFree keys: https://www.pexels.com/api/\n",
        );
        await writePhotos(MANIFEST, []);
        return;
      }
      try {
        const count = await fetchPhotos(apiKey, config.topics, MANIFEST);
        this.info(`Fetched ${String(count)} photos from Pexels.`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (process.env["CI"]) this.error(message);
        this.warn(message);
        await writePhotos(MANIFEST, []);
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  const apiKey =
    process.env["PEXELS_API_KEY"] ?? loadEnv(mode, process.cwd(), "")["PEXELS_API_KEY"];

  return {
    base: process.env["BASE_PATH"] ?? "/",
    plugins: [photos(apiKey?.trim() || undefined)],
    build: { target: "es2022" },
  };
});
