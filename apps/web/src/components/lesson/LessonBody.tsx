import type { Root } from "hast";
import { toJsxRuntime, type Components } from "hast-util-to-jsx-runtime";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { CodeTabs } from "./CodeTabs";
import { Diagram } from "./diagrams";

const components = {
  "cf-diagram": ({ name, caption }: { name?: string; caption?: string }) => (
    <Diagram name={name} caption={caption} />
  ),
  "cf-tabs": CodeTabs,
} as unknown as Partial<Components>;

/** Renders a lesson's processed Markdown tree (see lib/content/markdown.ts). */
export function LessonBody({ tree }: { tree: Root }) {
  return (
    <div className="lesson">
      {toJsxRuntime(tree, { Fragment, jsx, jsxs, components })}
    </div>
  );
}
