import { NextResponse, type NextRequest } from "next/server";
import { HIRE_PROJECTS } from "@/content/build-to-hire";
import { routing } from "@/i18n/routing";
import { loadLesson } from "@/lib/content/markdown";
import { deny, requirePro } from "@/lib/pro-gate";

/** Walkthroughs live in content/build-to-hire/<locale>/<slug>.md. */
const HIRE_GUIDES = "build-to-hire";

/**
 * GET /api/hire/{slug}?locale=bn — a project's full walkthrough, for Pro readers only.
 * Project pages are static and ship only the walkthrough's outline; the text comes from
 * here, with the reader's access token.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (!HIRE_PROJECTS.some((p) => p.slug === slug)) return deny(404, "not_found");
  const denied = await requirePro(req);
  if (denied) return denied;

  const asked = req.nextUrl.searchParams.get("locale");
  const locale =
    routing.locales.find((l) => l === asked) ?? routing.defaultLocale;
  const other = routing.locales.find((l) => l !== locale)!;
  const own = await loadLesson(HIRE_GUIDES, locale, slug);
  const guide = own ?? (await loadLesson(HIRE_GUIDES, other, slug));
  if (!guide) return deny(404, "not_written");
  return NextResponse.json(
    { tree: guide.tree, fallback: !own },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
