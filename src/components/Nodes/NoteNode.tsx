import React, { useCallback, useState, useMemo, useRef, useEffect } from 'react';
import { NodeResizer, type NodeProps } from '@xyflow/react';
import { useGraphStore } from '@/store/graphStore';
import DOMPurify from 'dompurify';

/* ------------------------------------------------------------------ */
/*  Lightweight markdown → HTML renderer                               */
/* ------------------------------------------------------------------ */

function renderMarkdown(md: string): string {
  let html = md
    // Escape HTML entities first
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Code blocks (``` ... ```)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, _lang, code) => {
    return `<pre><code>${code.trimEnd()}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Headers
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Bold + italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Strikethrough
  html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');

  // Horizontal rule
  html = html.replace(/^---$/gm, '<hr/>');

  // Unordered lists
  html = html.replace(/^[*-] (.+)$/gm, '<li>$1</li>');
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

  // Line breaks — convert remaining newlines to <br> (but not inside <pre>)
  const parts = html.split(/(<pre>[\s\S]*?<\/pre>)/);
  html = parts
    .map((part, i) => (i % 2 === 0 ? part.replace(/\n/g, '<br/>') : part))
    .join('');

  return DOMPurify.sanitize(html);
}

/* ------------------------------------------------------------------ */
/*  Note Node                                                          */
/* ------------------------------------------------------------------ */

function NoteNodeInner({ id, data, selected }: NodeProps) {
  const updateNodeData = useGraphStore((s) => s.updateNodeData);
  const [editing, setEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const noteContent = (data.noteContent as string) ?? (data.text as string) ?? '';

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateNodeData(id, { noteContent: e.target.value, text: e.target.value });
    },
    [id, updateNodeData],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const ta = e.currentTarget;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const val = ta.value;
        const newVal = val.slice(0, start) + '  ' + val.slice(end);
        updateNodeData(id, { noteContent: newVal, text: newVal });
        requestAnimationFrame(() => {
          ta.selectionStart = ta.selectionEnd = start + 2;
        });
      }
    },
    [id, updateNodeData],
  );

  const handleDoubleClick = useCallback(() => {
    setEditing(true);
  }, []);

  const handleBlur = useCallback(() => {
    setEditing(false);
  }, []);

  // Auto-focus textarea when entering edit mode
  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [editing]);

  const renderedHtml = useMemo(() => renderMarkdown(noteContent), [noteContent]);

  return (
    <div className={`cyberweb-node note-node${selected ? ' selected' : ''}`}>
      <NodeResizer
        minWidth={120}
        minHeight={80}
        isVisible={selected}
        lineClassName="node-resize-line-note"
        handleClassName="node-resize-handle-note"
      />
      <div className="node-header note-header">
        <span className="node-icon"><i className="fa-solid fa-note-sticky" /></span>
        <span className="node-title">Note</span>
        {editing && (
          <button
            className="node-close-btn"
            onClick={() => setEditing(false)}
            title="Preview"
          >
            <i className="fa-solid fa-check" />
          </button>
        )}
      </div>
      <div className="node-body note-body" onDoubleClick={!editing ? handleDoubleClick : undefined}>
        {editing ? (
          <textarea
            ref={textareaRef}
            className="note-textarea nowheel nodrag"
            value={noteContent}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder="Markdown supported..."
          />
        ) : noteContent ? (
          <div
            className="note-preview nowheel"
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />
        ) : (
          <div className="note-preview nowheel">
            <span className="note-placeholder">Double-click to edit...</span>
          </div>
        )}
      </div>
    </div>
  );
}

export const NoteNode = React.memo(NoteNodeInner);
