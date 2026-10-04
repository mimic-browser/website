import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    author: z.string(),
    authorRole: z.string().optional(),
    cover: z.string().optional(),
    coverAlt: z.string().default(""),
    published: z.coerce.date(),
    lang: z.enum(["ru", "en"]).default("en"),
    category: z.string(),
  }),
});

export const collections = { blog };
