"use client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import {
  useCreateResourceMutation,
  useCreateResourceWithMediaMutation,
} from "@/lib/api";
const types = ["BOOK", "CODE", "LINK", "VIDEO", "ARTICLE"];
export default function NewResourcePage() {
  const router = useRouter();
  const [create, { isLoading: createLoading }] = useCreateResourceMutation();
  const [createMedia, { isLoading: mediaLoading }] =
    useCreateResourceWithMediaMutation();
  const [form, setForm] = useState({
    title: "",
    description: "",
    url: "",
    type: "ARTICLE",
    status: "PUBLISHED",
    categoryId: "",
    tags: "",
  });
  const [files, setFiles] = useState<File[]>([]);
  const input = useRef<HTMLInputElement>(null);
  const loading = createLoading || mediaLoading;
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const tags = form.tags
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
    let result;
    if (files.length) {
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("description", form.description);
      fd.append("url", form.url);
      fd.append("type", form.type);
      fd.append("status", form.status);
      if (form.categoryId) fd.append("categoryId", form.categoryId);
      fd.append("tags", tags.join(","));
      files.forEach((f) => fd.append("files", f));
      result = await createMedia(fd);
    } else
      result = await create({
        ...form,
        categoryId: form.categoryId ? Number(form.categoryId) : undefined,
        tags,
      });
    if ("data" in result && result.data?.data?.id)
      router.push(`/resources/${result.data.data.id}`);
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
        <label className="field">
          Description
          <textarea
            rows={7}
            maxLength={2000}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Explain why this resource is useful..."
          />
        </label>
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
        <div>
          <p className="mb-2 text-sm font-semibold">Attachments</p>
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-sm font-semibold text-slate-600 hover:border-blue-300 hover:bg-blue-50"
          >
            <Upload className="h-5 w-5" /> Choose files
            <input
              ref={input}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
            />
          </button>
          {files.length > 0 && (
            <div className="mt-3 space-y-2">
              {files.map((f, i) => (
                <div
                  key={`${f.name}-${i}`}
                  className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm"
                >
                  <span className="truncate">{f.name}</span>
                  <button
                    type="button"
                    onClick={() => setFiles(files.filter((_, j) => j !== i))}
                  >
                    <X className="h-4 w-4 text-slate-400" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
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
