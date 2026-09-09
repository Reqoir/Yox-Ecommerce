'use client';

import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  MoreHorizontal 
} from 'lucide-react';
import { Button } from './button';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  itemsPerPage?: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  itemsPerPageOptions?: number[];
  className?: string;
  showDetails?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage = 10,
  onPageChange,
  onItemsPerPageChange,
  itemsPerPageOptions = [10, 25, 50, 100],
  className = '',
  showDetails = true,
}: PaginationProps) {
  // If there are no items or no pages to show, keep it minimal
  if (totalPages <= 0 && (!totalItems || totalItems <= 0)) {
    return null;
  }

  const effectiveTotalPages = Math.max(1, totalPages);
  const startItem = totalItems !== undefined ? (totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1) : null;
  const endItem = totalItems !== undefined ? Math.min(currentPage * itemsPerPage, totalItems) : null;

  // Calculate numeric page numbers with ellipses
  const getPageNumbers = (): (number | string)[] => {
    if (effectiveTotalPages <= 5) {
      return Array.from({ length: effectiveTotalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 3) {
      return [1, 2, 3, 4, '...', effectiveTotalPages];
    }

    if (currentPage >= effectiveTotalPages - 2) {
      return [1, '...', effectiveTotalPages - 3, effectiveTotalPages - 2, effectiveTotalPages - 1, effectiveTotalPages];
    }

    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', effectiveTotalPages];
  };

  const pageNumbers = getPageNumbers();

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-2 py-3.5 bg-card border border-border rounded-lg shadow-2xs ${className}`}
    >
      {/* Left info & Per-page selector */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground w-full sm:w-auto justify-between sm:justify-start">
        {showDetails && (
          <div>
            {totalItems !== undefined ? (
              <span>
                Showing <strong className="font-semibold text-foreground">{startItem}</strong> to{' '}
                <strong className="font-semibold text-foreground">{endItem}</strong> of{' '}
                <strong className="font-semibold text-foreground">{totalItems}</strong> entries
              </span>
            ) : (
              <span>
                Page <strong className="font-semibold text-foreground">{currentPage}</strong> of{' '}
                <strong className="font-semibold text-foreground">{effectiveTotalPages}</strong>
              </span>
            )}
          </div>
        )}

        {onItemsPerPageChange && (
          <div className="flex items-center gap-1.5 ml-auto sm:ml-2">
            <span className="text-[11px] text-muted-foreground font-medium whitespace-nowrap">Rows per page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                const newSize = Number(e.target.value);
                onItemsPerPageChange(newSize);
                onPageChange(1);
              }}
              aria-label="Rows per page"
              className="text-xs font-semibold bg-secondary border border-border rounded px-2 py-1 text-foreground focus:outline-none focus:border-primary cursor-pointer"
            >
              {itemsPerPageOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right Page Controls */}
      <div className="flex items-center gap-1">
        {/* First page button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 cursor-pointer hidden sm:flex text-muted-foreground hover:text-foreground disabled:opacity-40"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          title="First Page"
        >
          <ChevronsLeft className="h-4 w-4" />
          <span className="sr-only">First Page</span>
        </Button>

        {/* Previous page button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 cursor-pointer text-muted-foreground hover:text-foreground disabled:opacity-40"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          title="Previous Page"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous Page</span>
        </Button>

        {/* Numeric page pills */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, idx) =>
            page === '...' ? (
              <div key={`ellipsis-${idx}`} className="flex h-8 w-7 items-center justify-center">
                <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            ) : (
              <button
                key={`page-${page}`}
                type="button"
                className={`h-8 min-w-[32px] px-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  currentPage === page
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-background hover:bg-muted text-foreground border border-border'
                }`}
                onClick={() => onPageChange(Number(page))}
              >
                {page}
              </button>
            )
          )}
        </div>

        {/* Next page button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 cursor-pointer text-muted-foreground hover:text-foreground disabled:opacity-40"
          onClick={() => onPageChange(Math.min(effectiveTotalPages, currentPage + 1))}
          disabled={currentPage === effectiveTotalPages}
          title="Next Page"
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next Page</span>
        </Button>

        {/* Last page button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 cursor-pointer hidden sm:flex text-muted-foreground hover:text-foreground disabled:opacity-40"
          onClick={() => onPageChange(effectiveTotalPages)}
          disabled={currentPage === effectiveTotalPages}
          title="Last Page"
        >
          <ChevronsRight className="h-4 w-4" />
          <span className="sr-only">Last Page</span>
        </Button>
      </div>
    </div>
  );
}
