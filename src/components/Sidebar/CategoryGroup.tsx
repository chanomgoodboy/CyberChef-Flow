import React, { useState, useCallback } from 'react';
import { OperationCard } from './OperationCard';
import type { OperationMeta } from '@/adapter/types';

interface CategoryGroupProps {
  name: string;
  operations: OperationMeta[];
}

export const CategoryGroup = React.memo(function CategoryGroup({
  name,
  operations,
}: CategoryGroupProps) {
  const [expanded, setExpanded] = useState(false);

  const toggleExpanded = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  return (
    <div className="category-group">
      <button className="category-header" onClick={toggleExpanded}>
        <span className={`category-chevron${expanded ? ' expanded' : ''}`}>
          <i className="fa-solid fa-caret-right" />
        </span>
        <span className="category-name">{name}</span>
        <span className="category-count">{operations.length}</span>
      </button>
      {expanded && (
        <div className="category-ops">
          {operations.map((op) => (
            <OperationCard
              key={op.name}
              name={op.name}
              description={op.description}
            />
          ))}
        </div>
      )}
    </div>
  );
});
