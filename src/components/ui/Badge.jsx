/**
 * Badge component for status indicators
 * @param {'error' | 'warning' | 'success'} type - Badge type
 * @param {React.ReactNode} children - Badge content
 */
export const Badge = ({ type, children }) => (
    <span
        className={`px-2 py-0.5 text-xs rounded-full ${type === 'error'
                ? 'bg-cyber-error/20 text-cyber-error'
                : type === 'warning'
                    ? 'bg-cyber-warning/20 text-cyber-warning'
                    : 'bg-cyber-success/20 text-cyber-success'
            }`}
    >
        {children}
    </span>
);

export default Badge;
