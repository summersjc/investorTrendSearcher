import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface Node {
  id: string;
  name: string;
  type: 'investor' | 'company';
  group?: number;
}

interface Link {
  source: string;
  target: string;
  strength?: number;
}

interface NetworkGraphProps {
  nodes: Node[];
  links: Link[];
  width?: number;
  height?: number;
  onNodeClick?: (node: Node) => void;
}

export default function NetworkGraph({
  nodes,
  links,
  width = 800,
  height = 600,
  onNodeClick,
}: NetworkGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    // Clear previous graph
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height]);

    // Create arrow markers for directed edges
    svg
      .append('defs')
      .append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .append('svg:path')
      .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
      .attr('fill', '#999');

    // Create simulation
    const simulation = d3
      .forceSimulation(nodes as any)
      .force(
        'link',
        d3
          .forceLink(links)
          .id((d: any) => d.id)
          .distance(150)
          .strength((d: any) => (d.strength || 1) / 10)
      )
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40));

    // Create links
    const link = svg
      .append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', (d: any) => Math.sqrt(d.strength || 1))
      .attr('marker-end', 'url(#arrowhead)');

    // Create nodes
    const node = svg
      .append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .call(
        d3
          .drag<any, any>()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended)
      );

    // Add circles to nodes
    node
      .append('circle')
      .attr('r', 10)
      .attr('fill', (d: any) => (d.type === 'investor' ? '#3b82f6' : '#10b981'))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .on('click', (event, d) => {
        if (onNodeClick) onNodeClick(d as Node);
      })
      .style('cursor', 'pointer');

    // Add labels to nodes
    node
      .append('text')
      .text((d: any) => d.name)
      .attr('x', 15)
      .attr('y', 5)
      .attr('font-size', 12)
      .attr('fill', '#374151');

    // Add title for hover
    node.append('title').text((d: any) => `${d.name}\n${d.type}`);

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    // Drag functions
    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [nodes, links, width, height, onNodeClick]);

  return (
    <div className="network-graph bg-white rounded-lg shadow p-4">
      <svg ref={svgRef} className="w-full h-full"></svg>
    </div>
  );
}
