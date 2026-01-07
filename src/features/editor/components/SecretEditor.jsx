import { Key, Lock } from 'lucide-react';
import { Input, Section, Badge } from '../../../components/ui';

/**
 * Secret configuration editor
 */
export const SecretEditor = ({ name, secret, onUpdate }) => {
    const update = (field, value) => onUpdate({ ...secret, [field]: value });

    return (
        <div className="space-y-4 animate-slide-in">
            <div className="flex items-center justify-between pb-3 border-b border-cyber-border/50">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Key className="text-cyber-purple" />{name}
                </h2>
                <Badge type="success">Secret</Badge>
            </div>

            <Section title="Configuration" icon={Lock}>
                <Input label="File Path" value={secret.file} onChange={v => update('file', v)} placeholder="./secrets/my-secret.txt" />
                <Input label="External Name" value={secret.name} onChange={v => update('name', v)} placeholder="external-secret-name" />
                <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={secret.external || false} onChange={e => update('external', e.target.checked)} className="rounded" />
                    External Secret
                </label>
            </Section>
        </div>
    );
};

export default SecretEditor;
