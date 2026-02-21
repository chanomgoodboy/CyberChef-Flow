import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Position, type NodeProps } from '@xyflow/react';
import { DataHandle } from '@/components/NodeParts/DataHandle';
import { useGraphStore } from '@/store/graphStore';

export interface ArtifactFile {
  name: string;
  size: number;
  data: string; // base64
  hash: string; // content hash for dedup
  addedAt: number; // timestamp
  folder: string; // folder path, '/' = root
}

/**
 * Fast FNV-1a hash of a string, returned as 16-char hex.
 */
export function computeFileHash(data: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x27d4eb2f;
  for (let i = 0; i < data.length; i++) {
    const c = data.charCodeAt(i);
    h1 ^= c;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= c;
    h2 = Math.imul(h2, 0x100000fb);
  }
  return (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0');
}

function ArtifactNodeInner({ id, data, selected }: NodeProps) {
  const removeNode = useGraphStore((s) => s.removeNode);

  const files = (data.files as ArtifactFile[]) ?? [];
  const newFileCount = (data.newFileCount as number) ?? 0;
  const lastUpdated = (data.lastUpdated as number) ?? 0;

  // Glow animation on new files
  const [glowing, setGlowing] = useState(false);
  const prevUpdated = useRef(lastUpdated);

  useEffect(() => {
    if (lastUpdated > 0 && lastUpdated !== prevUpdated.current) {
      prevUpdated.current = lastUpdated;
      setGlowing(true);
      const timer = setTimeout(() => setGlowing(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [lastUpdated]);

  const handleRemove = useCallback(() => {
    removeNode(id);
  }, [id, removeNode]);

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  const sizeLabel = totalSize < 1024
    ? `${totalSize} B`
    : totalSize < 1024 * 1024
      ? `${(totalSize / 1024).toFixed(1)} KB`
      : `${(totalSize / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <div className={`cyberweb-node artifact-node${selected ? ' selected' : ''}${glowing ? ' artifact-glow' : ''}`}>
      <DataHandle
        type="target"
        position={Position.Top}
        dishType="ArrayBuffer"
        id="input"
      />

      <div className="node-header artifact-header">
        <span className="node-icon"><i className="fa-solid fa-folder-open" /></span>
        <span className="node-title">Artifacts</span>
        {newFileCount > 0 && (
          <span className="artifact-badge">{newFileCount}</span>
        )}
        <button
          className="node-close-btn"
          onClick={handleRemove}
          title="Remove node"
        >
          <i className="fa-solid fa-xmark" />
        </button>
      </div>

      <div className="node-body">
        <div className="artifact-summary">
          {files.length === 0
            ? 'No files'
            : `${files.length} file${files.length !== 1 ? 's' : ''} (${sizeLabel})`}
        </div>
      </div>
    </div>
  );
}

export const ArtifactNode = React.memo(ArtifactNodeInner);
