"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Trash2, Type } from "lucide-react";
import type { Media } from "@/lib/api";
import { ProgressiveImage } from "@/components/ui/ProgressiveImage";

export type EditableContentBlock =
  | { id: string; type: "TEXT"; text: string }
  | { id: string; type: "MEDIA"; media?: Media; file?: File };

function blockId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `block-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function LocalFilePreview({ file }: { file: File }) {
  const previewUrl = useObjectUrl(file.type.startsWith("image/") ? file : undefined);

  if (previewUrl) {
    return (
      <ProgressiveImage
        src={previewUrl}
        alt={`Preview of ${file.name}`}
        loading="eager"
        className="max-h-72 w-full rounded-xl bg-slate-100 object-contain"
      />
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl bg-slate-100 p-3 text-sm text-slate-600">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white font-bold text-blue-600">FILE</span>
      <span className="min-w-0 truncate">{file.name}</span>
    </div>
  );
}

function useObjectUrl(file?: File) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }
    const nextUrl = URL.createObjectURL(file);
    setUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [file]);

  return url;
}

export function ResourceBodyEditor({
  blocks,
  onChange,
}: {
  blocks: EditableContentBlock[];
  onChange: (blocks: EditableContentBlock[]) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);

  function addTextBlock() {
    onChange([...blocks, { id: blockId(), type: "TEXT", text: "" }]);
  }

  function addFiles(files: FileList | null) {
    if (!files?.length) return;
    const next = Array.from(files).map((file): EditableContentBlock => ({
      id: blockId(),
      type: "MEDIA",
      file,
    }));
    onChange([...blocks, ...next]);
    if (fileInput.current) fileInput.current.value = "";
  }

  function updateBlock(index: number, nextBlock: EditableContentBlock) {
    onChange(blocks.map((block, blockIndex) => blockIndex === index ? nextBlock : block));
  }

  function moveBlock(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    onChange(next);
  }

  return (
    <section className="grid gap-3" aria-label="Resource content, in display order">
      <div>
        <h2 className="text-sm font-bold text-slate-800">Content order</h2>
        <p className="mt-1 text-xs text-slate-500">Add paragraphs and files in the order they should appear on the resource page.</p>
      </div>

      <div className="grid gap-3">
        {blocks.map((block, index) => (
          <div key={block.id} className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                {block.type === "TEXT" ? <Type className="h-4 w-4" /> : <ImagePlus className="h-4 w-4" />}
                {block.type === "TEXT" ? "Description" : "Image or file"}
              </span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => moveBlock(index, -1)} disabled={index === 0} aria-label={`Move block ${index + 1} up`} className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30">
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => moveBlock(index, 1)} disabled={index === blocks.length - 1} aria-label={`Move block ${index + 1} down`} className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30">
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => onChange(blocks.filter((_, blockIndex) => blockIndex !== index))} aria-label={`Remove block ${index + 1}`} className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {block.type === "TEXT" ? (
              <textarea
                rows={4}
                maxLength={2000}
                value={block.text}
                onChange={(event) => updateBlock(index, { ...block, text: event.target.value })}
                placeholder="Write a paragraph..."
                aria-label={`Description paragraph ${index + 1}`}
                className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm leading-6 outline-none focus:border-blue-500 focus:bg-white"
              />
            ) : (
              <div className="grid gap-2">
                {block.file ? (
                  <LocalFilePreview file={block.file} />
                ) : block.media?.contentType?.startsWith("image/") ? (
                  <ProgressiveImage
                    src={block.media.url}
                    alt={`Preview of ${block.media.fileName}`}
                    loading="eager"
                    className="max-h-72 w-full rounded-xl bg-slate-100 object-contain"
                  />
                ) : null}
                <p className="truncate text-xs text-slate-500">{block.file?.name || block.media?.fileName}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={addTextBlock} className="button-secondary gap-2">
          <Type className="h-4 w-4" /> Add description
        </button>
        <button type="button" onClick={() => fileInput.current?.click()} className="button-secondary gap-2">
          <ImagePlus className="h-4 w-4" /> Add image or file
        </button>
        <input ref={fileInput} type="file" multiple className="sr-only" onChange={(event) => addFiles(event.currentTarget.files)} aria-label="Choose images or files to add to the content" />
      </div>
    </section>
  );
}
