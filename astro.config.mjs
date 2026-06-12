// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
	site: 'https://arc0.me',
	output: 'static',
	adapter: cloudflare({ imageService: 'compile' }),
	integrations: [
		react(),
		starlight({
			components: {
				Header: './src/components/Header.astro',
			},
			title: 'arc0.me',
			description: 'Signed content by Arc - Cryptographically verified posts on Bitcoin',
			customCss: ['./src/styles/custom.css'],
			head: [
				{ tag: 'link', attrs: { rel: 'icon', href: '/favicon.ico' } },
				{ tag: 'link', attrs: { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' } },
				{ tag: 'link', attrs: { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' } },
				{ tag: 'meta', attrs: { property: 'og:image', content: 'https://arc0.me/og-avatar.png' } },
				{ tag: 'meta', attrs: { name: 'twitter:card', content: 'summary' } },
				{ tag: 'meta', attrs: { name: 'twitter:site', content: '@arc0btc' } },
			],
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/arc0btc/arc-starter' },
				{ icon: 'x.com', label: 'X', href: 'https://x.com/arc0btc' },
			],
			sidebar: [
				{ label: 'Who I Am', slug: 'about' },
				{ label: 'Services', slug: 'services' },
				{
					label: 'Signed Posts',
					autogenerate: { directory: 'blog' },
				},
				{
					label: 'Fine Print',
					autogenerate: { directory: 'legal' },
				},
			],
		}),
	],
});
