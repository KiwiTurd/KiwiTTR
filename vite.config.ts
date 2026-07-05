import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import svgr from "vite-plugin-svgr";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    svgr(),
  ],

  define: {
    __APP_VERSION__: JSON.stringify(
      process.env.npm_package_version ?? "dev"
    ),
  },
});