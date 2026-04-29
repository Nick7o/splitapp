import React from 'react';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { useTranslation } from 'react-i18next';
import { AVATAR_BY_KEY } from '../../data/avatars';
import { formatMoney } from '../../data/currencies';
import { useDebtGraphContext } from './DebtGraphContext';

export interface MemberConnection {
  id: string;
  label: string;
  amount: number;
}

export interface MemberNodeData {
  [key: string]: unknown;
  name: string;
  avatarKey?: string | null;
  isCurrentUser: boolean;
  balance: number;
  currency: string;
  connections: MemberConnection[];
}

export type MemberNodeType = Node<MemberNodeData, 'member'>;

const MemberNode: React.FC<NodeProps<MemberNodeType>> = ({ id, data }) => {
  const { t } = useTranslation();
  const {
    hoveredNodeId,
    setHoveredNodeId,
    selectedNodeId,
    setSelectedNodeId,
  } = useDebtGraphContext();
  const avatar = data.avatarKey ? AVATAR_BY_KEY[data.avatarKey] : null;
  const selected = selectedNodeId === id;
  const hovered = hoveredNodeId === id;

  return (
    <div
      className="relative"
      data-hovered={hovered ? 'true' : 'false'}
      onMouseEnter={() => setHoveredNodeId(id)}
      onMouseLeave={() => setHoveredNodeId(null)}
    >
      <Handle type="target" position={Position.Left} className="!h-2 !w-2 !border-0 !bg-secondary/80" />
      <button
        type="button"
        onClick={() => setSelectedNodeId(selected ? null : id)}
        className={`nodrag flex w-[180px] items-center gap-3 rounded-2xl border px-3 py-2 text-left shadow-[0_10px_28px_rgba(2,6,23,0.24)] transition-all focus:outline-none focus:ring-2 focus:ring-primary-fixed/70 ${
          data.isCurrentUser
            ? 'border-primary-fixed/35 bg-primary/16 text-on-surface ring-2 ring-primary-fixed/30'
            : 'border-outline-variant/25 bg-surface-container text-on-surface hover:border-primary-fixed/55'
        }`}
      >
        <span className={`app-avatar flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl font-bold ${avatar?.bg ?? 'bg-surface-container-high text-on-surface'}`}>
          {avatar ? <span aria-hidden="true">{avatar.emoji}</span> : data.name.charAt(0).toUpperCase()}
        </span>
        <span className="min-w-0">
          <span className="block truncate font-headline text-base font-bold">{data.name}</span>
          <span className={data.balance >= 0 ? 'block text-xs font-semibold text-primary-fixed' : 'block text-xs font-semibold text-error'}>
            {formatMoney(data.balance, data.currency)}
          </span>
        </span>
      </button>
      <Handle type="source" position={Position.Right} className="!h-2 !w-2 !border-0 !bg-secondary/80" />

      {selected ? (
        <div className="nodrag absolute left-1/2 top-full z-30 mt-3 w-64 -translate-x-1/2 rounded-2xl border border-white/10 bg-surface p-4 text-left shadow-[0_18px_42px_rgba(2,6,23,0.36)]">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">{t('debtGraph.netBalance')}</p>
          <p className={`mt-1 font-headline text-xl font-bold ${data.balance >= 0 ? 'text-primary-fixed' : 'text-error'}`}>
            {formatMoney(data.balance, data.currency)}
          </p>
          <div className="mt-3 space-y-2">
            {data.connections.length === 0 ? (
              <p className="text-sm text-on-surface-variant">{t('debtGraph.noOpenTransfers')}</p>
            ) : (
              data.connections.map((connection) => (
                <div key={connection.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate text-on-surface-variant">{connection.label}</span>
                  <span className="shrink-0 font-semibold text-on-surface">{formatMoney(connection.amount, data.currency)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default MemberNode;
