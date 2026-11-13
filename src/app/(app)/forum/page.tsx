import type { Metadata } from "next";
import { ForumBrowser } from "@/components/forum/ForumBrowser";

export const metadata: Metadata = {
  title: "Developer Forum | DevForum",
  description: "Browse developer discussions by topic and share code, images, links, and resources with the community.",
};

export default function ForumPage() {
  return <ForumBrowser />;
}
