/**
 * Auto-discovers every module, example and exercise under src/modules.
 *
 * You never need to edit this file. Drop a new file that follows the
 * naming conventions below and it appears in the sidebar:
 *
 *   src/modules/NN-slug/README.md                       -> the lesson
 *   src/modules/NN-slug/examples/NN-Name.tsx            -> a runnable example
 *   src/modules/NN-slug/exercises/NN-slug/README.md     -> exercise instructions
 *   src/modules/NN-slug/exercises/NN-slug/Starter.tsx   -> your work goes here
 *   src/modules/NN-slug/exercises/NN-slug/Solution.tsx  -> reference solution
 *
 * Every .tsx file must `export default` a React component.
 */
import type { ComponentType } from "react";

type Loader = () => Promise<{ default: ComponentType }>;

const lessonDocs = import.meta.glob<string>("../modules/*/README.md", {
  query: "?raw",
  import: "default",
  eager: true,
});
const exerciseDocs = import.meta.glob<string>("../modules/*/exercises/*/README.md", {
  query: "?raw",
  import: "default",
  eager: true,
});
const exampleLoaders = import.meta.glob("../modules/*/examples/*.tsx") as Record<string, Loader>;
const starterLoaders = import.meta.glob("../modules/*/exercises/*/Starter.tsx") as Record<string, Loader>;
const solutionLoaders = import.meta.glob("../modules/*/exercises/*/Solution.tsx") as Record<string, Loader>;
const sources = import.meta.glob<string>("../modules/**/*.tsx", {
  query: "?raw",
  import: "default",
  eager: true,
});

export interface Example {
  id: string;
  title: string;
  load: Loader;
  source: string;
}

export interface Exercise {
  id: string;
  title: string;
  doc: string;
  loadStarter?: Loader;
  loadSolution?: Loader;
  starterSource?: string;
  solutionSource?: string;
}

export interface Module {
  id: string;
  number: string;
  title: string;
  lesson: string;
  examples: Example[];
  exercises: Exercise[];
}

/** "03-ControlledForms" -> "Controlled Forms" */
function titleFromFile(name: string): string {
  return name
    .replace(/^\d+-/, "")
    .replace(/-/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** First "# Heading" in a markdown document. */
function titleFromMarkdown(md: string, fallback: string): string {
  const match = md.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : fallback;
}

function buildModules(): Module[] {
  return Object.entries(lessonDocs)
    .map(([path, lesson]) => {
      const dir = path.replace(/\/README\.md$/, "");
      const id = dir.split("/").pop()!;
      const prefix = `${dir}/`;

      const examples: Example[] = Object.keys(exampleLoaders)
        .filter((p) => p.startsWith(`${prefix}examples/`))
        .sort()
        .map((p) => {
          const file = p.split("/").pop()!.replace(/\.tsx$/, "");
          return { id: file, title: titleFromFile(file), load: exampleLoaders[p], source: sources[p] };
        });

      const exercises: Exercise[] = Object.keys(exerciseDocs)
        .filter((p) => p.startsWith(`${prefix}exercises/`))
        .sort()
        .map((p) => {
          const exDir = p.replace(/\/README\.md$/, "");
          const exId = exDir.split("/").pop()!;
          const doc = exerciseDocs[p];
          return {
            id: exId,
            title: titleFromMarkdown(doc, titleFromFile(exId)),
            doc,
            loadStarter: starterLoaders[`${exDir}/Starter.tsx`],
            loadSolution: solutionLoaders[`${exDir}/Solution.tsx`],
            starterSource: sources[`${exDir}/Starter.tsx`],
            solutionSource: sources[`${exDir}/Solution.tsx`],
          };
        });

      return {
        id,
        number: id.split("-")[0],
        title: titleFromMarkdown(lesson, titleFromFile(id)),
        lesson,
        examples,
        exercises,
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}

export const modules: Module[] = buildModules();
