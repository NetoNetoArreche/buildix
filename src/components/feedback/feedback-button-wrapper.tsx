"use client";

import { usePathname } from "next/navigation";
import { FeedbackButton } from "./feedback-button";

export function FeedbackButtonWrapper() {
  const pathname = usePathname();

  // Don't show on the feedback page itself (already has the button)
  // Don't show on editor pages
  if (pathname === "/feedback" || pathname.startsWith("/editor")) {
    return null;
  }

  return <FeedbackButton />;
}
