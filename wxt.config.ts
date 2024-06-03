import { defineConfig } from "wxt";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: {
    host_permissions: ["*://*.readwise.io/*", "*://*.qq.com/*"],
    permissions: ["cookies", "webRequest", "storage", "tabs"],
  },
  runner: {
    chromiumProfile: resolve("../Profile"),
  },
  vite: () => ({
    plugins: [react()],
  }),
});
