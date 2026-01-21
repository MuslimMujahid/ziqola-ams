import React from "react";
import { createEditor, Descendant, Editor } from "slate";
import { withHistory } from "slate-history";
import { Slate, withReact } from "slate-react";
import {
  BlockButton,
  LinkButton,
  MarkButton,
  normalizeValue,
  RichEditorProvider,
  RichTextEditable,
  withLinks,
} from "./rich-text-editor";
import { cn } from "@/lib/utils";

export type ButtonFormat =
  | "bold"
  | "italic"
  | "underline"
  | "bulleted-list"
  | "numbered-list"
  | "link";

type RichTextEditorBasicProps = {
  value: Descendant[];
  onChange: (value: Descendant[]) => void;
  placeholder?: string;
  resetKey?: string | number | null;
  className?: string;
  config?: Partial<Record<ButtonFormat, boolean>>;
};

export function RichTextEditorBasic({
  value,
  onChange,
  placeholder,
  resetKey,
  className,
  config,
}: RichTextEditorBasicProps) {
  const editor = React.useMemo<Editor>(
    () => withLinks(withHistory(withReact(createEditor()))),
    [resetKey],
  );

  const safeValue = React.useMemo<Descendant[]>(() => {
    return normalizeValue(value);
  }, [value]);

  const handleChange = React.useCallback(
    (nextValue: Descendant[]) => {
      onChange(normalizeValue(nextValue));
    },
    [onChange],
  );

  const anyBlockEnabled =
    config?.["bulleted-list"] === true || config?.["numbered-list"] === true;

  return (
    <div className={cn("rounded-2xl bg-surface-contrast", className)}>
      <Slate
        key={resetKey ?? "rich-text-editor"}
        editor={editor}
        initialValue={safeValue}
        onChange={handleChange}
      >
        <RichEditorProvider>
          <>
            <div className="flex flex-wrap items-center gap-1.5 border-b border-surface-2/70 px-3 py-2">
              {config?.bold === true && <MarkButton format="bold" />}
              {config?.italic === true && <MarkButton format="italic" />}
              {config?.underline === true && <MarkButton format="underline" />}

              {anyBlockEnabled && (
                <div className="mx-1 h-5 w-px bg-surface-2" />
              )}

              {config?.["bulleted-list"] === true && (
                <BlockButton format="bulleted-list" />
              )}
              {config?.["numbered-list"] === true && (
                <BlockButton format="numbered-list" />
              )}

              {config?.["link"] === true && (
                <div className="mx-1 h-5 w-px bg-surface-2" />
              )}

              {config?.link === true && <LinkButton />}
            </div>

            <div className="px-4 py-3">
              <RichTextEditable placeholder={placeholder} />
            </div>
          </>
        </RichEditorProvider>
      </Slate>
    </div>
  );
}
