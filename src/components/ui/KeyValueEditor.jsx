import { Plus, Trash2 } from 'lucide-react';
import { IconButton } from './IconButton';

/**
 * Key-Value pair editor for environment variables, labels, etc.
 * @param {string} label - Editor label
 * @param {Object} value - Object of key-value pairs
 * @param {(value: Object) => void} onChange - Change handler
 * @param {string} keyPlaceholder - Placeholder for key input
 * @param {string} valuePlaceholder - Placeholder for value input
 */
export const KeyValueEditor = ({
    label,
    value = {},
    onChange,
    keyPlaceholder = 'Key',
    valuePlaceholder = 'Value'
}) => {
    const entries = Object.entries(value);

    const addEntry = () => onChange({ ...value, '': '' });

    const updateKey = (oldKey, newKey) => {
        const newVal = { ...value };
        const v = newVal[oldKey];
        delete newVal[oldKey];
        newVal[newKey] = v;
        onChange(newVal);
    };

    const updateValue = (key, newValue) => onChange({ ...value, [key]: newValue });

    const removeEntry = (key) => {
        const { [key]: _, ...rest } = value;
        onChange(rest);
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="text-xs text-cyber-text-muted">{label}</label>
                <button
                    onClick={addEntry}
                    className="text-xs text-cyber-accent hover:text-cyber-accent-hover flex items-center gap-1"
                >
                    <Plus size={12} />Add
                </button>
            </div>
            {entries.map(([k, v], i) => (
                <div key={i} className="flex gap-2 items-center">
                    <input
                        className="flex-1"
                        placeholder={keyPlaceholder}
                        value={k}
                        onChange={e => updateKey(k, e.target.value)}
                    />
                    <input
                        className="flex-1"
                        placeholder={valuePlaceholder}
                        value={v}
                        onChange={e => updateValue(k, e.target.value)}
                    />
                    <IconButton icon={Trash2} onClick={() => removeEntry(k)} variant="danger" size="sm" />
                </div>
            ))}
        </div>
    );
};

export default KeyValueEditor;
