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

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    description: z.string(),
    date: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().default('ZoomPhant Engineering'),
    authorRole: z.string().optional(),
    category: z.string().default('Engineering'),
    tags: z.array(z.string()).default([]),
    readingTime: z.string().optional(),
    featured: z.boolean().default(false),
    coverImage: z.string().optional(),
  }),
});

export const collections = { docs, blog };
