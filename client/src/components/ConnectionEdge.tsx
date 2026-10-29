import { memo, type ReactNode } from 'react';
import {
  EdgeProps,
  getBezierPath,
  BaseEdge,
  EdgeLabelRenderer,
  MarkerType,
} from '@xyflow/react';
import { TooltipWrapper, DataList } from './TooltipWrapper';
import { useNetworkStore } from '@/lib/store';
import waterPumpIcon from '@assets/water-pump_1779523451215.png';
import pipeIcon from '@assets/pipe_1779523475650.png';

const EDGE_COLOR = '#000000';
const CIRCLE_SIZE = 72;
const BLACK_MARKER = { type: MarkerType.ArrowClosed, color: EDGE_COLOR };

function ElementCircle({ icon, alt, label }: { icon: string; alt: string; label: string }) {
  return (
    <div style={{
      width: CIRCLE_SIZE,
      height: CIRCLE_SIZE,
      borderRadius: '50%',
      border: `3px solid ${EDGE_COLOR}`,
      background: 'white',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
    }}>
      <img src={icon} style={{ width: 34, height: 34, objectFit: 'contain', pointerEvents: 'none' }} alt={alt} />
      <span style={{ fontSize: 11, fontWeight: 700, color: '#000', lineHeight: 1, whiteSpace: 'nowrap', userSelect: 'none' }}>
        {label}
      </span>
    </div>
  );
}

export const ConnectionEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  const edge = useNetworkStore(state => state.edges.find(e => e.id === id));
  const displayData = edge ? edge.data : data;

  const edgeType = displayData?.type as string;
  const isPump = edgeType === 'pump';
  const isCheckValve = edgeType === 'checkValve';
  const isElementEdge = isPump || isCheckValve;
  const isDummy = edgeType === 'dummy';

  const tooltipTitle = isPump || isCheckValve ? 'Legacy element'
    : isDummy ? 'Dummy Pipe Properties'
    : 'Conduit Properties';

  const edgeLabel = (displayData?.label as string) || id;

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth: 2,
          stroke: EDGE_COLOR,
          strokeDasharray: isDummy ? '8 8' : undefined,
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <TooltipWrapper content={<DataList data={displayData} title={tooltipTitle} />}>
            {isElementEdge ? (
              <div style={{ cursor: 'default' }}>
                {isPump && <ElementCircle icon={waterPumpIcon} alt="Legacy element" label={edgeLabel} />}
                {isCheckValve && <ElementCircle icon={pipeIcon} alt="Legacy element" label={edgeLabel} />}
              </div>
            ) : (
              <div className="bg-white px-2 py-0.5 rounded-full border border-black text-[11px] font-semibold text-black cursor-default hover:bg-slate-50 transition-colors">
                {(displayData?.label as ReactNode) || id}
              </div>
            )}
          </TooltipWrapper>
        </div>
      </EdgeLabelRenderer>
    </>
  );
});
