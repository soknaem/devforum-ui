import { Inbox } from "lucide-react";
export function EmptyState({ title, description }: { title: string; description?: string }) {
  return <div className="card flex flex-col items-center justify-center px-6 py-14 text-center"><Inbox className="h-10 w-10 text-slate-300"/><h3 className="mt-4 font-bold text-slate-900">{title}</h3>{description && <p className="mt-1 max-w-md text-sm text-slate-500">{description}</p>}</div>;
}
