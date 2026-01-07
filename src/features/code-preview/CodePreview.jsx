import { useState, useRef } from 'react';
import { Code, Download, Upload, CheckCircle, X, Eye, Copy } from 'lucide-react';
import { IconButton } from '../../components/ui';

/**
 * YAML code preview with syntax highlighting and edit mode
 */
export const CodePreview = ({ yaml: yamlCode, onYamlChange, onExport, onImport }) => {
    const [editMode, setEditMode] = useState(false);
    const [editValue, setEditValue] = useState('');
    const [copied, setCopied] = useState(false);
    const fileInputRef = useRef(null);

    const highlight = (code) => {
        return code.split('\n').map((line, i) => {
            let html = line.replace(/^(\s*)([a-zA-Z_][a-zA-Z0-9_-]*):/g, '$1<span class="yaml-key">$2</span>:')
                .replace(/:\s*(['"].*['"])/g, ': <span class="yaml-string">$1</span>')
                .replace(/:\s*(\d+)/g, ': <span class="yaml-number">$1</span>')
                .replace(/:\s*(true|false)/gi, ': <span class="yaml-boolean">$1</span>')
                .replace(/#.*/g, '<span class="yaml-comment">$&</span>');
            return `<span class="text-cyber-text-muted select-none mr-4">${String(i + 1).padStart(3)}</span>${html}`;
        }).join('\n');
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(yamlCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleEdit = () => {
        setEditValue(yamlCode);
        setEditMode(true);
    };

    const handleSave = () => {
        try {
            onYamlChange(editValue);
            setEditMode(false);
        } catch (e) {
            alert('Invalid YAML: ' + e.message);
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => onImport(e.target?.result);
            reader.readAsText(file);
        }
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between p-3 border-b border-cyber-border/50">
                <span className="text-sm font-medium flex items-center gap-2">
                    <Code size={16} className="text-cyber-accent" />docker-compose.yml
                </span>
                <div className="flex gap-1">
                    {editMode ? (
                        <>
                            <button onClick={handleSave} className="btn btn-primary text-xs py-1">
                                <CheckCircle size={14} className="mr-1" />Save
                            </button>
                            <button onClick={() => setEditMode(false)} className="btn btn-secondary text-xs py-1">
                                <X size={14} className="mr-1" />Cancel
                            </button>
                        </>
                    ) : (
                        <>
                            <IconButton icon={copied ? CheckCircle : Copy} onClick={handleCopy} title="Copy" />
                            <IconButton icon={Eye} onClick={handleEdit} title="Edit" />
                            <IconButton icon={Download} onClick={onExport} title="Export" />
                            <IconButton icon={Upload} onClick={() => fileInputRef.current?.click()} title="Import" />
                            <input ref={fileInputRef} type="file" accept=".yml,.yaml" className="hidden" onChange={handleFileSelect} />
                        </>
                    )}
                </div>
            </div>
            <div className="flex-1 overflow-auto p-4">
                {editMode ? (
                    <textarea
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        className="w-full h-full code-preview bg-transparent resize-none focus:outline-none"
                        spellCheck={false}
                    />
                ) : (
                    <pre className="code-preview" dangerouslySetInnerHTML={{ __html: highlight(yamlCode) }} />
                )}
            </div>
        </div>
    );
};

export default CodePreview;
