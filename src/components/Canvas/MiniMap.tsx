import { MiniMap as RFMiniMap } from '@xyflow/react';

export function MiniMap() {
  return (
    <RFMiniMap
      style={{ height: 100, width: 150 }}
      zoomable
      pannable
      nodeColor={(node) => {
        switch (node.type) {
          case 'input':
            return '#4a9eff';
          case 'operation':
            return '#7c4dff';
          case 'note':
            return '#fff176';
          default:
            return '#999';
        }
      }}
    />
  );
}
