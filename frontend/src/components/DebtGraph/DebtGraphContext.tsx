import React from 'react';

interface DebtGraphContextValue {
  hoveredNodeId: string | null;
  setHoveredNodeId: (nodeId: string | null) => void;
  selectedNodeId: string | null;
  setSelectedNodeId: (nodeId: string | null) => void;
}

export const DebtGraphContext = React.createContext<DebtGraphContextValue>({
  hoveredNodeId: null,
  setHoveredNodeId: () => undefined,
  selectedNodeId: null,
  setSelectedNodeId: () => undefined,
});

export const useDebtGraphContext = () => React.useContext(DebtGraphContext);
