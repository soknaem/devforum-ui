"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Braces, Code2, ImagePlus, Trash2, Type } from "lucide-react";
import type { Media } from "@/lib/api";
import { ProgressiveImage } from "@/components/ui/ProgressiveImage";

export type TextFormat = "PLAIN" | "MARKDOWN" | "CODE" | "JSON";

export type EditableContentBlock =
  | { id: string; type: "TEXT"; text: string; format?: TextFormat; language?: string }
  | { id: string; type: "MEDIA"; media?: Media; file?: File };

const MAX_TEXT_BLOCK_LENGTH = 4000;
const codeLanguages = ["typescript", "javascript", "python", "java", "sql", "html", "css", "bash", "rust", "go", "text"];

function blockId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `block-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function formatTextBlock(block: Extract<EditableContentBlock, { type: "TEXT" }>) {
  let text = block.text;
  let language = block.language || "typescript";

  if (block.format === "JSON") {
    try {
      text = JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      throw new Error("Enter valid JSON before publishing.");
    }
    language = "json";
  }

  if (block.format === "CODE" || block.format === "JSON") {
    const longestBacktickRun = Math.max(0, ...Array.from(text.matchAll(/`+/g), ([run]) => run.length));
    const fence = "`".repeat(Math.max(3, longestBacktickRun + 1));
    const safeLanguage = /^[a-z0-9+#.-]{1,24}$/i.test(language) ? language : "text";
    text = `${fence}${safeLanguage}\n${text}\n${fence}`;
  }

  if (text.length > MAX_TEXT_BLOCK_LENGTH) {
    throw new Error("Each formatted content block must be 4,000 characters or fewer.");
  }

  return text;
}

export function parseEditableText(text: string) {
  const lines = text.split(/\r?\n/);
  const opening = lines[0]?.match(/^(`{3,}|~{3,})([a-z0-9+#.-]*)$/i);
  const closing = lines.at(-1);

  if (!opening || closing !== opening[1] || lines.length < 3) {
    return { text, format: "PLAIN" as const, language: "typescript" };
  }

  const language = opening[2].toLowerCase();
  const content = lines.slice(1, -1).join("\n");
  if (language === "json") return { text: content, format: "JSON" as const, language: "json" };
  if (language === "markdown" || language === "md") return { text: content, format: "MARKDOWN" as const, language: "typescript" };
  return { text: content, format: "CODE" as const, language: language || "typescript" };
}

export function buildDescriptionPreview(serializedTextBlocks: string[]) {
  const content = serializedTextBlocks.map((text) => text.trim()).filter(Boolean).join("\n\n");
  if (content.length <= 2000) return content;

  let preview = content.slice(0, 1970).trimEnd();
  const fences = preview.match(/^(`{3,}|~{3,})[^\n]*$/gm) ?? [];
  if (fences.length % 2 === 1) {
    const opening = fences[fences.length - 1];
    const fenceCharacter = opening.startsWith("~") ? "~" : String.fromCharCode(96);
    const fenceLength = opening.match(/^(~+|\x60+)/)?.[0].length ?? 3;
    preview += `\n${fenceCharacter.repeat(fenceLength)}`;
  }
  return preview.slice(0, 2000);
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
  const [formatMessage, setFormatMessage] = useState("");

  function addTextBlock() {
    onChange([...blocks, { id: blockId(), type: "TEXT", text: "", format: "PLAIN" }]);
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
    setFormatMessage("");
    onChange(blocks.map((block, blockIndex) => blockIndex === index ? nextBlock : block));
  }

  function moveBlock(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    onChange(next);
  }

  function formatJson(index: number, block: Extract<EditableContentBlock, { type: "TEXT" }>) {
    try {
      const formatted = JSON.stringify(JSON.parse(block.text), null, 2);
      updateBlock(index, { ...block, text: formatted, format: "JSON", language: "json" });
      setFormatMessage("JSON formatted.");
    } catch {
      setFormatMessage("Enter valid JSON to format it.");
    }
  }

  return (
    <section className="grid gap-3" aria-label="Resource content, in display order">
      <div>
        <h2 className="text-sm font-bold text-slate-800">Content order</h2>
        <p className="mt-1 text-xs text-slate-500">Add paragraphs, Markdown, code, JSON, and files in the order they should appear.</p>
      </div>

      <div className="grid gap-3">
        {blocks.map((block, index) => (
          <div key={block.id} className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                {block.type === "TEXT" ? <Type className="h-4 w-4" /> : <ImagePlus className="h-4 w-4" />}
                {block.type === "TEXT" ? "Text content" : "Image or file"}
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
              <div className="grid gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <label className="sr-only" htmlFor={`content-format-${block.id}`}>Content format</label>
                  <select
                    id={`content-format-${block.id}`}
                    value={block.format ?? "PLAIN"}
                    onChange={(event) => updateBlock(index, { ...block, format: event.target.value as TextFormat })}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700"
                  >
                    <option value="PLAIN">Plain text</option>
                    <option value="MARKDOWN">Markdown</option>
                    <option value="CODE">Code</option>
                    <option value="JSON">JSON</option>
                  </select>

                  {block.format === "CODE" && (
                    <>
                      <label className="sr-only" htmlFor={`code-language-${block.id}`}>Code language</label>
                      <select
                        id={`code-language-${block.id}`}
                        value={block.language ?? "typescript"}
                        onChange={(event) => updateBlock(index, { ...block, language: event.target.value })}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700"
                      >
                        {codeLanguages.map((language) => <option key={language} value={language}>{language}</option>)}
                      </select>
                    </>
                  )}

                  {block.format === "JSON" && (
                    <button type="button" onClick={() => formatJson(index, block)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">
                      <Braces className="h-3.5 w-3.5" /> Format JSON
                    </button>
                  )}
                </div>

                <textarea
                  rows={6}
                  maxLength={MAX_TEXT_BLOCK_LENGTH}
                  value={block.text}
                  onChange={(event) => updateBlock(index, { ...block, text: event.target.value })}
                  placeholder={block.format === "CODE" ? "Paste code here..." : block.format === "JSON" ? '{\n  "key": "value"\n}' : block.format === "MARKDOWN" ? "Write Markdown..." : "Write a paragraph..."}
                  aria-label={`${block.format === "CODE" ? "Code" : block.format === "JSON" ? "JSON" : block.format === "MARKDOWN" ? "Markdown" : "Description"} content block ${index + 1}`}
                  className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 font-mono text-sm leading-6 outline-none focus:border-blue-500 focus:bg-white"
                />
                <div className="flex flex-wrap justify-between gap-2 text-xs text-slate-400">
                  <span>{block.format === "MARKDOWN" ? "Supports headings, lists, links, tables, and task lists." : "Up to 4,000 characters per block."}</span>
                  <span>{block.text.length.toLocaleString()} / {MAX_TEXT_BLOCK_LENGTH.toLocaleString()}</span>
                </div>
              </div>
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
          <Code2 className="h-4 w-4" /> Add text or code
        </button>
        <button type="button" onClick={() => fileInput.current?.click()} className="button-secondary gap-2">
          <ImagePlus className="h-4 w-4" /> Add image or file
        </button>
        <input ref={fileInput} type="file" multiple className="sr-only" onChange={(event) => addFiles(event.currentTarget.files)} aria-label="Choose images or files to add to the content" />
      </div>
      <p role="status" aria-live="polite" className="min-h-4 text-xs text-amber-700">{formatMessage}</p>
    </section>
  );
}
