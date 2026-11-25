import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

const NODE_RADIUS = 22;
const COLORS = {
  nonTerminal: '#7c3aed',   // purple
  terminal: '#0d9488',       // teal
  epsilon: '#64748b',        // slate
  highlight: '#f59e0b',      // amber
};

/**
 * ParseTreeView — renders the parse tree using D3 hierarchy layout.
 * Accepts treeData as a nested { label, children } object (or array for LR).
 */
export default function ParseTreeView({ step, mode }) {
  const svgRef = useRef(null);
  const gRef = useRef(null);

  const treeData = getTreeData(step, mode);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    if (!treeData) {
      return;
    }

    const container = svgRef.current.parentElement;
    const width = container?.clientWidth || 600;
    const height = container?.clientHeight || 400;

    svg.attr('width', width).attr('height', height);

    const g = svg.append('g').attr('class', 'tree-group');
    gRef.current = g;

    // Zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.2, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    svg.call(zoom);

    // Build d3 hierarchy
    const root = d3.hierarchy(treeData);
    const treeLayout = d3.tree().nodeSize([60, 80]);
    treeLayout(root);

    // Center the tree
    const nodes = root.descendants();
    const minX = d3.min(nodes, d => d.x);
    const maxX = d3.max(nodes, d => d.x);
    const minY = d3.min(nodes, d => d.y);
    const treeWidth = maxX - minX;
    const offsetX = width / 2 - (minX + treeWidth / 2);
    const offsetY = 50 - minY;

    g.attr('transform', `translate(${offsetX},${offsetY})`);

    // Links
    g.selectAll('.link')
      .data(root.links())
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('d', d3.linkVertical()
        .x(d => d.x)
        .y(d => d.y))
      .attr('fill', 'none')
      .attr('stroke', 'rgba(148,163,184,0.35)')
      .attr('stroke-width', 1.5)
      .style('opacity', 0)
      .transition()
      .duration(400)
      .style('opacity', 1);

    // Node groups
    const node = g.selectAll('.node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x},${d.y})`)
      .style('opacity', 0);

    node.transition().duration(400).style('opacity', 1);

    // Circle background
    node.append('circle')
      .attr('r', NODE_RADIUS)
      .attr('fill', d => getNodeColor(d.data.label, treeData))
      .attr('stroke', d => getNodeStroke(d.data.label, treeData))
      .attr('stroke-width', 2)
      .attr('filter', 'url(#glow)');

    // Label
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('fill', '#f8fafc')
      .attr('font-family', 'Inter, sans-serif')
      .attr('font-size', d => d.data.label.length > 3 ? 10 : 13)
      .attr('font-weight', 600)
      .text(d => d.data.label);

    // Glow filter
    const defs = svg.append('defs');
    const filter = defs.append('filter').attr('id', 'glow');
    filter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

  }, [treeData]);

  return (
    <div className="parse-tree-view">
      {!treeData && (
        <div className="empty-state">
          <div className="empty-msg">Parse tree will appear here</div>
        </div>
      )}
      <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}

function getTreeData(step, mode) {
  if (!step) return null;
  if (mode === 'lr0') {
    const roots = step.treeRoots;
    if (!roots || roots.length === 0) return null;
    if (roots.length === 1) return roots[0];
    // Multiple roots: wrap in virtual root
    return { label: '…', children: roots };
  }
  return step.tree ?? null;
}

function getNodeColor(label) {
  if (label === 'ε') return COLORS.epsilon;
  // Uppercase first letter = non-terminal heuristic
  if (/^[A-Z]/.test(label) || /^[A-Z']/.test(label)) return COLORS.nonTerminal;
  return COLORS.terminal;
}

function getNodeStroke(label) {
  if (label === 'ε') return '#94a3b8';
  if (/^[A-Z]/.test(label) || /^[A-Z']/.test(label)) return '#a78bfa';
  return '#2dd4bf';
}
