import type { NodeTypes } from '@xyflow/react';
import { InputNode } from './InputNode';
import { OperationNode } from './OperationNode';
import { NoteNode } from './NoteNode';
import { MagicNode } from './MagicNode';
import { ArtifactNode } from './ArtifactNode';

export const nodeTypes: NodeTypes = {
  input: InputNode,
  operation: OperationNode,
  note: NoteNode,
  magic: MagicNode,
  artifact: ArtifactNode,
};
