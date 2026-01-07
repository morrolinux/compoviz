import { useState, useEffect, useRef, memo } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, AlertCircle } from 'lucide-react';
import mermaid from 'mermaid';
import { IconButton } from '../../components/ui';
import ContextMenu from './ContextMenu';

// Initialize Mermaid with enhanced styling
mermaid.initialize({
    startOnLoad: false,
    theme: 'base',
    securityLevel: 'loose',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: 16,
    themeVariables: {
        primaryColor: '#1e3a8a',
        primaryTextColor: '#ffffff',
        primaryBorderColor: '#3b82f6',
        secondaryColor: '#064e3b',
        tertiaryColor: '#1e293b',
        lineColor: '#64748b',
        textColor: '#ffffff',
        mainBkg: '#0f172a',
        nodeBorder: '#3b82f6',
        clusterBkg: '#1e293b',
        clusterBorder: '#475569',
        titleColor: '#f1f5f9',
        edgeLabelBackground: '#0f172a',
        tertiaryTextColor: '#ffffff',
    },
    flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis',
        rankSpacing: 100,
        nodeSpacing: 80,
        padding: 25,
        diagramPadding: 30,
    },
});

/**
 * Mermaid diagram with pan/zoom and right-click context menu
 */
export const MermaidDiagram = memo(({ graph, onNodeClick, onAdd }) => {
    const containerRef = useRef(null);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [dragging, setDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [error, setError] = useState(null);
    const [contextMenu, setContextMenu] = useState(null);

    useEffect(() => {
        const render = async () => {
            if (!containerRef.current) return;
            try {
                setError(null);
                const id = `mermaid-${Date.now()}`;
                const { svg } = await mermaid.render(id, graph);
                containerRef.current.innerHTML = svg;
                containerRef.current.querySelectorAll('.node').forEach(node => {
                    node.style.cursor = 'pointer';
                    node.addEventListener('click', () => {
                        const id = node.id.replace('flowchart-', '').split('-')[0];
                        if (!id.startsWith('net_') && !id.startsWith('vol_')) onNodeClick?.({ type: 'services', name: id });
                    });
                });
            } catch (e) { setError(e.message); }
        };
        render();
    }, [graph, onNodeClick]);

    const handleMouseDown = (e) => {
        if (e.button === 0) { // Left click only
            setDragging(true);
            setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
        }
    };
    const handleMouseMove = (e) => { if (dragging) setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }); };
    const handleMouseUp = () => setDragging(false);
    const resetView = () => { setScale(1); setPosition({ x: 0, y: 0 }); };

    const handleContextMenu = (e) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY });
    };

    if (error) return (
        <div className="flex items-center justify-center h-full text-cyber-error">
            <AlertCircle className="mr-2" />Diagram Error: {error}
        </div>
    );

    return (
        <div className="relative h-full">
            {/* Controls */}
            <div className="absolute top-2 right-2 z-10 flex gap-1 glass rounded-lg p-1">
                <IconButton icon={ZoomIn} onClick={() => setScale(s => Math.min(s + 0.2, 3))} title="Zoom In" />
                <IconButton icon={ZoomOut} onClick={() => setScale(s => Math.max(s - 0.2, 0.3))} title="Zoom Out" />
                <IconButton icon={RotateCcw} onClick={resetView} title="Reset View" />
            </div>

            {/* Hint for right-click */}
            <div className="absolute top-2 left-2 z-10 text-xs text-cyber-text-muted glass rounded-lg px-3 py-1.5">
                💡 Right-click to add resources
            </div>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 z-10 glass rounded-xl p-4 space-y-2">
                <div className="text-xs font-semibold text-cyber-text-muted uppercase tracking-wide mb-2">Legend</div>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-0.5 bg-pink-400" style={{ boxShadow: '0 0 6px #f472b6' }}></div>
                    <span className="text-sm text-cyber-text">Depends On</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-0.5 bg-cyan-400 border-dashed" style={{ borderTop: '2px dashed #22d3ee', height: 0 }}></div>
                    <span className="text-sm text-cyber-text">Network</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-0.5" style={{ borderTop: '2px dotted #fbbf24' }}></div>
                    <span className="text-sm text-cyber-text">Volume Mount</span>
                </div>
            </div>

            {/* Diagram */}
            <div
                className="mermaid-container"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onContextMenu={handleContextMenu}
            >
                <div
                    ref={containerRef}
                    style={{
                        transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                        transformOrigin: 'center center',
                        transition: dragging ? 'none' : 'transform 0.2s'
                    }}
                    className="w-full h-full flex items-center justify-center"
                />
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={() => setContextMenu(null)}
                    onAdd={onAdd}
                />
            )}
        </div>
    );
});

MermaidDiagram.displayName = 'MermaidDiagram';

export default MermaidDiagram;
