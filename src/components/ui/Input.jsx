import { AlertCircle, CheckCircle } from 'lucide-react';
import { getErrorHelp } from '../../constants/errorHelp';

/**
 * Enhanced Input with label, tooltip, and error state support
 * @param {string} label - Input label
 * @param {string} value - Input value
 * @param {(value: string) => void} onChange - Change handler
 * @param {string} placeholder - Placeholder text
 * @param {string} tooltip - Tooltip text
 * @param {Object} error - Error object with message property
 */
export const Input = ({ label, value, onChange, placeholder, tooltip, error }) => (
    <div className="space-y-1">
        <label className={`text-xs flex items-center gap-1 ${error ? 'text-cyber-error' : 'text-cyber-text-muted'}`}>
            {error && <AlertCircle size={12} className="text-cyber-error" />}
            {label}
            {tooltip && <span className="tooltip" data-tooltip={tooltip}><AlertCircle size={12} /></span>}
        </label>
        <input
            type="text"
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className={`w-full ${error ? 'border-cyber-error ring-2 ring-cyber-error/30 bg-cyber-error/5' : ''}`}
        />
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

export default Input;
