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
    featured: z.boolean().default(false),
    /** Which cluster (see src/data/clusters.ts) the post belongs to. */
    cluster:  z.string().default('thesis'),
    /** Thesis section this post mainly draws on, e.g. "4.9". Used to order posts inside a cluster. */
    chapter:  z.string().optional(),
  }),
});

export const collections = { articles };
