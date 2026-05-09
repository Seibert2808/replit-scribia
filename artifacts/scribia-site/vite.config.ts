import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

const basePath = process.env.BASE_PATH || "/";

export default defineConfig({
  base: basePath,
  server: {
    host: "0.0.0.0",
    port: Number(process.env.PORT) || 18778,
    allowedHosts: true,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
  },
});
