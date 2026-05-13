import React from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type Edge,
  type EdgeProps,
} from '@xyflow/react';
import { useDebtGraphContext } from './DebtGraphContext';

export interface DebtEdgeData {
  [key: string]: unknown;
  label: string;
  strokeWidth: number;
}

export type DebtEdgeType = Edge<DebtEdgeData, 'debt'>;

const DebtEdge: React.FC<EdgeProps<DebtEdgeType>> = ({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  data,
}) => {
  const { hoveredNodeId } = useDebtGraphContext();
  const relatedToHoveredNode = !hoveredNodeId || hoveredNodeId === source || hoveredNodeId === target;
  const baseWidth = data?.strokeWidth ?? 3;
  const strokeWidth = relatedToHoveredNode && hoveredNodeId ? baseWidth * 1.25 : baseWidth;
  const opacity = relatedToHoveredNode ? 0.9 : 0.18;
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: '#9EF2DC',
          strokeWidth,
          opacity,
          transition: 'opacity 160ms ease, stroke-width 160ms ease',
        }}
      />
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan app-data-pill border-primary-fixed/25 bg-surface/92 text-primary-fixed shadow-[0_8px_24px_rgba(2,6,23,0.28)] backdrop-blur"
          style={{
            opacity,
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
          }}
        >
          {data?.label}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default DebtEdge;
