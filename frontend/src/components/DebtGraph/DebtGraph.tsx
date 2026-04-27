import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type EdgeTypes,
  type NodeChange,
  type NodeTypes,
  type OnNodesChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './debt-graph.css';
import { formatMoney } from '../../data/currencies';
import { DebtGraphContext } from './DebtGraphContext';
import DebtEdge, { type DebtEdgeType } from './DebtEdge';
import MemberNode, { type MemberConnection, type MemberNodeType } from './MemberNode';
import { computeInitialLayout, type GraphPosition } from './layout';

interface Member {
  id: string;
  name: string;
  avatarKey?: string | null;
}

interface Debt {
  fromUserId: string;
  toUserId: string;
  amount: number;
}

interface DebtGraphProps {
  groupId: string;
  members: Member[];
  debts: Debt[];
  currency: string;
  currentUserId: string;
  balancesByUser: Record<string, number>;
}

const GRAPH_SIZE = { width: 920, height: 520 };
const nodeTypes: NodeTypes = { member: MemberNode };
const edgeTypes: EdgeTypes = { debt: DebtEdge };

const getLayoutKey = (groupId: string) => `splitapp:debt-graph-layout:${groupId}`;

const readStoredPositions = (groupId: string): Record<string, GraphPosition> => {
  try {
    const raw = localStorage.getItem(getLayoutKey(groupId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, GraphPosition>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const createMemberConnections = (
  member: Member,
  debts: Debt[],
  membersById: Map<string, Member>,
  t: (key: string, values?: Record<string, string>) => string
): MemberConnection[] =>
  debts
    .filter((debt) => debt.fromUserId === member.id || debt.toUserId === member.id)
    .map((debt, index) => {
      const pays = debt.fromUserId === member.id;
      const otherMember = membersById.get(pays ? debt.toUserId : debt.fromUserId);

      return {
        id: `${member.id}-${index}`,
        label: pays
          ? t('debtGraph.pays', { name: otherMember?.name ?? t('common.unknown') })
          : t('debtGraph.getsFrom', { name: otherMember?.name ?? t('common.unknown') }),
        amount: debt.amount,
      };
    });

const DebtGraph: React.FC<DebtGraphProps> = ({
  groupId,
  members,
  debts,
  currency,
  currentUserId,
  balancesByUser,
}) => {
  const { t } = useTranslation();
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [layoutVersion, setLayoutVersion] = useState(0);
  const membersById = useMemo(() => new Map(members.map((member) => [member.id, member])), [members]);

  const buildNodes = useCallback((): MemberNodeType[] => {
    const computedPositions = computeInitialLayout(members, debts, GRAPH_SIZE);
    const storedPositions = readStoredPositions(groupId);

    return members.map((member) => ({
      id: member.id,
      type: 'member',
      position: storedPositions[member.id] ?? computedPositions[member.id] ?? { x: GRAPH_SIZE.width / 2, y: GRAPH_SIZE.height / 2 },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      data: {
        name: member.name,
        avatarKey: member.avatarKey,
        isCurrentUser: member.id === currentUserId,
        balance: balancesByUser[member.id] ?? 0,
        currency,
        connections: createMemberConnections(member, debts, membersById, t),
      },
    }));
  }, [balancesByUser, currency, currentUserId, debts, groupId, members, membersById, t]);

  const buildEdges = useCallback((): DebtEdgeType[] => {
    const maxAmount = Math.max(...debts.map((debt) => debt.amount), 1);

    return debts.map((debt, index) => ({
      id: `${currency}-${debt.fromUserId}-${debt.toUserId}-${index}`,
      type: 'debt',
      source: debt.fromUserId,
      target: debt.toUserId,
      animated: true,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#F59E0B',
      },
      data: {
        label: formatMoney(debt.amount, currency),
        strokeWidth: 2.5 + (debt.amount / maxAmount) * 3.5,
      },
    }));
  }, [currency, debts]);

  const [nodes, setNodes, baseOnNodesChange] = useNodesState<MemberNodeType>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<DebtEdgeType>([]);

  useEffect(() => {
    setNodes(buildNodes());
    setEdges(buildEdges());
  }, [buildEdges, buildNodes, layoutVersion, setEdges, setNodes]);

  const onNodesChange = useCallback<OnNodesChange<MemberNodeType>>((changes: NodeChange<MemberNodeType>[]) => {
    baseOnNodesChange(changes);
  }, [baseOnNodesChange]);

  const handleNodeDragStop = useCallback((_: React.MouseEvent, node: MemberNodeType) => {
    const storedPositions = readStoredPositions(groupId);
    const nextPositions = {
      ...storedPositions,
      [node.id]: node.position,
    };
    localStorage.setItem(getLayoutKey(groupId), JSON.stringify(nextPositions));
  }, [groupId]);

  const handleResetLayout = () => {
    localStorage.removeItem(getLayoutKey(groupId));
    setSelectedNodeId(null);
    setLayoutVersion((version) => version + 1);
  };

  const contextValue = useMemo(() => ({
    hoveredNodeId,
    setHoveredNodeId,
    selectedNodeId,
    setSelectedNodeId,
  }), [hoveredNodeId, selectedNodeId]);

  return (
    <section className="app-card-strong overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-outline-variant/20 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <h3 className="font-headline text-xl font-bold text-on-surface">{t('debtGraph.title')}</h3>
          <p className="text-sm text-on-surface-variant">{t('debtGraph.currencyTransfers', { currency })}</p>
        </div>
        <button type="button" onClick={handleResetLayout} className="app-button-secondary px-4 py-2">
          <span className="material-symbols-outlined text-base">restart_alt</span>
          {t('debtGraph.resetLayout')}
        </button>
      </div>

      <DebtGraphContext.Provider value={contextValue}>
        <div className="debt-graph h-[520px] min-h-[480px] bg-surface-container-lowest">
          <ReactFlow<MemberNodeType, DebtEdgeType>
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeDragStop={handleNodeDragStop}
            fitView
            minZoom={0.35}
            maxZoom={1.6}
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={18} size={1.3} color="rgba(203, 213, 225, 0.22)" />
            <MiniMap
              nodeColor={(node) => (node.id === currentUserId ? '#F59E0B' : '#334155')}
              maskColor="rgba(11, 17, 32, 0.72)"
              pannable
              zoomable
            />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>
      </DebtGraphContext.Provider>
    </section>
  );
};

export default DebtGraph;
