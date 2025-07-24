// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // redirige /api/** → http://localhost:4000/api/**
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
        secure: false,
        // rewrite: path => path.replace(/^\/api/, "") 
        // si tes routes back n'ont pas /api en préfixe, tu peux décommenter et adapter
      },
    },
  },
});
