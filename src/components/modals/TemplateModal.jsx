import { X, Sparkles } from 'lucide-react';
import { IconButton } from '../ui';
import { serviceTemplates, getTemplateNames } from '../../data/templates';

/**
 * Template selection modal for quickly adding pre-configured services
 */
export const TemplateModal = ({ onSelect, onClose }) => {
    const templates = getTemplateNames();
    const templateIcons = {
        redis: '🔴', postgres: '🐘', mysql: '🐬', mongodb: '🍃',
        nginx: '⚡', node: '💚', python: '🐍', rabbitmq: '🐰'
    };

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="glass rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-auto animate-slide-in"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Sparkles className="text-cyber-accent" />Service Templates
                    </h2>
                    <IconButton icon={X} onClick={onClose} />
                </div>
                <p className="text-sm text-cyber-text-muted mb-4">Quickly add pre-configured services to your stack.</p>
                <div className="grid grid-cols-2 gap-3">
                    {templates.map(name => (
                        <button
                            key={name}
                            onClick={() => onSelect(name)}
                            className="p-4 glass-light rounded-xl text-left hover:bg-cyber-surface-light transition-all group"
                        >
                            <div className="text-2xl mb-2">{templateIcons[name] || '📦'}</div>
                            <div className="font-semibold capitalize group-hover:text-cyber-accent transition-colors">{name}</div>
                            <div className="text-xs text-cyber-text-muted mt-1">
                                {serviceTemplates[name]?.config?.image || 'Custom build'}
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TemplateModal;
