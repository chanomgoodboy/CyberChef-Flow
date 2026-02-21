import { Handle, Position } from '@xyflow/react';
import { getDishTypeColor } from '@/utils/dishTypeColors';

interface DataHandleProps {
  type: 'source' | 'target';
  position: Position;
  dishType?: string;
  id?: string;
}

export function DataHandle({ type, position, dishType = 'string', id }: DataHandleProps) {
  const isVertical = position === Position.Top || position === Position.Bottom;
  return (
    <Handle
      type={type}
      position={position}
      id={id}
      style={{
        background: getDishTypeColor(dishType),
        width: 12,
        height: 12,
        border: '2px solid var(--bg-secondary, #16213e)',
        boxShadow: `0 0 0 1px ${getDishTypeColor(dishType)}`,
        ...(isVertical ? { left: 20 } : {}),
      }}
    />
  );
}
