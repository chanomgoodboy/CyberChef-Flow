import React from 'react';

interface PreviewPanelProps {
  value?: string;
  maxLength?: number;
}

export const PreviewPanel = React.memo(function PreviewPanel({
  value,
  maxLength = 100,
}: PreviewPanelProps) {
  if (!value) {
    return (
      <div className="node-preview">
        <span className="preview-empty">No output</span>
      </div>
    );
  }

  // Strip HTML tags and ANSI escape codes for preview
  // eslint-disable-next-line no-control-regex
  const plain = value.replace(/<[^>]+>/g, '').replace(/\x1b\[[0-9;]*[A-Za-z]/g, '');
  // Show only the first line, truncated
  const firstLine = plain.split('\n')[0];
  const display =
    firstLine.length > maxLength ? firstLine.slice(0, maxLength) + '\u2026' : firstLine;

  return (
    <div className="node-preview">
      <span className="preview-text">{display}</span>
    </div>
  );
});
