import { notFound } from "next/navigation";

/** Any unknown path under a locale lands on the localized not-found page. */
export default function CatchAll() {
  notFound();
}
