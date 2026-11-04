import { NextResponse, type NextRequest } from "next/server";
import { findChapter, isFreeGroup } from "@/content/course";
import { getCourse } from "@/content/courses";
import { routing } from "@/i18n/routing";
import { loadLesson } from "@/lib/content/markdown";
import { deny, requirePro } from "@/lib/pro-gate";

/**
 * GET /api/lessons/{course}/{chapter}?locale=bn — a Pro chapter's body, for Pro readers.
 * Chapter pages are static, so Pro chapters ship without their text; the page asks here
 * with the reader's access token, and the Go API says who they are.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ course: string; chapter: string }> },
) {
  const { course: slug, chapter } = await params;
  const course = getCourse(slug);
  const hit = course && findChapter(course, chapter);
  if (!course || !hit) return deny(404, "not_found");

  if (!isFreeGroup(course, hit.chapter.group)) {
    const denied = await requirePro(req);
    if (denied) return denied;
  }

  const asked = req.nextUrl.searchParams.get("locale");
  const locale =
    routing.locales.find((l) => l === asked) ?? routing.defaultLocale;
  const other = routing.locales.find((l) => l !== locale)!;
  const own = await loadLesson(course.slug, locale, chapter);
  const lesson = own ?? (await loadLesson(course.slug, other, chapter));
  if (!lesson) return deny(404, "not_written");

  const fm = lesson.frontmatter;
  return NextResponse.json(
    {
      tree: lesson.tree,
      sections: lesson.sections,
      id: typeof fm.id === "string" ? fm.id : null,
      xp: typeof fm.xp === "number" ? fm.xp : 10,
      fallback: !own,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
