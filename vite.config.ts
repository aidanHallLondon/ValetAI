import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import viteFaviconPlugin from "vite-plugin-favicon-generator";
import path from "node:path";

export default defineConfig({
  root: path.resolve(__dirname, "src/ui"),
  publicDir: path.resolve(__dirname, "public"),
  plugins: [
    react(),
    viteFaviconPlugin({
      source: path.resolve(__dirname, "public/icon.svg"),
      outputDir: path.resolve(__dirname, "public"),
      publicPath: "/",
      injectHtml: false,
      appName: "Valet",
      appDescription: "Your Personal Algorithm",
      developerName: "Valet",
    }),
  ],
  build: {
    outDir: path.resolve(__dirname, "dist/ui"),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
  },
});

