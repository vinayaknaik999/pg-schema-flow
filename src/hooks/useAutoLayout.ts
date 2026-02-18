import { useCallback } from 'react';
import dagre from 'dagre';
import { Node, Edge, useReactFlow } from '@xyflow/react';
import { useSchemaStore } from '@/lib/store';

const NODE_WIDTH = 240; // Approx width of table node
const NODE_HEIGHT = 200; // Approx height, will vary but this is for layout grid

export function useAutoLayout() {
    const { getNodes, getEdges, setNodes } = useReactFlow();
    const updateNodePosition = useSchemaStore((state) => state.updateNodePosition);

    const onLayout = useCallback((direction: 'TB' | 'LR' = 'LR') => {
        const nodes = getNodes();
        const edges = getEdges();

        const dagreGraph = new dagre.graphlib.Graph();
        dagreGraph.setDefaultEdgeLabel(() => ({}));

        dagreGraph.setGraph({ rankdir: direction });

        nodes.forEach((node) => {
            // We can try to get actual dimensions if they exist in measured, otherwise fallback
            const width = node.measured?.width ?? NODE_WIDTH;
            const height = node.measured?.height ?? NODE_HEIGHT;
            dagreGraph.setNode(node.id, { width, height });
        });

        edges.forEach((edge) => {
            dagreGraph.setEdge(edge.source, edge.target);
        });

        dagre.layout(dagreGraph);

        const layoutNodes = nodes.map((node) => {
            const nodeWithPosition = dagreGraph.node(node.id);
            const newPosition = {
                x: nodeWithPosition.x - (node.measured?.width ?? NODE_WIDTH) / 2,
                y: nodeWithPosition.y - (node.measured?.height ?? NODE_HEIGHT) / 2,
            };

            // Update store as well so it persists
            updateNodePosition(node.id, newPosition);

            return {
                ...node,
                position: newPosition,
            };
        });

        setNodes(layoutNodes);

        // Fit view after layout
        // useReactFlow().fitView({ duration: 800 }); 
        // Note: fitView cannot be called directly here easily without getting the instance again or passing it.
        // But setNodes triggers re-render, we can't easily fitView immediately in the same tick effectively sometimes.
        // Let's rely on the user to fit view or do it slightly delayed if we had access to the instance.
    }, [getNodes, getEdges, setNodes, updateNodePosition]);

    return { onLayout };
}
