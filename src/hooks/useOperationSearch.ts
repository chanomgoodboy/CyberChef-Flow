import { useMemo } from 'react';
import Fuse, { type IFuseOptions } from 'fuse.js';
import type { OperationMeta } from '@/adapter/types';

/* ------------------------------------------------------------------ */
/*  Fuse.js configuration                                              */
/* ------------------------------------------------------------------ */

const FUSE_OPTIONS: IFuseOptions<OperationMeta> = {
  keys: [
    { name: 'name', weight: 0.6 },
    { name: 'description', weight: 0.25 },
    { name: 'module', weight: 0.15 },
  ],
  threshold: 0.35,
  includeScore: true,
  minMatchCharLength: 1,
};

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

/**
 * Fuzzy-search over a list of CyberChef operation metadata entries.
 *
 * The Fuse index is memoised so it is only rebuilt when the operation
 * list reference changes (which should be once, at startup).
 *
 * @param operations  Full list of operations from the OperationRegistry.
 * @param query       Current search string (may be empty).
 * @returns           Filtered array of `OperationMeta`.  When the query
 *                    is empty the full list is returned unchanged.
 */
export function useOperationSearch(
  operations: OperationMeta[],
  query: string,
): OperationMeta[] {
  const fuse = useMemo(
    () => new Fuse(operations, FUSE_OPTIONS),
    [operations],
  );

  return useMemo(() => {
    const trimmed = query.trim();
    if (trimmed.length === 0) return operations;
    return fuse.search(trimmed).map((r) => r.item);
  }, [fuse, operations, query]);
}
