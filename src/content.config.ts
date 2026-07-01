import { defineCollection } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';
import { z } from 'astro:schema';

export const collections = {
	docs: defineCollection({
		loader: docsLoader(),
		schema: docsSchema({
			extend: z.object({
				date: z.date().optional(),
				updated: z.date().optional(),
				published_at: z.date().optional(),
				tags: z.array(z.string()).optional(),
				signatures: z.record(z.any()).optional(),
				draft: z.boolean().optional(),
			}),
		}),
	}),
};
