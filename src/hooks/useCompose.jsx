/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useCallback, useMemo, useState, useRef } from 'react';
import { generateYaml, parseYaml } from '../utils/yaml';
import { parseEnvFile, mergeEnv } from '../utils/variableInterpolator.js';
import { validateState } from '../utils/validation';
import { generateSuggestions } from '../utils/suggestions';
import { useHistoryReducer } from './useHistory';
import { composeReducer, initialState } from './composeReducer';

// Context
const ComposeContext = createContext(null);

/**
 * ComposeProvider - Manages Docker Compose data state
 * Enhanced with profile and environment variable support
 */
export function ComposeProvider({ children }) {
    // Use history-enabled reducer for undo/redo
    const { state, dispatch, undo, redo, canUndo, canRedo } = useHistoryReducer(composeReducer, initialState);

    // Embed-related params and token (for postMessage validation)
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
    const embedToken = urlParams.get('embed_token') || null;
    const embedMode = urlParams.get('mode') || null; // e.g. 'editor' | 'graph' | 'full'

    // Parser metadata state
    const [profiles, setProfiles] = useState([]);
    const [activeProfiles, setActiveProfiles] = useState([]);
    const [environment, setEnvironment] = useState({});
    const [variables, setVariables] = useState([]);
    const [undefinedVariables, setUndefinedVariables] = useState([]);
    const [parserErrors, setParserErrors] = useState([]);
    const [profileCounts, setProfileCounts] = useState({});
    const [sourceYaml, setSourceYaml] = useState('');
    const lastFilesRef = useRef([]);
    const suppressBroadcastRef = useRef(false);
    const broadcastTimeoutRef = useRef(null);
    const lastBroadcastKeyRef = useRef(null);

    // Generate YAML and errors on state change
    const yamlCode = useMemo(() => generateYaml(state), [state]);
    const errors = useMemo(() => {
        const stateErrors = validateState(state);
        const parserIssues = (parserErrors || []).map((err) => ({
            type: err.type === 'warning' ? 'warning' : 'error',
            entity: 'parser',
            name: err.stage || 'compose',
            message: err.message || 'Parser error'
        }));
        return [...stateErrors, ...parserIssues];
    }, [state, parserErrors]);

    // Generate suggestions on state change
    const suggestions = useMemo(() => generateSuggestions(state), [state]);

    // Load parser metadata from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('docker-compose-state');
        const savedProfiles = localStorage.getItem('docker-compose-active-profiles');
        const savedEnv = localStorage.getItem('docker-compose-environment');

        if (saved) {
            try {
                dispatch({ type: 'SET_STATE', payload: JSON.parse(saved) });
            } catch {
                // Silence loading errors
            }
        }

        if (savedProfiles) {
            try {
                setActiveProfiles(JSON.parse(savedProfiles));
            } catch {
                // Silence errors
            }
        }

        if (savedEnv) {
            try {
                setEnvironment(JSON.parse(savedEnv));
            } catch {
                // Silence errors
            }
        }
    }, [dispatch]);

    

    // Save to localStorage on state change
    useEffect(() => {
        localStorage.setItem('docker-compose-state', JSON.stringify(state));
    }, [state]);

    // Save active profiles
    useEffect(() => {
        localStorage.setItem('docker-compose-active-profiles', JSON.stringify(activeProfiles));
    }, [activeProfiles]);

    // Save environment
    useEffect(() => {
        localStorage.setItem('docker-compose-environment', JSON.stringify(environment));
    }, [environment]);

    // Action: Load files (import YAML) - Now with Web Worker!
    const loadFiles = useCallback(async (content, files = [], overrides = {}) => {
        console.debug('[useCompose] loadFiles called', { length: content?.length, files: (files || []).length, overrides });
        try {
            if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
                window.parent.postMessage({ type: 'CV_DEBUG', payload: { event: 'loadFiles_called', length: content?.length || 0, files: (files || []).length } }, '*');
            }
        } catch (e) {}
        try {
            // Build fileMap from uploaded files
            const fileMap = {};
            const effectiveFiles = files.length > 0 ? files : (lastFilesRef.current || []);
            const envFromFiles = {};
            if (effectiveFiles && effectiveFiles.length > 0) {
                for (const file of effectiveFiles) {
                    const path = file.webkitRelativePath || file.name;
                    const text = await file.text();
                    fileMap[path] = text;
                    if (file.name === '.env' || path.endsWith('/.env')) {
                        Object.assign(envFromFiles, parseEnvFile(text));
                    }
                }
            }
            if (effectiveFiles.length > 0) {
                lastFilesRef.current = effectiveFiles;
            }

            const mergedEnvironment = mergeEnv(envFromFiles, overrides.environment || environment);
            const effectiveProfiles = overrides.activeProfiles || activeProfiles;
            if (Object.keys(envFromFiles).length > 0) {
                setEnvironment(mergedEnvironment);
            }

            // Use Web Worker for async parsing
            const { createParserWorker } = await import('../utils/workerManager.js');
            const worker = createParserWorker();

            try {
                const result = await worker.parseAsync(content, {
                    environment: mergedEnvironment,
                    activeProfiles: effectiveProfiles,
                    basePath: effectiveFiles && effectiveFiles.length > 0 && effectiveFiles[0].webkitRelativePath
                        ? effectiveFiles[0].webkitRelativePath.split('/')[0] + '/docker-compose.yml'
                        : 'docker-compose.yml',
                    fileMap,
                    enableIncludes: Object.keys(fileMap).length > 0,
                    enableExtends: true,
                    enableVariables: true,
                    enableProfiles: true,
                    addMetadata: false
                });

                // Update state with parsed compose
                if (result.compose) {
                    dispatch({ type: 'SET_STATE', payload: result.compose });
                }

                // Update parser metadata
                setProfiles(result.profiles || []);
                setProfileCounts(result.profileCounts || {});
                setVariables(result.variables || []);
                setUndefinedVariables(result.undefinedVariables || []);
                setParserErrors(result.errors || []);
                setSourceYaml(content);

                    try {
                        if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
                            window.parent.postMessage({ type: 'CV_DEBUG', payload: { event: 'loadFiles_result', success: true, profiles: (result.profiles || []).length } }, '*');
                        }
                    } catch (e) {}

                return {
                    success: true,
                    profiles: result.profiles,
                    undefinedVariables: result.undefinedVariables
                };
            } finally {
                worker.terminate();
            }
        } catch (e) {
            console.error('Parser error:', e);

            // Fallback to old parser on error
            try {
                const parsed = parseYaml(content);
                dispatch({ type: 'SET_STATE', payload: parsed });
                setSourceYaml(content);
                setProfiles([]);
                setProfileCounts({});
                setVariables([]);
                setUndefinedVariables([]);
                setParserErrors([]);
                try {
                    if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
                        window.parent.postMessage({ type: 'CV_DEBUG', payload: { event: 'loadFiles_result', success: true, fallback: true } }, '*');
                    }
                } catch (e) {}
                return { success: true, fallback: true };
            } catch {
                try {
                    if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
                        window.parent.postMessage({ type: 'CV_DEBUG', payload: { event: 'loadFiles_result', success: false, error: (e && e.message) || 'unknown' } }, '*');
                    }
                } catch (e2) {}
                return { success: false, error: e.message };
            }
        }
    }, [dispatch, environment, activeProfiles]);

    // Action: Reset project to initial state
    const resetProject = useCallback(() => {
        if (confirm('Are you sure you want to clear all configuration? This cannot be undone.')) {
            dispatch({ type: 'SET_STATE', payload: initialState });
            setActiveProfiles([]);
            setEnvironment({});
            setProfiles([]);
            setVariables([]);
            setUndefinedVariables([]);
            setParserErrors([]);
            return true;
        }
        return false;
    }, [dispatch]);

    // Action: Export YAML file
    const handleExport = useCallback(() => {
        const blob = new Blob([yamlCode], { type: 'text/yaml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'docker-compose.yml';
        a.click();
        URL.revokeObjectURL(url);
    }, [yamlCode]);

    // Action: Update YAML code (from editor)
    const handleYamlChange = useCallback(async (newYaml) => {
        // Try new parser first, fallback to old
        try {
            await loadFiles(newYaml);
        } catch {
            // Fallback to simple parsing
            const parsed = parseYaml(newYaml);
            dispatch({ type: 'SET_STATE', payload: parsed });
        }
    }, [dispatch, loadFiles]);

    // Action: Set active profiles (with re-parse)
    const setActiveProfilesAction = useCallback(async (newProfiles) => {
        setActiveProfiles(newProfiles);

        // Re-parse with new profiles if we have YAML
        const yamlForParse = sourceYaml || yamlCode;
        if (yamlForParse) {
            try {
                await loadFiles(yamlForParse, lastFilesRef.current || [], {
                    activeProfiles: newProfiles
                });
            } catch (e) {
                console.error('Failed to re-parse with new profiles:', e);
            }
        }
    }, [yamlCode, sourceYaml, loadFiles]);

    // Listen for embed messages (postMessage) to import YAML or set state
    useEffect(() => {
        function handleMessage(event) {
            try {
                const data = event.data || {};
                console.debug('[useCompose] postMessage received', data && data.type);

                // If embedToken is configured, require it to match
                if (embedToken && data.token && data.token !== embedToken) return;

                switch (data.type) {
                    case 'CV_LOAD_YAML':
                        if (data.payload && data.payload.yaml) {
                            console.debug('[useCompose] CV_LOAD_YAML payload received');
                            loadFiles(data.payload.yaml);
                        }
                        break;
                    case 'CV_STATE_UPDATE':
                        if (data.payload && data.payload.state) {
                            try {
                                suppressBroadcastRef.current = true;
                                dispatch({ type: 'SET_STATE', payload: data.payload.state });
                                if (data.payload.yaml) setSourceYaml(data.payload.yaml);
                                if (data.payload.errors) setParserErrors(data.payload.errors || []);
                            } finally {
                                // Allow broadcast on next tick after state applied
                                setTimeout(() => { suppressBroadcastRef.current = false; }, 0);
                            }
                        }
                        break;
                    case 'CV_SET_STATE':
                        if (data.payload && data.payload.state) {
                            dispatch({ type: 'SET_STATE', payload: data.payload.state });
                        }
                        break;
                    case 'CV_EXPORT_YAML':
                        handleExport();
                        break;
                    default:
                        break;
                }
            } catch (e) {
                // ignore malformed messages
            }
        }

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loadFiles, dispatch, handleExport]);

    // Action: Update environment variable (with re-parse)
    const updateEnvironment = useCallback(async (key, value) => {
        const updated = { ...environment };
        if (value === null || value === undefined || value === '') {
            delete updated[key];
        } else {
            updated[key] = value;
        }
        setEnvironment(updated);

        // Re-parse with new environment if we have YAML
        const yamlForParse = sourceYaml || yamlCode;
        if (yamlForParse) {
            try {
                const { createParserWorker } = await import('../utils/workerManager.js');
                const worker = createParserWorker();

                try {
                    const fileMap = {};
                    const files = lastFilesRef.current || [];
                    for (const file of files) {
                        const path = file.webkitRelativePath || file.name;
                        fileMap[path] = await file.text();
                    }
                    const result = await worker.parseAsync(yamlForParse, {
                        environment: updated,
                        activeProfiles,
                        fileMap,
                        enableIncludes: Object.keys(fileMap).length > 0,
                        enableExtends: true,
                        enableVariables: true,
                        enableProfiles: true
                    });

                    if (result.compose) {
                        dispatch({ type: 'SET_STATE', payload: result.compose });
                    }
                    setUndefinedVariables(result.undefinedVariables || []);
                    setProfiles(result.profiles || []);
                    setProfileCounts(result.profileCounts || {});
                    setParserErrors(result.errors || []);
                } finally {
                    worker.terminate();
                }
            } catch (e) {
                console.error('Failed to re-parse with new environment:', e);
            }
        }
    }, [environment, yamlCode, sourceYaml, activeProfiles, dispatch]);

    // Action: Bulk set environment (with re-parse)
    const setEnvironmentAction = useCallback(async (newEnv) => {
        setEnvironment(newEnv);

        // Re-parse with new environment if we have YAML
        const yamlForParse = sourceYaml || yamlCode;
        if (yamlForParse) {
            try {
                await loadFiles(yamlForParse, lastFilesRef.current || [], {
                    environment: newEnv
                });
            } catch (e) {
                console.error('Failed to re-parse with new environment:', e);
            }
        }
    }, [yamlCode, sourceYaml, loadFiles]);

    // Broadcast state changes to parent (if embedded)
    // Debounced + dedup to avoid flooding parent with rapid updates (prevents flicker)
    useEffect(() => {
        // Build a lightweight key to detect identical payloads
        const key = `${yamlCode || ''}::${JSON.stringify(errors || [])}`;

        try {
            if (suppressBroadcastRef.current) return;

            // If identical to last broadcast, skip
            if (lastBroadcastKeyRef.current === key) return;

            // Debounce posting to parent (250ms)
            if (broadcastTimeoutRef.current) clearTimeout(broadcastTimeoutRef.current);
            broadcastTimeoutRef.current = setTimeout(() => {
                try {
                    const msg = {
                        type: 'CV_STATE_UPDATE',
                        payload: {
                            state,
                            yaml: yamlCode,
                            errors
                        },
                        token: embedToken
                    };
                    if (window && window.parent && window.parent !== window) {
                        window.parent.postMessage(msg, '*');
                    }
                    lastBroadcastKeyRef.current = key;
                } catch (e) {
                    // ignore
                } finally {
                    broadcastTimeoutRef.current = null;
                }
            }, 250);
        } catch (e) {
            // ignore
        }

        return () => {
            if (broadcastTimeoutRef.current) {
                clearTimeout(broadcastTimeoutRef.current);
                broadcastTimeoutRef.current = null;
            }
        };
    }, [state, yamlCode, errors, embedToken]);

    const value = {
        // State
        state,
        yamlCode,
        errors,
        suggestions,

        // Parser metadata
        profiles,
        activeProfiles,
        profileCounts,
        environment,
        variables,
        undefinedVariables,
        parserErrors,

        // Dispatch
        dispatch,

        // History
        undo,
        redo,
        canUndo,
        canRedo,

        // Actions
        loadFiles,
        resetProject,
        handleExport,
        handleYamlChange,
        setActiveProfiles: setActiveProfilesAction,
        updateEnvironment,
        setEnvironment: setEnvironmentAction,
        // Embed info
        embedMode,
        embedToken,
    };

    return (
        <ComposeContext.Provider value={value}>
            {children}
        </ComposeContext.Provider>
    );
}

/**
 * Hook to access the compose context.
 * Must be used within ComposeProvider.
 */
export const useCompose = () => {
    const context = useContext(ComposeContext);
    if (!context) {
        throw new Error('useCompose must be used within ComposeProvider');
    }
    return context;
};
