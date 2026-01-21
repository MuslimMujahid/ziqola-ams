import React from "react";
import {
  BoldIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
  Redo2Icon,
  UnderlineIcon,
  Undo2Icon,
} from "lucide-react";
import {
  Descendant,
  Editor,
  Element as SlateElement,
  Range,
  Transforms,
} from "slate";
import { Editable, ReactEditor, useSlate } from "slate-react";
import type { RenderElementProps, RenderLeafProps } from "slate-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/dialog";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { cn } from "@/lib/utils/cn";
import { useFeedbackDialog } from "@/lib/utils";

export const RICH_TEXT_EMPTY_VALUE: Descendant[] = [
  {
    type: "paragraph",
    children: [{ text: "" }],
  },
];

export const TOOLBAR_BUTTON_CONFIGURATION = {
  bold: {
    label: "Bold",
    icon: BoldIcon,
  },
  italic: {
    label: "Italic",
    icon: ItalicIcon,
  },
  underline: {
    label: "Underline",
    icon: UnderlineIcon,
  },
  bulletedList: {
    label: "Bullet list",
    icon: ListIcon,
  },
  numberedList: {
    label: "Numbered list",
    icon: ListOrderedIcon,
  },
  link: {
    label: "Insert link",
    icon: LinkIcon,
  },
  undo: {
    label: "Undo",
    icon: Undo2Icon,
  },
  redo: {
    label: "Redo",
    icon: Redo2Icon,
  },
} as const;

const LIST_TYPES = new Set(["numbered-list", "bulleted-list"]);

// ----------------------------------------------
// Utility functions
// ----------------------------------------------

function isUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol.startsWith("http");
  } catch {
    return false;
  }
}

function isLinkElement(element: SlateElement) {
  return (element as SlateElement & { type?: string }).type === "link";
}

function isLinkActive(editor: Editor) {
  const [link] = Editor.nodes(editor, {
    match: (node: unknown) =>
      !Editor.isEditor(node) &&
      SlateElement.isElement(node) &&
      isLinkElement(node),
  });

  return Boolean(link);
}

function unwrapLink(editor: Editor) {
  Transforms.unwrapNodes(editor, {
    match: (node: unknown) =>
      !Editor.isEditor(node) &&
      SlateElement.isElement(node) &&
      isLinkElement(node),
  });
}

function wrapLink(editor: Editor, url: string) {
  if (isLinkActive(editor)) {
    unwrapLink(editor);
  }

  const { selection } = editor;
  const link = {
    type: "link",
    url,
    children: selection && Range.isCollapsed(selection) ? [{ text: url }] : [],
  } as SlateElement;

  if (selection && Range.isCollapsed(selection)) {
    Transforms.insertNodes(editor, link);
  } else {
    Transforms.wrapNodes(editor, link, { split: true });
    Transforms.collapse(editor, { edge: "end" });
  }
}

function getLinkEntry(editor: Editor, at?: Range | null) {
  const range = at ?? editor.selection;
  if (!range) return null;

  const [linkEntry] = Editor.nodes(editor, {
    at: range,
    match: (node: unknown) =>
      !Editor.isEditor(node) &&
      SlateElement.isElement(node) &&
      isLinkElement(node),
  });

  if (linkEntry) return linkEntry;

  const previous = Editor.previous(editor, {
    at: range.anchor,
    match: (node: unknown) =>
      !Editor.isEditor(node) &&
      SlateElement.isElement(node) &&
      isLinkElement(node),
  });

  return previous ?? null;
}

function isMarkActive(editor: Editor, format: "bold" | "italic" | "underline") {
  const marks = Editor.marks(editor);
  return marks ? (marks as Record<string, unknown>)[format] === true : false;
}

function toggleMark(editor: Editor, format: "bold" | "italic" | "underline") {
  const isActive = isMarkActive(editor, format);
  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
}

function isBlockActive(editor: Editor, format: string) {
  const [match] = Editor.nodes(editor, {
    match: (node: unknown) =>
      !Editor.isEditor(node) &&
      SlateElement.isElement(node) &&
      (node as SlateElement).type === format,
  });

  return Boolean(match);
}

function toggleBlock(
  editor: Editor,
  format: "numbered-list" | "bulleted-list",
) {
  const isActive = isBlockActive(editor, format);
  const isList = LIST_TYPES.has(format);

  Transforms.unwrapNodes(editor, {
    match: (node: unknown) =>
      !Editor.isEditor(node) &&
      SlateElement.isElement(node) &&
      LIST_TYPES.has((node as SlateElement).type as string),
    split: true,
  });

  Transforms.setNodes(editor, {
    type: isActive ? "paragraph" : isList ? "list-item" : "paragraph",
  } as Partial<SlateElement>);

  if (!isActive && isList) {
    const block: SlateElement = { type: format, children: [] } as SlateElement;
    Transforms.wrapNodes(editor, block);
  }
}

export function withLinks(editor: Editor) {
  const { insertData, insertText, isInline } = editor;

  editor.isInline = (element: SlateElement) =>
    isLinkElement(element) ? true : isInline(element);

  editor.insertText = (text: string) => {
    if (text && isUrl(text)) {
      wrapLink(editor, text);
    } else {
      insertText(text);
    }
  };

  editor.insertData = (data: DataTransfer) => {
    const text = data.getData("text/plain");
    if (text && isUrl(text)) {
      wrapLink(editor, text);
    } else {
      insertData(data);
    }
  };

  return editor;
}

export function normalizeValue(value: Descendant[]): Descendant[] {
  if (!Array.isArray(value) || value.length === 0) {
    return RICH_TEXT_EMPTY_VALUE;
  }

  return value
    .map((node) => normalizeNode(node))
    .filter(Boolean) as Descendant[];
}

function normalizeNode(node: Descendant): Descendant | null {
  // Text node
  if (typeof (node as { text?: unknown }).text === "string") {
    const text = (node as { text: string }).text ?? "";
    const rest = { ...node } as Record<string, unknown>;
    delete rest.text;
    return { text, ...rest } as Descendant;
  }

  // Element node
  const element = node as SlateElement & { children?: Descendant[] };
  const children = Array.isArray(element.children) ? element.children : [];
  const normalizedChildren = children
    .map((child) => normalizeNode(child))
    .filter(Boolean) as Descendant[];

  if (normalizedChildren.length === 0) {
    normalizedChildren.push({ text: "" });
  }

  return { ...element, children: normalizedChildren } as Descendant;
}

// ----------------------------------------------
// Context and Provider
// ----------------------------------------------

type RichEditorContextValue = {
  isLinkDialogOpen: boolean;
  setIsLinkDialogOpen: (isOpen: boolean) => void;
  linkValue: string;
  setLinkValue: (value: string) => void;
  linkError: string | null;
  setLinkError: (error: string | null) => void;
  linkTargetPath: number[] | null;
  setLinkTargetPath: (path: number[] | null) => void;
  openLinkDialog: () => void;
  confirmLink: (onInvalidLink: () => void) => void;
  canUndo: boolean;
  canRedo: boolean;
};

export type RichEditorProviderProps = {
  children: React.ReactNode;
};

const RichEditorContext = React.createContext<RichEditorContextValue | null>(
  null,
);

export function useRichEditorState(): RichEditorContextValue {
  const editor = useSlate();
  const [isLinkDialogOpen, setIsLinkDialogOpen] = React.useState(false);
  const [linkValue, setLinkValue] = React.useState("https://");
  const [linkError, setLinkError] = React.useState<string | null>(null);
  const [linkTargetPath, setLinkTargetPath] = React.useState<number[] | null>(
    null,
  );
  const lastSelectionRef = React.useRef<Range | null>(null);

  const handleOpenLinkDialog = React.useCallback(() => {
    lastSelectionRef.current = editor.selection;
    const linkEntry = getLinkEntry(editor);
    setLinkTargetPath(linkEntry ? linkEntry[1] : null);
    setLinkValue("https://");
    setLinkError(null);
    setIsLinkDialogOpen(true);
  }, [editor]);

  const handleConfirmLink = React.useCallback(
    (onInvalidLink: () => void) => {
      if (!linkValue) {
        setLinkError("Masukkan URL terlebih dahulu.");
        return;
      }

      if (!isUrl(linkValue)) {
        setLinkError("Gunakan tautan http atau https.");
        onInvalidLink();
        return;
      }

      setLinkError(null);

      const lastSelection = lastSelectionRef.current;
      if (lastSelection) {
        Transforms.select(editor, lastSelection);
      }

      if (linkTargetPath) {
        const endPoint = Editor.end(editor, linkTargetPath);
        Transforms.select(editor, endPoint);
      } else {
        wrapLink(editor, linkValue);
        const linkEntry = getLinkEntry(editor, editor.selection);
        if (linkEntry) {
          const endPoint = Editor.end(editor, linkEntry[1]);
          Transforms.select(editor, endPoint);
        }
      }

      ReactEditor.focus(editor as ReactEditor);

      setIsLinkDialogOpen(false);
      setLinkTargetPath(null);
    },
    [editor, linkTargetPath, linkValue],
  );

  const canUndo = editor.history.undos.length > 0;
  const canRedo = editor.history.redos.length > 0;

  return {
    isLinkDialogOpen,
    setIsLinkDialogOpen,
    linkValue,
    setLinkValue,
    linkError,
    setLinkError,
    linkTargetPath,
    setLinkTargetPath,
    openLinkDialog: handleOpenLinkDialog,
    confirmLink: handleConfirmLink,
    canUndo,
    canRedo,
  };
}

export function RichEditorProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const value = useRichEditorState();

  return (
    <RichEditorContext.Provider value={value}>
      {children}
    </RichEditorContext.Provider>
  );
}

function useRichTextEditor() {
  const context = React.useContext(RichEditorContext);
  if (!context) {
    throw new Error(
      "useRichTextEditor must be used within RichEditorContextProvider",
    );
  }
  return context;
}

// ----------------------------------------------
// Components
// ----------------------------------------------

type RichTextButtonProps<T> = {
  disabled?: boolean;
  format: T;
};

type LinkDialogProps = {
  onConfirmLink: () => void;
};

export type RichTextEditableProps = {
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
};

export function MarkButton({
  format,
  disabled,
}: RichTextButtonProps<"bold" | "italic" | "underline">) {
  const editor = useSlate();
  const { label, icon: Icon } = TOOLBAR_BUTTON_CONFIGURATION[format];

  const isActive = isMarkActive(editor, format);

  const handleClick = React.useCallback(() => {
    toggleMark(editor, format);
  }, [editor, format]);

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={isActive}
      disabled={disabled}
      onMouseDown={(event) => {
        event.preventDefault();
        handleClick();
      }}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-colors",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-ink-muted hover:bg-surface-2",
        disabled && "cursor-not-allowed opacity-50 hover:bg-transparent",
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

export function BlockButton({
  format,
  disabled,
}: RichTextButtonProps<"bulleted-list" | "numbered-list">) {
  const editor = useSlate();
  const { label, icon: Icon } =
    TOOLBAR_BUTTON_CONFIGURATION[
      format === "bulleted-list" ? "bulletedList" : "numberedList"
    ];
  const isActive = isBlockActive(editor, format);

  const handleClick = React.useCallback(() => {
    toggleBlock(editor, format);
  }, [editor, format]);

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={isActive}
      disabled={disabled}
      onMouseDown={(event) => {
        event.preventDefault();
        handleClick();
      }}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-colors",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-ink-muted hover:bg-surface-2",
        disabled && "cursor-not-allowed opacity-50 hover:bg-transparent",
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

export function LinkButton({ disabled }: { disabled?: boolean }) {
  const editor = useSlate();
  const { showFeedback, FeedbackDialog } = useFeedbackDialog();
  const { openLinkDialog, confirmLink } = useRichTextEditor();

  const { label, icon: Icon } = TOOLBAR_BUTTON_CONFIGURATION["link"];
  const isActive = isLinkActive(editor);

  const handleClick = React.useCallback(() => {
    const linkEntry = getLinkEntry(editor);
    if (linkEntry) {
      unwrapLink(editor);
    } else {
      openLinkDialog();
    }
  }, [openLinkDialog]);

  const handleConfirmLink = React.useCallback(() => {
    confirmLink(() => {
      showFeedback({
        tone: "error",
        title: "Tautan tidak valid",
        description: "Pastikan tautan diawali dengan http:// atau https://",
      });
    });
  }, [confirmLink, showFeedback]);

  return (
    <>
      <button
        type="button"
        aria-label={label}
        aria-pressed={isActive}
        disabled={disabled}
        onMouseDown={(event) => {
          event.preventDefault();
          handleClick();
        }}
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-colors",
          isActive
            ? "bg-primary/10 text-primary"
            : "text-ink-muted hover:bg-surface-2",
          disabled && "cursor-not-allowed opacity-50 hover:bg-transparent",
        )}
      >
        <Icon className="h-4 w-4" />
      </button>
      <LinkDialog onConfirmLink={handleConfirmLink} />
      <FeedbackDialog />
    </>
  );
}

export function RichTextEditable({
  placeholder,
  readOnly,
  className,
}: RichTextEditableProps) {
  const editor = useSlate();

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== " ") return;
      const { selection } = editor;
      if (!selection || !Range.isCollapsed(selection)) return;

      const [linkEntry] = Editor.nodes(editor, {
        match: (node: unknown) =>
          !Editor.isEditor(node) &&
          SlateElement.isElement(node) &&
          isLinkElement(node),
      });

      if (!linkEntry) return;

      const [, linkPath] = linkEntry;
      const after = Editor.after(editor, linkPath);
      if (!after) return;

      event.preventDefault();
      Transforms.select(editor, after);
      Transforms.insertText(editor, " ");
    },
    [editor],
  );

  const renderElement = React.useCallback(
    ({ attributes, children, element }: RenderElementProps) => {
      if (SlateElement.isElement(element) && isLinkElement(element)) {
        return (
          <a
            {...attributes}
            href={(element as SlateElement & { url?: string }).url}
            target="_blank"
            rel="noreferrer"
            className="text-primary underline underline-offset-2"
          >
            {children}
          </a>
        );
      }

      if (SlateElement.isElement(element) && element.type === "bulleted-list") {
        return (
          <ul {...attributes} className="list-disc space-y-1 pl-5">
            {children}
          </ul>
        );
      }

      if (SlateElement.isElement(element) && element.type === "numbered-list") {
        return (
          <ol {...attributes} className="list-decimal space-y-1 pl-5">
            {children}
          </ol>
        );
      }

      if (SlateElement.isElement(element) && element.type === "list-item") {
        return (
          <li {...attributes} className="leading-6 text-ink-strong">
            {children}
          </li>
        );
      }

      return (
        <p {...attributes} className="mb-2 leading-6 text-ink-strong last:mb-0">
          {children}
        </p>
      );
    },
    [],
  );

  const renderLeaf = React.useCallback(
    ({ attributes, children, leaf }: RenderLeafProps) => {
      let formatted = children;

      if (leaf.bold) {
        formatted = <strong className="font-semibold">{formatted}</strong>;
      }
      if (leaf.italic) {
        formatted = <em className="italic">{formatted}</em>;
      }
      if (leaf.underline) {
        formatted = (
          <span className="underline decoration-ink-muted/70 underline-offset-4">
            {formatted}
          </span>
        );
      }

      return (
        <span {...attributes} className="text-sm text-ink-strong">
          {formatted}
        </span>
      );
    },
    [],
  );

  return (
    <Editable
      renderElement={renderElement}
      renderLeaf={renderLeaf}
      placeholder={placeholder}
      className={cn(
        "min-h-40 text-sm leading-6 text-ink-strong outline-none",
        className,
      )}
      spellCheck
      readOnly={readOnly}
      onKeyDown={readOnly ? undefined : handleKeyDown}
    />
  );
}

function LinkDialog({ onConfirmLink }: LinkDialogProps) {
  const {
    isLinkDialogOpen,
    setIsLinkDialogOpen,
    linkValue,
    setLinkValue,
    linkError,
    setLinkError,
    setLinkTargetPath,
  } = useRichTextEditor();

  return (
    <Dialog
      open={isLinkDialogOpen}
      onOpenChange={(isOpen) => {
        setIsLinkDialogOpen(isOpen);
        if (!isOpen) {
          setLinkError(null);
          setLinkTargetPath(null);
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah tautan</DialogTitle>
          <DialogDescription>
            Masukkan URL tautan yang ingin disematkan.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Input
            value={linkValue}
            onChange={(event) => {
              setLinkValue(event.target.value);
              if (linkError) {
                setLinkError(null);
              }
            }}
            placeholder="https://"
            autoFocus
          />
          {linkError ? (
            <p className="text-xs text-error" role="alert">
              {linkError}
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsLinkDialogOpen(false)}
          >
            Batal
          </Button>
          <Button type="button" onClick={onConfirmLink}>
            Simpan tautan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
