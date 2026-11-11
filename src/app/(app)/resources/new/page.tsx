"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useCreateResourceWithMediaMutation } from "@/lib/api";
import { ResourceBodyEditor, type EditableContentBlock } from "@/components/resource/ResourceBodyEditor";
const types = ["BOOK", "CODE", "LINK", "VIDEO", "ARTICLE"];
export default function NewResourcePage() {
  const router = useRouter();
  const [createMedia, { isLoading: mediaLoading }] = useCreateResourceWithMediaMutation();
  const [form, setForm] = useState({
    title: "",
    url: "",
    type: "ARTICLE",
    status: "PUBLISHED",
    categoryId: "",
    tags: "",
  });
  const [bodyBlocks, setBodyBlocks] = useState<EditableContentBlock[]>([
    { id: "content-1", type: "TEXT", text: "" },
  ]);
  const loading = mediaLoading;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const tags = form.tags.split(",").map((value) => value.trim()).filter(Boolean);
    const uploadedFiles: File[] = [];
    const orderedBlocks: Array<{ type: "TEXT"; text: string } | { type: "MEDIA"; fileIndex: number }> = [];
    bodyBlocks.forEach((block) => {
      if (block.type === "TEXT") {
        orderedBlocks.push({ type: "TEXT", text: block.text });
      } else if (block.file) {
        const fileIndex = uploadedFiles.push(block.file) - 1;
        orderedBlocks.push({ type: "MEDIA", fileIndex });
      }
    });
    const description = bodyBlocks
      .filter((block): block is Extract<EditableContentBlock, { type: "TEXT" }> => block.type === "TEXT")
      .map((block) => block.text.trim())
      .filter(Boolean)
      .join("\n\n")
      .slice(0, 2000);

    const fd = new FormData();
    fd.append("title", form.title);
    fd.append("description", description);
    fd.append("url", form.url);
    fd.append("type", form.type);
    fd.append("status", form.status);
    if (form.categoryId) fd.append("categoryId", form.categoryId);
    fd.append("tags", tags.join(","));
    fd.append("blocks", JSON.stringify(orderedBlocks));
    uploadedFiles.forEach((file) => fd.append("files", file));

    const result = await createMedia(fd);
    if ("data" in result && result.data?.data?.id) {
      router.push(`/resources/${result.data.data.id}`);
    }
  }
  return (
    <section className="mx-auto max-w-3xl">
      <div className="mb-5">
        <h1 className="text-2xl font-black">Create a resource</h1>
        <p className="text-sm text-slate-500">
          Publish a link, article, book, video or code project. Attach files
          when needed.
        </p>
      </div>
      <form onSubmit={submit} className="card p-6 sm:p-8 space-y-5">
        <label className="field">
          Title
          <input
            required
            maxLength={200}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="What are you sharing?"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="field">
            Type
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              {types.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="field">
            Status
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option>PUBLISHED</option>
              <option>DRAFT</option>
              <option>ARCHIVED</option>
            </select>
          </label>
        </div>
        <label className="field">
          URL
          <input
            type="url"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            placeholder="https://..."
          />
        </label>
        <ResourceBodyEditor blocks={bodyBlocks} onChange={setBodyBlocks} />
        <label className="field">
          Category ID{" "}
          <input
            inputMode="numeric"
            value={form.categoryId}
            onChange={(e) =>
              setForm({
                ...form,
                categoryId: e.target.value.replace(/\D/g, ""),
              })
            }
            placeholder="Optional"
          />
        </label>
        <label className="field">
          Tags
          <input
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            placeholder="java, spring-boot, nextjs"
          />
        </label>
        <div className="flex justify-end gap-2 border-t pt-5">
          <button
            type="button"
            onClick={() => router.back()}
            className="button-secondary"
          >
            Cancel
          </button>
          <button
            disabled={loading}
            className="button-primary flex items-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Publishing..." : "Publish resource"}
          </button>
        </div>
      </form>
    </section>
  );
}
