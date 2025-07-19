import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
	plugins: [react()],
	base: '/',
	server: {
		port: 4173,
		host: true,
	},
	preview: {
		port: 4173,
		host: true,
	},
	optimizeDeps: {
		exclude: ["lucide-react"],
	},
});
