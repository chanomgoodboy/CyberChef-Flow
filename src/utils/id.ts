import { nanoid } from 'nanoid';

export const createNodeId = () => `node_${nanoid(8)}`;
export const createEdgeId = () => `edge_${nanoid(8)}`;
