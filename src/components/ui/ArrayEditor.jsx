import { Plus, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { IconButton } from './IconButton';
import { getErrorHelp } from '../../constants/errorHelp';

/**
 * Array editor for lists like ports, volumes, etc.
 * @param {string} label - Editor label
 * @param {string[]} value - Array of values
 * @param {(value: string[]) => void} onChange - Change handler
 * @param {string} placeholder - Placeholder for inputs
 * @param {Object} error - Error object with message property
 */
export const ArrayEditor = ({ label, value = [], onChange, placeholder = 'Value', error }) => {
    const addItem = () => onChange([...value, '']);
    const updateItem = (i, v) => { const n = [...value]; n[i] = v; onChange(n); };
    const removeItem = (i) => onChange(value.filter((_, idx) => idx !== i));

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className={`text-xs ${error ? 'text-cyber-error flex items-center gap-1' : 'text-cyber-text-muted'}`}>
                    {error && <AlertCircle size={12} />}
                    {label}
                </label>
                <button
                    onClick={addItem}
                    className="text-xs text-cyber-accent hover:text-cyber-accent-hover flex items-center gap-1"
                >
                    <Plus size={12} />Add
                </button>
            </div>
            {value.map((v, i) => (
                <div key={i} className="flex gap-2 items-center">
                    <input
                        className={`flex-1 ${error ? 'border-cyber-error ring-2 ring-cyber-error/30 bg-cyber-error/5' : ''}`}
                        placeholder={placeholder}
                        value={v}
                        onChange={e => updateItem(i, e.target.value)}
                    />
                    <IconButton icon={Trash2} onClick={() => removeItem(i)} variant="danger" size="sm" />
                </div>
            ))}
            {error && (
                <div className="mt-2 p-3 rounded-lg border border-cyber-error/40 bg-cyber-error/10 animate-fade-in">
                    <div className="flex items-start gap-2">
                        <AlertCircle size={16} className="text-cyber-error mt-0.5 flex-shrink-0" />
                        <div className="flex-1 space-y-2 text-sm">
                            <p className="font-medium text-cyber-error">{error.message}</p>
                            <p className="text-cyber-text-muted text-xs">{getErrorHelp(error.message).explanation}</p>
                            <div className="flex items-start gap-2 p-2 bg-cyber-success/10 rounded border border-cyber-success/30">
                                <CheckCircle size={14} className="text-cyber-success mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-cyber-success">{getErrorHelp(error.message).solution}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ArrayEditor;
