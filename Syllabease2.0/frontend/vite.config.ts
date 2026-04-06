import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import path from "path"
import flowbiteReact from "flowbite-react/plugin/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    flowbiteReact(), // ✅ no /vite suffix
  ],
  server: {
    proxy: {
      "/api": "sea-lion-app-9h2ja.ondigitalocean.app", // adjust if Django runs elsewhere
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist", // ✅ Vercel expects the build output folder here
  },
  base: "/",
});