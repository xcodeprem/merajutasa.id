#!/usr/bin/env node
/**
 * Export SVG from dependency graph using simple SVG generation
 */

import fs from 'node:fs';
import path from 'node:path';

const DEPENDENCIES_PATH = 'docs/architecture/dependencies.json';
const OUTPUT_PATH = 'docs/architecture/dependency-graph.svg';

function generateSVG(dependencies) {
  const { nodes, edges } = dependencies;

  // Simple layout algorithm - arrange nodes in a grid
  const nodePositions = new Map();
  const nodeRadius = 60;
  const nodeSpacing = 150;
  const cols = Math.ceil(Math.sqrt(nodes.length));

  nodes.forEach((node, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    nodePositions.set(node.id, {
      x: 100 + col * nodeSpacing,
      y: 100 + row * nodeSpacing,
    });
  });

  // Calculate SVG dimensions
  const maxX = Math.max(...Array.from(nodePositions.values()).map(p => p.x)) + nodeRadius * 2;
  const maxY = Math.max(...Array.from(nodePositions.values()).map(p => p.y)) + nodeRadius * 2;

  const svgParts = [];

  // SVG header
  svgParts.push(`<svg width="${maxX + 50}" height="${maxY + 50}" xmlns="http://www.w3.org/2000/svg">`);
  svgParts.push('<defs>');
  svgParts.push('<marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">');
  svgParts.push('<polygon points="0 0, 10 3.5, 0 7" fill="#666" />');
  svgParts.push('</marker>');
  svgParts.push('</defs>');

  // Add edges (draw first so they appear behind nodes)
  for (const edge of edges) {
    const fromPos = nodePositions.get(edge.from);
    const toPos = nodePositions.get(edge.to);

    if (fromPos && toPos) {
      const color = getCriticalityColor(edge.criticality);
      const strokeWidth = edge.criticality === 'critical' ? 3 : 2;

      svgParts.push(`<line x1="${fromPos.x}" y1="${fromPos.y}" x2="${toPos.x}" y2="${toPos.y}" 
        stroke="${color}" stroke-width="${strokeWidth}" marker-end="url(#arrowhead)" />`);
    }
  }

  // Add nodes
  for (const node of nodes) {
    const pos = nodePositions.get(node.id);
    if (!pos) {continue;}

    const fillColor = getNodeColor(node.id, node.criticality);
    const textColor = '#333';

    // Node circle
    svgParts.push(`<circle cx="${pos.x}" cy="${pos.y}" r="${nodeRadius}" 
      fill="${fillColor}" stroke="#666" stroke-width="2" />`);

    // Node label (split long names)
    const displayName = node.name || node.id;
    const words = displayName.split(' ');

    if (words.length > 2) {
      // Multi-line text
      svgParts.push(`<text x="${pos.x}" y="${pos.y - 5}" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="${textColor}">`);
      svgParts.push(`${words.slice(0, 2).join(' ')}`);
      svgParts.push('</text>');
      if (words.length > 2) {
        svgParts.push(`<text x="${pos.x}" y="${pos.y + 10}" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="${textColor}">`);
        svgParts.push(`${words.slice(2).join(' ')}`);
        svgParts.push('</text>');
      }
    } else {
      svgParts.push(`<text x="${pos.x}" y="${pos.y + 4}" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="${textColor}">${displayName}</text>`);
    }
  }

  // Add title
  svgParts.push('<text x="25" y="30" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#333">System Dependencies</text>');

  // Add legend
  const legendY = maxY - 80;
  svgParts.push('<text x="25" y="' + (legendY - 10) + '" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#333">Legend:</text>');

  svgParts.push('<circle cx="35" cy="' + (legendY + 10) + '" r="8" fill="#e8f5e8" stroke="#666" stroke-width="1" />');
  svgParts.push('<text x="50" y="' + (legendY + 15) + '" font-family="Arial, sans-serif" font-size="12" fill="#333">Gateway</text>');

  svgParts.push('<circle cx="35" cy="' + (legendY + 30) + '" r="8" fill="#f3e5f5" stroke="#666" stroke-width="1" />');
  svgParts.push('<text x="50" y="' + (legendY + 35) + '" font-family="Arial, sans-serif" font-size="12" fill="#333">Database</text>');

  svgParts.push('<circle cx="35" cy="' + (legendY + 50) + '" r="8" fill="#e1f5fe" stroke="#666" stroke-width="1" />');
  svgParts.push('<text x="50" y="' + (legendY + 55) + '" font-family="Arial, sans-serif" font-size="12" fill="#333">Service</text>');

  svgParts.push('</svg>');

  return svgParts.join('\n');
}

function getNodeColor(nodeId, criticality) {
  if (nodeId.includes('db') || nodeId.includes('database')) {
    return '#f3e5f5';
  } else if (nodeId.includes('gateway') || nodeId.includes('api')) {
    return '#e8f5e8';
  } else {
    return '#e1f5fe';
  }
}

function getCriticalityColor(criticality) {
  switch (criticality) {
  case 'critical': return '#d32f2f';
  case 'high': return '#f57c00';
  case 'medium': return '#1976d2';
  case 'low': return '#388e3c';
  default: return '#666';
  }
}

async function main() {
  try {
    console.log('🎨 Generating SVG from dependency graph...');

    // Load dependencies data
    const dependenciesData = JSON.parse(fs.readFileSync(DEPENDENCIES_PATH, 'utf8'));

    // Validate nodes and edges
    if (!dependenciesData.nodes || !dependenciesData.edges) {
      throw new Error('Invalid dependencies data: missing nodes or edges');
    }

    // Check for orphaned edges
    const nodeIds = new Set(dependenciesData.nodes.map(n => n.id));
    const orphanedEdges = dependenciesData.edges.filter(e =>
      !nodeIds.has(e.from) || !nodeIds.has(e.to),
    );

    if (orphanedEdges.length > 0) {
      console.warn(`⚠️  Found ${orphanedEdges.length} orphaned edges:`);
      orphanedEdges.forEach(edge => {
        console.warn(`   ${edge.from} -> ${edge.to}`);
      });
    }

    // Generate SVG
    const svgContent = generateSVG(dependenciesData);

    // Write SVG file
    fs.writeFileSync(OUTPUT_PATH, svgContent);

    console.log(`✅ Generated: ${OUTPUT_PATH}`);
    console.log(`📊 Graph stats: ${dependenciesData.nodes.length} nodes, ${dependenciesData.edges.length} edges`);

    if (orphanedEdges.length === 0) {
      console.log('✅ No orphaned nodes or edges detected');
    }

  } catch (error) {
    console.error('❌ SVG generation failed:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
