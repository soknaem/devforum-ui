import type { Metadata } from "next";
import { ForumTopicPage } from "@/components/forum/ForumTopicPage";

export const metadata: Metadata = {
  title: "Discussion | DevForum",
  description: "Read and contribute to a developer discussion on DevForum.",
};

export default function ForumDiscussionPage() {
  return <ForumTopicPage />;
}
