import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Position, type NodeProps } from '@xyflow/react';
import { DataHandle } from '@/components/NodeParts/DataHandle';
import { useGraphStore } from '@/store/graphStore';

const INPUT_TYPES = ['Text', 'Hex', 'File'] as const;

/**
 * Convert an ArrayBuffer to a Latin-1 binary string (one char per byte,
 * preserving every byte value 0x00-0xFF including 0x0D).
 */
function bufToBinStr(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  const chunks: string[] = [];
  const CHUNK = 8192;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    chunks.push(String.fromCharCode(...bytes.subarray(i, i + CHUNK)));
  }
  return chunks.join('');
}

/**
 * Parse a hex string like "89 50 4e 47 0d 0a" into an ArrayBuffer.
 */
function hexToBuf(hex: string): ArrayBuffer {
  const clean = hex.replace(/[^0-9a-fA-F]/g, '');
  const len = Math.floor(clean.length / 2);
  const buf = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    buf[i] = parseInt(clean.substring(i * 2, i * 2 + 2), 16);
  }
  return buf.buffer;
}

function InputNodeInner({ id, data, selected }: NodeProps) {
  const updateNodeData = useGraphStore((s) => s.updateNodeData);
  const nodes = useGraphStore((s) => s.nodes);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const storeValue = (data.inputValue as string) ?? '';
  const inputType = (data.inputType as string) ?? 'Text';
  const fileName = (data.fileName as string) ?? '';

  // Local state for the textarea to preserve cursor position during typing.
  // Only sync from store when the change comes from outside (file load, paste, etc.)
  const [localValue, setLocalValue] = useState(storeValue);
  const ownChangeRef = useRef(false);
  useEffect(() => {
    if (!ownChangeRef.current) {
      setLocalValue(storeValue);
    }
    ownChangeRef.current = false;
  }, [storeValue]);
  const inputValue = localValue;

  const inputLabel = useMemo(() => {
    const inputNodes = nodes.filter((n) => n.type === 'input');
    if (inputNodes.length <= 1) return 'Input';
    const idx = inputNodes.findIndex((n) => n.id === id);
    return `Input ${idx + 1}`;
  }, [nodes, id]);

  const setRawInput = useCallback(
    (buf: ArrayBuffer, name?: string) => {
      const display = bufToBinStr(buf);
      updateNodeData(id, { inputValue: display, inputRaw: buf, fileName: name ?? '' });
    },
    [id, updateNodeData],
  );

  const handleValueChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      ownChangeRef.current = true;
      setLocalValue(e.target.value);
      updateNodeData(id, { inputValue: e.target.value, inputRaw: null, fileName: '' });
    },
    [id, updateNodeData],
  );

  const handleHexChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const hex = e.target.value;
      ownChangeRef.current = true;
      setLocalValue(hex);
      updateNodeData(id, { inputValue: hex, inputRaw: hexToBuf(hex), fileName: '' });
    },
    [id, updateNodeData],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].kind === 'file') {
          e.preventDefault();
          const file = items[i].getAsFile();
          if (!file) continue;
          file.arrayBuffer().then((buf) => setRawInput(buf, file.name));
          return;
        }
      }
      const raw = e.clipboardData.getData('text/plain');
      if (raw) {
        e.preventDefault();
        updateNodeData(id, { inputValue: raw, inputRaw: null, fileName: '' });
      }
    },
    [id, updateNodeData, setRawInput],
  );

  const [dragOver, setDragOver] = useState(false);
  const dragCounterRef = useRef(0);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (!file) return;
      file.arrayBuffer().then((buf) => setRawInput(buf, file.name));
    },
    [setRawInput],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.types.includes('Files')) {
      setDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setDragOver(false);
    }
  }, []);

  const handleOpenFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      file.arrayBuffer().then((buf) => setRawInput(buf, file.name));
      // Reset so the same file can be re-selected
      e.target.value = '';
    },
    [setRawInput],
  );

  const handleTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      updateNodeData(id, { inputType: e.target.value });
    },
    [id, updateNodeData],
  );

  return (
    <div
      className={`input-node${selected ? ' selected' : ''}${dragOver ? ' drag-over' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
    >
      {dragOver && (
        <div className="input-drop-overlay">Drop file here</div>
      )}
      {/* Hidden file input for all modes */}
      <input
        ref={fileInputRef}
        type="file"
        className="input-file-hidden"
        onChange={handleFileSelect}
      />
      {/* Floating border label */}
      <div className="input-label-row">
        <span className="input-label">{inputLabel}</span>
        <div className="input-label-actions">
          <button
            className="input-icon-btn"
            onClick={handleOpenFile}
            title="Open file"
          >
            <i className="fa-solid fa-folder-open" />
          </button>
          <select
            className="input-type-select"
            value={inputType}
            onChange={handleTypeChange}
          >
            {INPUT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>
      {fileName && (
        <div className="input-file-info">{fileName} ({data.inputRaw ? (data.inputRaw as ArrayBuffer).byteLength : 0} bytes)</div>
      )}
      <textarea
        className="input-textarea nowheel"
        value={inputValue}
        onChange={inputType === 'Hex' ? handleHexChange : handleValueChange}
        onPaste={handlePaste}
        placeholder={
          inputType === 'Hex'
            ? 'Hex: 89 50 4e 47 ...'
            : 'Input data...'
        }
        rows={3}
      />
      <DataHandle
        type="source"
        position={Position.Bottom}
        dishType="string"
        id="output"
      />
    </div>
  );
}

export const InputNode = React.memo(InputNodeInner);
