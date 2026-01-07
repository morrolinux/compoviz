import { AlertCircle } from 'lucide-react';

/**
 * Select dropdown component with label and tooltip
 * @param {string} label - Select label
 * @param {string} value - Selected value
 * @param {(value: string) => void} onChange - Change handler
 * @param {Array<string | {value: string, label: string}>} options - Options array
 * @param {string} placeholder - Placeholder option text
 * @param {string} tooltip - Tooltip text
 */
export const Select = ({ label, value, onChange, options, placeholder, tooltip }) => (
    <div className="space-y-1">
        <label className="text-xs text-cyber-text-muted flex items-center gap-1">
            {label}
            {tooltip && <span className="tooltip" data-tooltip={tooltip}><AlertCircle size={12} /></span>}
        </label>
        <select value={value || ''} onChange={e => onChange(e.target.value)} className="w-full">
            {placeholder && <option value="">{placeholder}</option>}
            {options.map(opt => (
                <option key={typeof opt === 'string' ? opt : opt.value} value={typeof opt === 'string' ? opt : opt.value}>
                    {typeof opt === 'string' ? opt : opt.label}
                </option>
            ))}
        </select>
    </div>
);

export default Select;
