import { defineCollection, z } from 'astro:content';

const docs = defineCollection({
  schema: z.object({
    title: z.string(),
    layout: z.string().optional(),
    parent: z.string().optional(),
    grand_parent: z.string().optional(),
    nav_order: z.number().optional(),
    has_children: z.boolean().optional(),
    type: z.string().optional(),
    description: z.string().optional(),
    permalink: z.string().optional(),
    nav_exclude: z.boolean().optional(),
    search_exclude: z.boolean().optional(),
  }),
});

export const collections = { docs };
