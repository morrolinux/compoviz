import { useCallback } from 'react';

/**
 * Custom hook to handle project state actions
 * @param {Object} dispatch - Dispatch function from useCompose
 * @param {Object} selected - Currently selected item
 * @param {Function} setSelected - Function to update selected item
 * @param {Function} setShowTemplates - Function to show/hide template modal
 * @param {Function} resetProject - Function to reset the entire project
 * @returns {Object} Project action handlers
 */
export function useProjectActions(dispatch, selected, setSelected, setShowTemplates, resetProject) {
    /**
     * Add a new resource (service, network, volume, etc.)
     */
    const handleAdd = (type) => {
        const name = prompt(`Enter ${type.slice(0, -1)} name:`);
        if (name?.trim()) {
            dispatch({ type: `ADD_${type.slice(0, -1).toUpperCase()}`, name: name.trim() });
            setSelected({ type, name: name.trim() });
        }
    };

    /**
     * Add a service from a template
     */
    const handleAddFromTemplate = (templateName, serviceTemplates) => {
        const template = serviceTemplates[templateName];
        if (!template) return;

        const serviceName = template.name || templateName;
        dispatch({ type: 'ADD_SERVICE', name: serviceName });
        dispatch({ type: 'UPDATE_SERVICE', name: serviceName, data: template.config });

        // Add suggested volume if exists
        if (template.suggestedVolume) {
            dispatch({ type: 'ADD_VOLUME', name: template.suggestedVolume.name });
            if (template.suggestedVolume.config) {
                dispatch({ type: 'UPDATE_VOLUME', name: template.suggestedVolume.name, data: template.suggestedVolume.config });
            }
        }

        setSelected({ type: 'services', name: serviceName });
        setShowTemplates(false);
    };

    /**
     * Delete a resource
     */
    const handleDelete = (type, name) => {
        if (confirm(`Delete ${name}?`)) {
            dispatch({ type: `DELETE_${type.slice(0, -1).toUpperCase()}`, name });
            if (selected?.name === name) setSelected(null);
        }
    };

    /**
     * Update the currently selected resource
     */
    const handleUpdate = useCallback((data) => {
        if (!selected) return;
        dispatch({ type: `UPDATE_${selected.type.slice(0, -1).toUpperCase()}`, name: selected.name, data });
    }, [selected, dispatch]);

    /**
     * Clear all project data
     */
    const handleClearAll = () => {
        if (resetProject()) {
            setSelected(null);
        }
    };

    return {
        handleAdd,
        handleAddFromTemplate,
        handleDelete,
        handleUpdate,
        handleClearAll,
    };
}
