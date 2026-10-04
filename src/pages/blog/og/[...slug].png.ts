import { getCollection } from "astro:content";
import type { APIRoute } from "astro";
import { createBlogOg } from "@/lib/blog-og";

export async function getStaticPaths() {
  return (await getCollection("blog")).map(post => ({ params: { slug: post.id }, props: { post } }));
}

export const GET: APIRoute = async ({ props }) => {
  const { png } = await createBlogOg(props.post.data);
  return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png" } });
};
