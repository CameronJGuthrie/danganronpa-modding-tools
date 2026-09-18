import type { FlowNodeKind } from "../../script/controlFlow";

/** Badge colours and labels for each kind of control-flow node. */
export const kindStyles: Record<FlowNodeKind, { badge: string; label: string }> = {
  script: { badge: "bg-slate-700 dark:bg-slate-200 text-white dark:text-slate-900", label: "Script" },
  block: { badge: "bg-slate-300 dark:bg-slate-600 text-slate-900 dark:text-slate-100", label: "Block" },
  handlerGroup: { badge: "bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100", label: "Handlers" },
  handler: { badge: "bg-amber-100 dark:bg-amber-900 text-amber-900 dark:text-amber-100", label: "Handler" },
  menu: { badge: "bg-violet-200 dark:bg-violet-800 text-violet-900 dark:text-violet-100", label: "Menu" },
  option: { badge: "bg-violet-100 dark:bg-violet-900 text-violet-900 dark:text-violet-100", label: "Option" },
};
