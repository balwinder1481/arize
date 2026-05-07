import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
	],
	optimizeDeps: {
		include: [
			'dayjs',
			'@reown/appkit',
			'@reown/appkit-adapter-wagmi',
		],
	},
	ssr: {
		noExternal: ['svelte-sonner'],
	},
});
