"use client";

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useWindowVirtualizer } from '@tanstack/react-virtual';

interface VirtualizedLevelProps<T> {
    items: T[];
    renderItem: (item: T, index: number) => React.ReactNode;
    gap?: number;
    minChildWidth?: number;
    className?: string;
}

export function VirtualizedLevel<T>({
    items,
    renderItem,
    gap = 12,
    minChildWidth = 100,
    className = ""
}: VirtualizedLevelProps<T>) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [columnCount, setColumnCount] = useState(1);
    const [marginTop, setMarginTop] = useState(0);

    // Dynamic column calculation based on container width and scroll margin
    useEffect(() => {
        const update = () => {
            if (containerRef.current) {
                const width = containerRef.current.offsetWidth;
                const cols = Math.max(1, Math.floor((width + gap) / (minChildWidth + gap)));
                setColumnCount(cols);
                setMarginTop(containerRef.current.offsetTop);
            }
        };

        update();
        const observer = new ResizeObserver(update);
        if (containerRef.current) observer.observe(containerRef.current);
        // Also listen to window resize to update offsetTop
        window.addEventListener('resize', update);
        return () => {
            observer.disconnect();
            window.removeEventListener('resize', update);
        };
    }, [gap, minChildWidth, items]);

    const rowCount = Math.ceil(items.length / columnCount);

    const virtualizer = useWindowVirtualizer({
        count: rowCount,
        estimateSize: () => 110, // Estimate height of a card + gap
        overscan: 2,
        scrollMargin: marginTop,
    });

    const virtualRows = virtualizer.getVirtualItems();

    return (
        <div ref={containerRef} className={className} style={{ position: 'relative' }}>
            <div
                style={{
                    height: `${Math.max(0, virtualizer.getTotalSize() - marginTop)}px`,
                    width: '100%',
                    position: 'relative',
                }}
            >
                {virtualRows.map((virtualRow) => {
                    const rowIndex = virtualRow.index;
                    const startIdx = rowIndex * columnCount;
                    const rowItems = items.slice(startIdx, startIdx + columnCount);

                    return (
                        <div
                            key={virtualRow.key}
                            data-index={virtualRow.index}
                            ref={virtualizer.measureElement}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                transform: `translateY(${virtualRow.start - marginTop}px)`,
                                display: 'grid',
                                gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
                                gap: `${gap}px`,
                                paddingBottom: `${gap}px`,
                            }}
                        >
                            {rowItems.map((item, colIndex) => {
                                const globalIdx = startIdx + colIndex;
                                return (
                                    <div key={globalIdx}>
                                        {renderItem(item, globalIdx)}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
