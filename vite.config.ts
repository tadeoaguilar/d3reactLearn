import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // The app bundles every lesson and source file as text (for the
  // "view source" panels), so the main chunk is large on purpose.
  build: { chunkSizeWarningLimit: 2000 },
});
