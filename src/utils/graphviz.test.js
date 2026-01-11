import { describe, it, expect } from 'vitest';
import { generateGraphviz } from './graphviz';

describe('graphviz utils', () => {
    describe('generateGraphviz', () => {
        it('returns empty diagram when no services present', () => {
            const dot = generateGraphviz({});
            expect(dot).toContain('No services');
        });

        it('generates a node for each service', () => {
            const state = {
                services: {
                    frontend: { image: 'nginx' },
                    backend: { image: 'node' }
                }
            };
            const dot = generateGraphviz(state);
            expect(dot).toContain('frontend');
            expect(dot).toContain('backend');
        });

        it('generates ports in the entry zone', () => {
            const state = {
                services: {
                    web: { image: 'nginx', ports: ['80:80'] }
                }
            };
            const dot = generateGraphviz(state);
            expect(dot).toContain('label="80"');
            expect(dot).toContain('shape=circle');
            expect(dot).toContain('port_web_0');
        });

        it('groups services by network in clusters', () => {
            const state = {
                services: {
                    db: { image: 'postgres', networks: ['db_net'] }
                },
                networks: {
                    db_net: {}
                }
            };
            const dot = generateGraphviz(state);
            expect(dot).toContain('subgraph cluster_net_db_net');
            expect(dot).toContain('label="🌐 db_net"');
        });

        it('represents depends_on as edges', () => {
            const state = {
                services: {
                    web: { image: 'nginx', depends_on: ['api'] },
                    api: { image: 'node' }
                }
            };
            const dot = generateGraphviz(state);
            expect(dot).toMatch(/web\s*->\s*api/);
        });

        it('renders volumes in the storage zone', () => {
            const state = {
                services: {
                    db: { image: 'postgres', volumes: ['pg_data:/var/lib/postgresql/data'] }
                },
                volumes: {
                    pg_data: {}
                }
            };
            const dot = generateGraphviz(state);
            expect(dot).toContain('vol_pg_data');
            expect(dot).toContain('label="💾 pg_data"');
            expect(dot).toMatch(/db\s*->\s*vol_pg_data/);
        });
    });
});
