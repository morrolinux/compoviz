import { useReducer, useCallback, useEffect } from 'react';

/**
 * A hook that wraps a reducer with undo/redo functionality.
 * @param {function} reducer - The base reducer function.
 * @param {any} initialState - The initial state.
 * @returns {{state: any, dispatch: function, undo: function, redo: function, canUndo: boolean, canRedo: boolean}}
 */
export function useHistoryReducer(reducer, initialState) {
    const historyReducer = (history, action) => {
        switch (action.type) {
            case 'UNDO': {
                if (history.past.length === 0) return history;
                const previous = history.past[history.past.length - 1];
                const newPast = history.past.slice(0, -1);
                return {
                    past: newPast,
                    present: previous,
                    future: [history.present, ...history.future],
                };
            }
            case 'REDO': {
                if (history.future.length === 0) return history;
                const next = history.future[0];
                const newFuture = history.future.slice(1);
                return {
                    past: [...history.past, history.present],
                    present: next,
                    future: newFuture,
                };
            }
            case 'RESET_HISTORY': {
                return {
                    past: [],
                    present: action.payload,
                    future: [],
                };
            }
            default: {
                const newPresent = reducer(history.present, action);
                if (newPresent === history.present) return history;
                return {
                    past: [...history.past, history.present].slice(-50), // Keep last 50 states
                    present: newPresent,
                    future: [],
                };
            }
        }
    };

    const [history, historyDispatch] = useReducer(historyReducer, {
        past: [],
        present: initialState,
        future: [],
    });

    const dispatch = useCallback((action) => {
        historyDispatch(action);
    }, []);

    const undo = useCallback(() => {
        historyDispatch({ type: 'UNDO' });
    }, []);

    const redo = useCallback(() => {
        historyDispatch({ type: 'REDO' });
    }, []);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // If focus is inside a text input or editable element, don't intercept
            try {
                const active = document.activeElement;
                const tag = active && active.tagName && active.tagName.toLowerCase();
                const isEditable = active && (active.isContentEditable || tag === 'textarea' || tag === 'input' || tag === 'select');
                if (isEditable) return; // allow native undo in inputs
            } catch (err) {
                // ignore
            }

            if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
                e.preventDefault();
                if (e.shiftKey) {
                    redo();
                } else {
                    undo();
                }
            }
            if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
                e.preventDefault();
                redo();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo]);

    return {
        state: history.present,
        dispatch,
        undo,
        redo,
        canUndo: history.past.length > 0,
        canRedo: history.future.length > 0,
    };
}
