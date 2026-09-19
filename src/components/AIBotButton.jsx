import { useState } from "react";
import { Bot } from "lucide-react";

const MESSAGE = "AI Interview — Coming Soon";

/** Floating teaser button stacked above the WhatsApp button. Not a live
 * feature yet — click or hover just surfaces the coming-soon label. */
export default function AIBotButton() {
  const [open, setOpen] = useState(false);

  return (
    <div className="group fixed bottom-[5.5rem] right-5 sm:bottom-[5.75rem] sm:right-6 z-50">
      <div
        role="tooltip"
        className={`absolute bottom-1/2 right-full mr-3 translate-y-1/2 whitespace-nowrap rounded-full border border-(--color-border) bg-(--color-surface) px-3.5 py-2 text-xs font-medium text-(--color-fg) shadow-lg transition-opacity duration-150 ${
          open ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        {MESSAGE}
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={MESSAGE}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-emerald-400 text-white shadow-lg shadow-indigo-900/20 hover:scale-105 active:scale-95 transition-transform"
      >
        <Bot className="h-5 w-5" />
      </button>
    </div>
  );
}
