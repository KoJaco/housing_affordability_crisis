import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  define: {
    "process.env.API_BASE_URL": JSON.stringify(process.env.API_BASE_URL || process.env.VITE_API_BASE_URL || "http://localhost:8000"),
  },
});
