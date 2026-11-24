import { type KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import { IconSize } from "@/constant";
import { Button } from "@/src/ui/Button";
import { toRenderableHtml } from "../utils/richText";
import {
  Bold,
  Eraser,
  Italic,
  Link,
  ListBullet,
  ListOrdered,
  Strikethrough,
  Underline,
  Unlink,
} from "./Icons";

interface RichTextEditorProps {
  label?: string;
  onChange: (html: string) => void;
  placeholder?: string;
  rows?: number;
  value: string;
}

type InlineKey = "bold" | "italic" | "underline" | "strikethrough";

interface InlineFamily {
  active: keyof ActiveFormats;
  ancestors: string[];
  element: string;
}

interface ActiveFormats {
  bold: boolean;
  italic: boolean;
  olList: boolean;
  orderedList: boolean;
  strikethrough: boolean;
  underline: boolean;
  unorderedList: boolean;
}

const INLINE_FAMILIES: Record<InlineKey, InlineFamily> = {
  bold: { ancestors: ["B", "STRONG"], active: "bold", element: "strong" },
  italic: { ancestors: ["EM", "I"], active: "italic", element: "em" },
  strikethrough: { ancestors: ["DEL", "S", "STRIKE"], active: "strikethrough", element: "s" },
  underline: { ancestors: ["U"], active: "underline", element: "u" },
};

const TOOLS: {
  activeKey: keyof ActiveFormats;
  icon: (props: { className?: string }) => React.ReactNode;
  title: string;
}[] = [
  { activeKey: "bold", icon: Bold, title: "Bold (Ctrl/Cmd+B)" },
  {
    activeKey: "italic",
    icon: Italic,
    title: "Italic (Ctrl/Cmd+I)",
  },
  {
    activeKey: "underline",
    icon: Underline,
    title: "Underline (Ctrl/Cmd+U)",
  },
  {
    activeKey: "strikethrough",
    icon: Strikethrough,
    title: "Strikethrough",
  },
  {
    activeKey: "unorderedList",
    icon: ListBullet,
    title: "Bulleted list",
  },
  {
    activeKey: "orderedList",
    icon: ListOrdered,
    title: "Numbered list",
  },
];

const INITIAL_FORMATS = {
  bold: false,
  italic: false,
  orderedList: false,
  strikethrough: false,
  underline: false,
  unorderedList: false,
  olList: false,
};

/**
 * Small contentEditable editor built on the Selection/Range APIs. Formatting is applied by wrapping / unwrapping
 * DOM nodes directly — no deprecated `document.execCommand` and no external editor dependency.
 *
 * The parent owns serialization: `onChange` fires with the editor's current HTML and the value is re-rendered only
 * when it changes from the outside. Everything the editor emits stays inside the server-side sanitizer
 * allowlist (`strong`, `em`, `u`, `s`, `ul`/`ol`/`li`, `a`, `p`).
 */
export const RichTextEditor = ({
  value,
  onChange,
  placeholder = "Write here...",
  rows = 4,
  label = "Rich text content",
}: RichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isEmpty, setIsEmpty] = useState(!value?.trim());
  const [activeFormats, setActiveFormats] = useState<ActiveFormats>({ ...INITIAL_FORMATS });

  const getEditor = useCallback(() => editorRef.current, []);

  useEffect(() => {
    const el = getEditor();
    if (!el) return;

    const incoming = toRenderableHtml(value);
    const normalize = (html: string) => html.replace(/[\s\u00a0]+/g, " ").trim();
    if (normalize(el.innerHTML) !== normalize(incoming)) {
      el.innerHTML = incoming;
    }
    setIsEmpty(!el.textContent?.trim());
  }, [getEditor, value]);

  const emitChange = useCallback(() => {
    const el = getEditor();
    if (!el) return;

    const html = el.innerHTML;
    const text = el.textContent?.trim() ?? "";
    setIsEmpty(!text);
    onChange(text ? html : "");
    setActiveFormats(readActiveFormats(el));
  }, [getEditor, onChange]);

  const toggleInline = useCallback(
    (key: InlineKey) => {
      const el = getEditor();
      if (!el) return;

      const family = INLINE_FAMILIES[key];
      toggleInlineFormat(el, family);
      emitChange();
    },

    [emitChange, getEditor],
  );

  const handleLink = useCallback(() => {
    const el = getEditor();
    if (!el) return;

    const range = getEditorRange(el);
    const selected = window.getSelection()?.toString() ?? "";
    const url = window.prompt("Link URL (https://, mailto:, tel: or #anchor)", "https://");
    if (!url?.trim() || !range) return;
    if (selected) {
      wrapRange(range, "a", (a) => {
        a.setAttribute("href", url.trim());
      });
    } else {
      const text = window.prompt("Text to display for this link", url.trim());
      if (!text) return;
      const link = document.createElement("a");
      link.setAttribute("href", url.trim());
      link.textContent = text;
      range.insertNode(link);
      selectNode(link);
    }
    emitChange();
  }, [emitChange, getEditor]);

  const handleUnlink = useCallback(() => {
    const el = getEditor();
    if (!el) return;

    const range = getEditorRange(el);
    if (range) {
      unwrapInRange(range, (e) => e.tagName === "A");
    }
    emitChange();
  }, [emitChange, getEditor]);

  const handleClear = useCallback(() => {
    const el = getEditor();
    if (!el) return;

    const range = getEditorRange(el);
    if (range) {
      const clearable = (e: Element) =>
        e.tagName === "MARK" ||
        e.tagName === "CODE" ||
        Object.values(INLINE_FAMILIES).some((f) => f.ancestors.includes(e.tagName));
      unwrapInRange(range, clearable);
    }
    emitChange();
  }, [emitChange, getEditor]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (!(e.metaKey || e.ctrlKey) || e.shiftKey || e.altKey) return;
      const shortcuts: Record<string, InlineKey> = {
        b: "bold",
        i: "italic",
        u: "underline",
      };
      const shortcut = shortcuts[e.key.toLowerCase()];
      if (!shortcut) return;
      e.preventDefault();
      toggleInline(shortcut);
    },
    [toggleInline],
  );

  const toggleList = useCallback(
    (ordered: boolean) => {
      const el = getEditor();
      if (!el) return;

      toggleListFormat(el, ordered);
      emitChange();
    },
    [emitChange, getEditor],
  );

  return (
    <div className="w-full overflow-hidden rounded-lg border border-slate-300 bg-white focus-within:ring-1 focus-within:ring-blue-500 dark:border-slate-700 dark:bg-slate-800">
      <div
        aria-label="Text formatting"
        className="flex flex-wrap items-center gap-0.5 border-b border-slate-200 bg-slate-50 px-1.5 py-1 dark:border-slate-700 dark:bg-slate-800/60"
        role="toolbar"
      >
        {TOOLS.map(({ activeKey, icon: IconCmp, title }) => (
          <Button
            aria-label={title}
            aria-pressed={activeFormats[activeKey]}
            className={`rounded p-1.5 transition-colors ${
              activeFormats[activeKey]
                ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                : "text-slate-500 hover:bg-slate-200/70 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
            }`}
            key={activeKey}
            onClick={() =>
              activeKey === "unorderedList"
                ? toggleList(false)
                : activeKey === "olList"
                  ? toggleList(true)
                  : toggleInline(activeKey as InlineKey)
            }
            onMouseDown={(e) => e.preventDefault()}
            title={title}
          >
            <IconCmp className={IconSize} />
          </Button>
        ))}

        <span aria-hidden="true" className="mx-0.5 h-4 w-px bg-slate-200 dark:bg-slate-700" />

        <Button
          aria-label="Insert link"
          className="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-200/70 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
          onClick={handleLink}
          onMouseDown={(e) => e.preventDefault()}
          title="Insert link"
        >
          <Link className={IconSize} />
        </Button>

        <Button
          aria-label="Remove link"
          className="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-200/70 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
          onClick={handleUnlink}
          onMouseDown={(e) => e.preventDefault()}
          title="Remove link"
        >
          <Unlink className={IconSize} />
        </Button>

        <Button
          aria-label="Clear formatting"
          className="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-200/70 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
          onClick={handleClear}
          onMouseDown={(e) => e.preventDefault()}
          title="Clear formatting"
        >
          <Eraser className={IconSize} />
        </Button>
      </div>

      <div className="relative">
        {isEmpty && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-2 left-3 text-sm text-slate-400 dark:text-slate-500"
          >
            {placeholder}
          </span>
        )}

        {/* biome-ignore lint/a11y/useSemanticElements: contentEditable has no single-input semantic replacement */}
        <div
          aria-label={label}
          aria-multiline="true"
          className="overflow-y-auto px-3 py-2 text-sm leading-relaxed text-slate-900 outline-none dark:text-white [&_a]:text-blue-600 [&_a]:underline [&_a]:dark:text-blue-400 [&_li]:my-0.5 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5"
          contentEditable
          onBlur={emitChange}
          onInput={emitChange}
          onKeyDown={handleKeyDown}
          onMouseUp={() => setActiveFormats(readActiveFormats(editorRef.current))}
          onPaste={handlePaste}
          ref={editorRef}
          role="textbox"
          style={{ minHeight: `${rows * 1.5 + 1}rem` }}
          suppressContentEditableWarning
          tabIndex={0}
        />
      </div>
    </div>
  );

  /**
   * Paste as plain text: replace the selected range with a single text node so foreign markup never enters the document.
   */
  function handlePaste(e: React.ClipboardEvent<HTMLDivElement>): void {
    e.preventDefault();
    const el = getEditor();
    const text = e.clipboardData.getData("text/plain");
    const range = el ? getEditorRange(el) : null;

    if (range) {
      range.deleteContents();
      if (text) {
        const node = document.createTextNode(text);
        range.insertNode(node);
        window.getSelection()?.collapse(node, node.length);
      }
    }
    emitChange();
  }
};

/** Returns the current selection as a Range when it lives inside `el`. */
function getEditorRange(el: HTMLElement): Range | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;

  const range = selection.getRangeAt(0);
  if (!el.contains(range.commonAncestorContainer)) return null;
  return range;
}

/**
 * Adjust a range so its boundaries sit at element/node edges: text nodes are split so the range only ever covers whole
 * nodes. This makes extract + wrap safe for partially selected text.
 */
function alignRange(range: Range): Range {
  const adjusted = range.cloneRange();
  const endContainer = adjusted.endContainer;
  const endText = endContainer.nodeType === Node.TEXT_NODE ? (endContainer as Text) : null;

  if (endText && adjusted.endOffset < endText.length) {
    endText.splitText(adjusted.endOffset);
    adjusted.setEnd(endText, endText.length);
  }

  const startContainer = adjusted.startContainer;
  const startText = startContainer.nodeType === Node.TEXT_NODE ? (startContainer as Text) : null;

  if (startText && adjusted.startOffset > 0) {
    startText.splitText(adjusted.startOffset);
    adjusted.setStart(startText, startText.length);
  }
  return adjusted;
}

/** Move the caret so `node` is fully selected afterwards. */
function selectNode(node: Node): void {
  const selection = window.getSelection();
  if (!selection) return;
  const range = document.createRange();

  range.selectNodeContents(node);
  selection.removeAllRanges();
  selection.addRange(range);
}

/** Replace `wrapper` with its children, normalizing stray empty text nodes. */
function unwrapElement(wrapper: Element): void {
  const parent = wrapper.parentNode;
  if (!parent) return;

  while (wrapper.firstChild) {
    parent.insertBefore(wrapper.firstChild, wrapper);
  }
  parent.removeChild(wrapper);
  parent.normalize();
}

/** Unwrap every (deeply nested) element matching `test` inside `root`. */
function unwrapMatching(root: ParentNode, test: (e: Element) => boolean): void {
  for (;;) {
    const hits = Array.from(root.querySelectorAll("*")).filter(test);
    if (hits.length === 0) break;
    for (const hit of hits) unwrapElement(hit);
    root.normalize();
  }
}

/**
 * Extract the range contents (after boundary alignment), unwrap elements matching `test`, and reinsert the cleaned
 * nodes at the original position.The selection is restored over the replaced content.
 */
function unwrapInRange(range: Range, test: (e: Element) => boolean): void {
  const adjusted = alignRange(range);
  if (adjusted.collapsed) return;

  const fragment = adjusted.extractContents();
  unwrapMatching(fragment, test);
  adjusted.insertNode(fragment);
  restoreSelection(adjusted, fragment.childNodes.length);
}

/**
 * Toggle an inline format (bold/italic/...) over the current range: fully formatted selections are unwrapped, otherwise
 * the content is wrapped in the family's canonical element (e.g. `<strong>`) — one wrapper per block so the
 * sanitizer's paragraph structure survives.
 */
function toggleInlineFormat(el: HTMLElement, family: InlineFamily): void {
  const range = getEditorRange(el);
  if (!range) return;
  const familySet = new Set(family.ancestors);
  const adjusted = alignRange(range);
  if (adjusted.collapsed) return;

  const fragment = adjusted.extractContents();
  const allTextNodes = textNodesIn(fragment);

  if (allTextNodes.length === 0) {
    adjusted.insertNode(fragment);
    restoreSelection(adjusted, fragment.childNodes.length);
    return;
  }
  const already = allTextNodes.every((text) => hasAncestorTag(text, family.ancestors, fragment));
  unwrapMatching(fragment, (e) => familySet.has(e.tagName));

  const result = document.createDocumentFragment();
  for (const node of Array.from(fragment.childNodes)) {
    if (already) {
      result.appendChild(node);
    } else {
      const wrapper = document.createElement(family.element);
      wrapper.appendChild(node);
      result.appendChild(wrapper);
    }
  }
  adjusted.insertNode(result);
  restoreSelection(adjusted, result.childNodes.length);
}

function toggleListFormat(el: HTMLElement, ordered: boolean): void {
  const range = getEditorRange(el);
  if (!range) return;
  const targetTag = ordered ? "OL" : "UL";

  if (hasAncestorTag(range.startContainer, [targetTag], el)) {
    const items = Array.from(el.querySelectorAll("li")).filter((li) => {
      const list = li.parentElement;
      return (
        (ordered ? list?.tagName === "OL" : list?.tagName === "UL") && range.intersectsNode(li)
      );
    });

    for (const item of items) {
      const paragraph = document.createElement("p");
      item.replaceWith(paragraph);
      while (item.firstChild) paragraph.appendChild(item.firstChild);
    }

    for (const list of Array.from(el.querySelectorAll(targetTag === "OL" ? "ol" : "ul"))) {
      if (!list.firstChild || !list.textContent?.trim()) unwrapElement(list);
    }
    return;
  }
  if (range.collapsed) return;

  const blocks = Array.from(el.children).filter((child) => range.intersectsNode(child));
  if (blocks.length === 0) return;

  const list = document.createElement(ordered ? "ol" : "ul");
  el.insertBefore(list, blocks[0]);

  for (const block of blocks) {
    if (block.tagName === "UL" || block.tagName === "OL") {
      for (const item of Array.from(block.querySelectorAll("li"))) list.appendChild(item);
      block.remove();
      continue;
    }
    const item = document.createElement("li");
    while (block.firstChild) item.appendChild(block.firstChild);
    list.appendChild(item);
    block.remove();
  }
}

function readActiveFormats(el: HTMLElement | null): ActiveFormats {
  const empty: ActiveFormats = {
    ...INITIAL_FORMATS,
  };
  if (!el || typeof window === "undefined") return empty;

  const selection = window.getSelection();
  const node = selection && selection.rangeCount > 0 ? selection.focusNode : null;
  if (!node || !el.contains(node)) return empty;

  let current: Node | null = node;
  while (current && current !== el) {
    if (current.nodeType === Node.ELEMENT_NODE) {
      const tag = current.nodeName;
      if (tag === "B" || tag === "STRONG") empty.bold = true;
      else if (tag === "EM" || tag === "I") empty.italic = true;
      else if (tag === "U") empty.underline = true;
      else if (tag === "DEL" || tag === "S" || tag === "STRIKE") empty.strikethrough = true;
      else if (tag === "UL") empty.unorderedList = true;
      else if (tag === "OL") empty.orderedList = true;
    }
    current = current.parentNode;
  }

  const target = node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as Element);
  if (!(target instanceof Element)) return empty;
  const style = window.getComputedStyle(target);
  const weight = Number.parseFloat(style.fontWeight);

  if (Number.isFinite(weight) ? weight >= 600 : /^bold/i.test(style.fontWeight)) {
    empty.bold = true;
  }

  if (style.fontStyle === "italic") empty.italic = true;
  const decoration = style.textDecorationLine || style.textDecoration;
  const linkAncestor = target.closest("a");
  const insideLink = Boolean(linkAncestor) && (el === linkAncestor || el.contains(linkAncestor));

  if (decoration.includes("underline") && !insideLink) empty.underline = true;
  if (decoration.includes("line-through")) empty.strikethrough = true;
  return empty;
}

function textNodesIn(root: ParentNode): Text[] {
  const found: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node: Node | null = walker.nextNode();
  while (node) {
    found.push(node as Text);
    node = walker.nextNode();
  }
  return found;
}

function hasAncestorTag(node: Node, tags: string[], stopAt: Node): boolean {
  let current: Node | null = node;
  while (current && current !== stopAt) {
    if (current.nodeType === Node.ELEMENT_NODE && tags.includes(current.nodeName)) return true;
    current = current.parentNode;
  }
  return false;
}

function restoreSelection(range: Range, insertedCount: number): void {
  const selection = window.getSelection();
  if (!selection || !range.startContainer.isConnected) return;
  selection.removeAllRanges();
  const caret = document.createRange();
  caret.setStart(
    range.startContainer,
    Math.min(range.startOffset + insertedCount, range.startContainer.childNodes.length),
  );
  caret.collapse(true);
  selection.addRange(caret);
}

/** Wrap the aligned range with a new `<a>`, apply `configure` and reselect it. */
function wrapRange(range: Range, tag: "a", configure: (wrapper: HTMLAnchorElement) => void): void {
  const adjusted = alignRange(range);
  if (adjusted.collapsed) return;
  const fragment = adjusted.extractContents();
  unwrapMatching(fragment, (e) => e.tagName === "A");
  const wrapper = document.createElement(tag);
  configure(wrapper);
  wrapper.appendChild(fragment);
  adjusted.insertNode(wrapper);
  selectNode(wrapper);
}