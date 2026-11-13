"use client";

import { useRef, useState } from "react";
import { Code2, FileUp, ImagePlus, Link2, Loader2, Plus, Trash2, Type } from "lucide-react";
import { useUploadMediaMutation, type ForumContentBlock } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";

export function ForumContentEditor({
  blocks,
  onChange,
}: {
  blocks: ForumContentBlock[];
  onChange: (blocks: ForumContentBlock[]) => void;
}) {
  const imageInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploadMedia] = useUploadMediaMutation();
  const [uploading, setUploading] = useState<"image" | "file" | null>(null);
  const { toast } = useToast();

  function updateBlock(index: number, patch: Partial<ForumContentBlock>) {
    onChange(blocks.map((block, blockIndex) => blockIndex === index ? { ...block, ...patch } : block));
  }

  function addBlock(type: ForumContentBlock["type"]) {
    const block: ForumContentBlock = type === "CODE"
      ? { type, text: "", language: "typescript" }
      : type === "LINK"
        ? { type, title: "", url: "" }
        : { type, text: "" };
    onChange([...blocks, block]);
  }

  async function handleUpload(file?: File, kind?: "image" | "file") {
    if (!file || !kind) return;
    if (kind === "image" && !file.type.startsWith("image/")) {
      toast("Choose an image file for an image block.", "error");
      return;
    }
    setUploading(kind);
    try {
      const response = await uploadMedia({ file, folder: "forum" }).unwrap();
      const media = response.data;
      const block: ForumContentBlock = media.mediaType === "IMAGE"
        ? { type: "IMAGE", mediaId: Number(media.id), url: media.url, fileName: media.fileName, contentType: media.contentType, alt: media.fileName }
        : { type: "FILE", mediaId: Number(media.id), url: media.url, fileName: media.fileName, contentType: media.contentType, title: media.fileName };
      onChange([...blocks, block]);
      toast("Attachment added to your discussion.", "success");
    } catch {
      toast("Could not upload this attachment. Try a smaller file.", "error");
    } finally {
      setUploading(null);
      if (imageInput.current) imageInput.current.value = "";
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2" aria-label="Add content block">
        <button type="button" onClick={() => addBlock("TEXT")} className="button-secondary inline-flex items-center gap-2 px-3 py-2 text-sm"><Type className="h-4 w-4" /> Text</button>
        <button type="button" onClick={() => addBlock("CODE")} className="button-secondary inline-flex items-center gap-2 px-3 py-2 text-sm"><Code2 className="h-4 w-4" /> Code</button>
        <button type="button" onClick={() => addBlock("LINK")} className="button-secondary inline-flex items-center gap-2 px-3 py-2 text-sm"><Link2 className="h-4 w-4" /> Link</button>
        <button type="button" onClick={() => imageInput.current?.click()} disabled={uploading !== null} className="button-secondary inline-flex items-center gap-2 px-3 py-2 text-sm disabled:opacity-60">
          {uploading === "image" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />} Image
        </button>
        <button type="button" onClick={() => fileInput.current?.click()} disabled={uploading !== null} className="button-secondary inline-flex items-center gap-2 px-3 py-2 text-sm disabled:opacity-60">
          {uploading === "file" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />} File
        </button>
        <input ref={imageInput} className="sr-only" type="file" accept=".jpg,.jpeg,.png,.gif,.webp" aria-label="Choose an image to upload" onChange={(event) => void handleUpload(event.currentTarget.files?.[0], "image")} />
        <input ref={fileInput} className="sr-only" type="file" accept=".pdf,.md,.txt,.zip,.tar,.gz,.js,.ts,.java,.py,.json,.yml,.yaml" aria-label="Choose a file to upload" onChange={(event) => void handleUpload(event.currentTarget.files?.[0], "file")} />
      </div>

      {blocks.length === 0 && (
        <button type="button" onClick={() => addBlock("TEXT")} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 py-8 text-sm font-semibold text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900">
          <Plus className="h-4 w-4" /> Add the first content block
        </button>
      )}

      {blocks.map((block, index) => (
        <section key={`${block.type}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-900/60">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">{block.type === "IMAGE" ? "Image" : block.type === "FILE" ? "File" : block.type === "CODE" ? "Code block" : block.type === "LINK" ? "Link preview" : "Text"}</span>
            <button type="button" onClick={() => onChange(blocks.filter((_, blockIndex) => blockIndex !== index))} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={`Remove ${block.type.toLowerCase()} block`}>
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          {block.type === "TEXT" && (
            <textarea
              value={block.text || ""}
              onChange={(event) => updateBlock(index, { text: event.target.value })}
              rows={4}
              maxLength={8000}
              placeholder="Share context, steps, or a useful explanation. Markdown is supported."
              className="w-full resize-y rounded-xl border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-500 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-400"
              aria-label={`Text block ${index + 1}`}
            />
          )}

          {block.type === "CODE" && (
            <div className="space-y-2">
              <label className="sr-only" htmlFor={`forum-code-language-${index}`}>Code language</label>
              <input id={`forum-code-language-${index}`} value={block.language || ""} onChange={(event) => updateBlock(index, { language: event.target.value })} maxLength={40} placeholder="Language (for example TypeScript)" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-400" />
              <label className="sr-only" htmlFor={`forum-code-text-${index}`}>Code content</label>
              <textarea id={`forum-code-text-${index}`} value={block.text || ""} onChange={(event) => updateBlock(index, { text: event.target.value })} rows={7} maxLength={20000} placeholder="Paste a code sample..." className="w-full resize-y rounded-xl border border-slate-200 bg-slate-950 p-3 font-mono text-sm leading-6 text-slate-100 outline-none focus:border-blue-500" />
            </div>
          )}

          {block.type === "LINK" && (
            <div className="space-y-2">
              <label className="sr-only" htmlFor={`forum-link-title-${index}`}>Link title</label>
              <input id={`forum-link-title-${index}`} value={block.title || ""} onChange={(event) => updateBlock(index, { title: event.target.value })} maxLength={200} placeholder="Link title (optional)" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-400" />
              <label className="sr-only" htmlFor={`forum-link-url-${index}`}>Link URL</label>
              <input id={`forum-link-url-${index}`} type="url" value={block.url || ""} onChange={(event) => updateBlock(index, { url: event.target.value })} maxLength={2048} placeholder="https://example.com" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-400" />
            </div>
          )}

          {block.type === "IMAGE" && (
            <div className="space-y-2">
              {block.url && <img src={block.url} alt={block.alt || block.fileName || "Uploaded image"} className="max-h-56 w-auto max-w-full rounded-xl object-contain" />}
              <label className="sr-only" htmlFor={`forum-image-alt-${index}`}>Image description</label>
              <input id={`forum-image-alt-${index}`} value={block.alt || ""} onChange={(event) => updateBlock(index, { alt: event.target.value })} maxLength={200} placeholder="Describe the image for accessibility" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-400" />
            </div>
          )}

          {block.type === "FILE" && (
            <p className="truncate rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-600 dark:bg-slate-950 dark:text-slate-300">{block.fileName || block.title || "Uploaded file"}</p>
          )}
        </section>
      ))}
      <p className="text-xs leading-5 text-slate-500">Add text, code, links, images, or files in any order. Uploaded files are checked by the server.</p>
    </div>
  );
}
