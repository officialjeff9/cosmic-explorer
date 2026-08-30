import { redirect } from "next/navigation";

/**
 * Some preview hosts use `/error` as their fallback location. This application
 * has no standalone error screen, so preserve a working entry point by sending
 * that fallback back to the observatory dashboard.
 */
export default function PreviewErrorFallback() {
  redirect("/");
}
