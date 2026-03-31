import { defineCollection, z } from 'astro:content';

const articles = defineCollection({
  type: 'content',
  schema: z.object({
    title:    z.string(),
    subtitle: z.string().optional(),
    date:     z.string(),
    author:   z.string().default('mamed/rifqy'),
    tags:     z.array(z.string()).default([]),
    coverImage: z.string().optional(),
    mapData:  z.string().optional(),
    draft:    z.boolean().default(false),
  }),
});

export const collections = { articles };
