import { BACKEND_FIRST_PRINCIPLES } from "./backend-first-principles";
import type { Course } from "./course";
import { DEVOPS_CLOUD } from "./devops-cloud";
import { DSA } from "./dsa";
import { NETWORKING } from "./networking";
import { OPERATING_SYSTEM } from "./operating-system";
import { PROGRAMMING } from "./programming";
import { SYSTEM_DESIGN } from "./system-design";

/** Every course with a route. Add a new track here (and its `ns` messages) to publish it. */
export const COURSES: Course[] = [
  PROGRAMMING,
  DSA,
  BACKEND_FIRST_PRINCIPLES,
  OPERATING_SYSTEM,
  NETWORKING,
  DEVOPS_CLOUD,
  SYSTEM_DESIGN,
];

export const getCourse = (slug: string) => COURSES.find((c) => c.slug === slug);
