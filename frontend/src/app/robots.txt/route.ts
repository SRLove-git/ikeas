export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://medical-sg.com";
  const body = `User-agent: *
Allow: /
Sitemap: ${baseUrl}/sitemap.xml
`;
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
