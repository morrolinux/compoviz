import { useState, useRef, useEffect } from 'react';
import { Code, Download, Upload, CheckCircle, X, Eye, Copy, Folder } from 'lucide-react';
import { IconButton } from '../../components/ui';
import { useCompose } from '../../hooks/useCompose.jsx';

/**
 * YAML code preview with syntax highlighting and edit mode
 */
export const CodePreview = () => {
    // Get compose state from context
    const { yamlCode, handleExport, loadFiles, embedMode } = useCompose();

    // Start in edit mode automatically when embedded in `editor` mode
    const [editMode, setEditMode] = useState(!!(embedMode === 'editor'));
    const [editValue, setEditValue] = useState('');
    const [copied, setCopied] = useState(false);
    const fileInputRef = useRef(null);
    const folderInputRef = useRef(null);
    const autosaveTimeoutRef = useRef(null);
    const lastSavedRef = useRef(yamlCode);
    const isDirtyRef = useRef(false);

    const splitComment = (line) => {
        const hashIndex = line.indexOf('#');
        if (hashIndex === -1) return { code: line, comment: '' };
        return {
            code: line.slice(0, hashIndex),
            comment: line.slice(hashIndex),
        };
    };

    const highlightValue = (text) => {
        const patterns = [
            { regex: /^(\s*)(['"].*['"])/, className: 'yaml-string' },
            { regex: /^(\s*)(\d+)/, className: 'yaml-number' },
            { regex: /^(\s*)(true|false)/i, className: 'yaml-boolean' },
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern.regex);
            if (match) {
                const leading = match[1] || '';
                const value = match[2] || '';
                const rest = text.slice(match[0].length);
                return [
                    leading,
                    <span key="value" className={pattern.className}>{value}</span>,
                    rest,
                ];
            }
        }

        return [text];
    };

    const highlightLine = (line, index, totalLines) => {
        const { code, comment } = splitComment(line);
        const keyMatch = code.match(/^(\s*)([a-zA-Z_][a-zA-Z0-9_-]*)(:)(.*)$/);

        const lineParts = [
            <span key="line-number" className="text-cyber-text-muted select-none mr-4">
                {String(index + 1).padStart(3)}
            </span>,
        ];

        if (keyMatch) {
            const indent = keyMatch[1] || '';
            const key = keyMatch[2] || '';
            const rest = keyMatch[4] || '';
            lineParts.push(indent);
            lineParts.push(<span key="key" className="yaml-key">{key}</span>);
            lineParts.push(':');
            lineParts.push(...highlightValue(rest));
        } else {
            lineParts.push(...highlightValue(code));
        }

        if (comment) {
            lineParts.push(<span key="comment" className="yaml-comment">{comment}</span>);
        }

        if (index < totalLines - 1) {
            lineParts.push('\n');
        }

        return <span key={index}>{lineParts}</span>;
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(yamlCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleEdit = () => {
        setEditValue(yamlCode);
        isDirtyRef.current = false;
        setEditMode(true);
    };

    const handleSave = async () => {
        try {
            const result = await loadFiles(editValue);
            if (result.success) {
                // If we're embedded in editor mode, remain in edit mode; otherwise close edit mode
                if (embedMode !== 'editor') setEditMode(false);
            } else {
                alert('Invalid YAML: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Save failed:', error);
            alert('Save failed: ' + error.message);
        }
    };

    const handleFileSelect = async (e) => {
        const files = Array.from(e.target.files || []).filter((file) => (
            file.name.endsWith('.yml') || file.name.endsWith('.yaml') || file.name === '.env'
        ));
        if (files.length === 0) return;

        const primaryFile = files.find((file) => (
            file.name === 'docker-compose.yml' || file.name === 'docker-compose.yaml'
        )) || files[0];

        const orderedFiles = [primaryFile, ...files.filter((file) => file !== primaryFile)];

        try {
            const content = await primaryFile.text();
            const result = await loadFiles(content, orderedFiles);
            if (!result.success) {
                alert('Invalid YAML: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Import failed:', error);
            alert('Import failed: ' + error.message);
        }
    };

    // Keep editValue in sync when entering edit mode or when yamlCode changes
    // Sync editValue when entering edit mode, but do not overwrite user's in-progress edits
    useEffect(() => {
        if (editMode && !isDirtyRef.current) {
            setEditValue(yamlCode);
            lastSavedRef.current = yamlCode;
            isDirtyRef.current = false;
        }
    }, [editMode, yamlCode]);

    // Force edit mode when embedded in editor mode
    useEffect(() => {
        if (embedMode === 'editor') {
            setEditMode(true);
            if (!isDirtyRef.current) {
                setEditValue(yamlCode);
                lastSavedRef.current = yamlCode;
                isDirtyRef.current = false;
            }
        }
    }, [embedMode]);

    // Autosave: save 5s after last change
    useEffect(() => {
        // don't autosave when not editing
        if (!editMode) return;

        if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);
        autosaveTimeoutRef.current = setTimeout(async () => {
            try {
                // Only save if content changed since last save
                if (lastSavedRef.current === editValue) return;
                const result = await loadFiles(editValue);
                if (result && result.success) {
                    lastSavedRef.current = editValue;
                    // Only clear dirty if the composed YAML matches the editor content
                    isDirtyRef.current = !(yamlCode !== undefined && yamlCode !== null) ? false : (yamlCode !== editValue);
                    // If the generated YAML equals editValue, mark not dirty
                    if (yamlCode === editValue) isDirtyRef.current = false;
                }
            } catch (err) {
                console.error('Autosave failed:', err);
            }
        }, 1000);

        return () => {
            if (autosaveTimeoutRef.current) {
                clearTimeout(autosaveTimeoutRef.current);
                autosaveTimeoutRef.current = null;
            }
        };
    }, [editMode, editValue, loadFiles, yamlCode]);

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
                                <CheckCircle size={14} className="mr-1" />Aggiorna il grafo
                            </button>
                            <button onClick={() => setEditMode(false)} className="btn btn-secondary text-xs py-1">
                                <X size={14} className="mr-1" />Cancel
                            </button>
                        </>
                    ) : (
                        <>
                            <IconButton icon={copied ? CheckCircle : Copy} onClick={handleCopy} title="Copy" />
                            <IconButton icon={Eye} onClick={handleEdit} title="Edit" />
                            <IconButton icon={Download} onClick={handleExport} title="Export" />
                            <IconButton icon={Upload} onClick={() => fileInputRef.current?.click()} title="Import Files" />
                            <IconButton icon={Folder} onClick={() => folderInputRef.current?.click()} title="Import Folder" />
                            <input ref={fileInputRef} type="file" accept=".yml,.yaml,.env" multiple className="hidden" onChange={handleFileSelect} />
                            <input ref={folderInputRef} type="file" accept=".yml,.yaml,.env" webkitdirectory="true" className="hidden" onChange={handleFileSelect} />
                        </>
                    )}
                </div>
            </div>
            <div className="flex-1 overflow-auto p-4">
                {editMode ? (
                        <textarea
                            value={editValue}
                            onChange={e => { setEditValue(e.target.value); isDirtyRef.current = true; }}
                            className="w-full h-full code-preview bg-transparent resize-none focus:outline-none"
                            spellCheck={false}
                        />
                ) : (
                    <pre className="code-preview">
                        {yamlCode.split('\n').map((line, i, arr) => highlightLine(line, i, arr.length))}
                    </pre>
                )}
            </div>
        </div>
    );
};

export default CodePreview;
