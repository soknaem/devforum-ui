import { ProgressiveImage } from "@/components/ui/ProgressiveImage";

export function Avatar({ name, src, size="md" }: { name?: string; src?: string; size?: "sm"|"md"|"lg" }) {
 const cls=size==="sm"?"h-9 w-9 text-xs":size==="lg"?"h-24 w-24 text-3xl":"h-11 w-11 text-sm";
 return src ? <ProgressiveImage src={src} alt={name || "Avatar"} className={`${cls} rounded-2xl object-cover ring-1 ring-slate-200`} sizes="96px" /> : <div className={`${cls} flex items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 font-black text-white`}>{(name||"?").slice(0,1).toUpperCase()}</div>;
}
