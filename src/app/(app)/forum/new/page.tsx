import type { Metadata } from "next";
import { ForumNewTopicPage } from "@/components/forum/ForumNewTopicPage";

export const metadata: Metadata = {
  title: "Start a Discussion | DevForum",
  description: "Start a developer discussion and add rich context with code, images, links, or files.",
};

export default function NewForumDiscussionPage() {
  return <ForumNewTopicPage />;
}
