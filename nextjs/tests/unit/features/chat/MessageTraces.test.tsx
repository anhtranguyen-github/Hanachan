import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MessageTraces } from '@/components/chat/MessageTraces';

describe('MessageTraces', () => {
    it('returns null if there are no traces', () => {
        const { container } = render(<MessageTraces traces={[]} />);
        expect(container.firstChild).toBeNull();
    });

    it('renders the live streaming badge when isStreaming is true', () => {
        const traces = [
            { type: 'thought', content: 'Thinking about Japanese...' },
            { type: 'status', content: 'Executing Memory Search...' }
        ];

        render(<MessageTraces traces={traces} isStreaming={true} />);

        // Should render the very last trace inline
        expect(screen.getByText('Executing Memory Search...')).toBeDefined();
        // Should not render the accordion button
        expect(screen.queryByText(/Agent Reasoning/)).toBeNull();
    });

    it('renders the accordion button when isStreaming is false', () => {
        const traces = [
            { type: 'thought', content: 'Thought 1' },
            { type: 'thought', content: 'Thought 2' }
        ];

        render(<MessageTraces traces={traces} isStreaming={false} />);

        // Should see the collapsed accordion button with the count
        const button = screen.getByText('Agent Reasoning (2 steps)');
        expect(button).toBeDefined();

        // The traces themselves shouldn't be visible yet
        expect(screen.queryByText('Thought 1')).toBeNull();
    });

    it('expands the accordion and renders markdown when clicked', () => {
        const traces = [
            { type: 'status', content: 'Connecting to DB...' },
            { type: 'thought', content: 'Found the `kanji` matching **食**' }
        ];

        render(<MessageTraces traces={traces} isStreaming={false} />);

        // Click the accordion
        const button = screen.getByRole('button');
        fireEvent.click(button);

        // Traces should now be visible
        expect(screen.getByText('Connecting to DB...')).toBeDefined();
        
        // ReactMarkdown should have rendered the bold tags
        const kanjiBold = screen.getByText('食');
        expect(kanjiBold.tagName).toBe('STRONG');
    });
});
