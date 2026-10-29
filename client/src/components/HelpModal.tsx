import { useState, useEffect, useMemo } from 'react';
import { X, BookOpen, Layers, Link2, Table2, FileSpreadsheet, Play, FileText, Keyboard, HelpCircle, ChevronRight, FileDown, ChevronDown, Settings, Video, Search, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import damIcon from '@assets/dam_1779522984604.png';
import yIntersectionIcon from '@assets/y-intersection_(1)_1779523210044.png';
import waterTankIcon from '@assets/water-tank_(2)_1779523360829.png';
import windIcon from '@assets/wind_1779523398812.png';

interface HelpModalProps {
  open: boolean;
  onClose: () => void;
}

interface Section {
  id: string;
  icon: React.ReactNode;
  label: string;
}

const SECTIONS: Section[] = [
  { id: 'getting-started',   icon: <BookOpen className="w-4 h-4" />,       label: 'Getting Started'     },
  { id: 'elements',          icon: <Layers className="w-4 h-4" />,          label: 'Network Elements'    },
  { id: 'all-properties',    icon: <Settings className="w-4 h-4" />,        label: 'All Properties'      },
  { id: 'connections',       icon: <Link2 className="w-4 h-4" />,           label: 'Connections'         },
  { id: 'demo-videos',       icon: <Video className="w-4 h-4" />,           label: 'Demo Videos'         },
  { id: 'flex-table',        icon: <Table2 className="w-4 h-4" />,          label: 'Flex Table'          },
  { id: 'excel',             icon: <FileSpreadsheet className="w-4 h-4" />, label: 'Excel Import/Export' },
  { id: 'simulation',        icon: <Play className="w-4 h-4" />,            label: 'Running Simulations' },
  { id: 'files',             icon: <FileText className="w-4 h-4" />,        label: 'INP & OUT Files'     },
  { id: 'shortcuts',         icon: <Keyboard className="w-4 h-4" />,        label: 'Keyboard Shortcuts'  },
  { id: 'troubleshooting',   icon: <HelpCircle className="w-4 h-4" />,      label: 'Troubleshooting'     },
];

// ─── PDF generation ───────────────────────────────────────────────────────────
function downloadPDF() {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const PW = 210;
  const PH = 297;
  const ML = 20;
  const MR = 20;
  const TW = PW - ML - MR;

  let pageNum = 1;

  function newPage() {
    doc.addPage();
    pageNum++;
    addPageNumber();
  }

  function addPageNumber() {
    if (pageNum < 3) return;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(`${pageNum - 2}`, PW / 2, PH - 10, { align: 'center' });
    doc.text('WHAMO Network Designer — User Manual', ML, PH - 10);
    doc.setTextColor(0, 0, 0);
  }

  function wrapText(text: string, maxWidth: number, fontSize: number): string[] {
    doc.setFontSize(fontSize);
    return doc.splitTextToSize(text, maxWidth);
  }

  function writeLines(lines: string[], x: number, startY: number, fontSize: number, color: [number, number, number] = [60, 60, 60]): number {
    doc.setFontSize(fontSize);
    doc.setTextColor(...color);
    const lineH = fontSize * 0.45;
    let y = startY;
    for (const line of lines) {
      if (y > PH - 25) { newPage(); y = 30; }
      doc.text(line, x, y);
      y += lineH;
    }
    return y;
  }

  function sectionHeading(title: string, y: number): number {
    if (y > PH - 40) { newPage(); y = 30; }
    doc.setFillColor(26, 115, 232);
    doc.rect(ML, y - 5, TW, 9, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text(title, ML + 3, y + 1.5);
    doc.setTextColor(0, 0, 0);
    return y + 12;
  }

  function subHeading(title: string, y: number): number {
    if (y > PH - 35) { newPage(); y = 30; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    doc.text(title, ML, y);
    doc.setDrawColor(26, 115, 232);
    doc.line(ML, y + 1.5, ML + doc.getTextWidth(title), y + 1.5);
    doc.setTextColor(60, 60, 60);
    return y + 7;
  }

  function miniHeading(title: string, y: number): number {
    if (y > PH - 25) { newPage(); y = 30; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(50, 80, 130);
    doc.text(title, ML, y);
    doc.setTextColor(60, 60, 60);
    return y + 5.5;
  }

  function para(text: string, y: number, bold = false): number {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    const lines = wrapText(text, TW, 10);
    return writeLines(lines, ML, y, 10) + 3;
  }

  function noteBox(text: string, y: number, warn = false): number {
    if (y > PH - 30) { newPage(); y = 30; }
    const lines = wrapText(text, TW - 8, 9.5);
    const boxH = lines.length * 4.3 + 5;
    doc.setFillColor(warn ? 255 : 235, warn ? 251 : 245, warn ? 205 : 254);
    doc.setDrawColor(warn ? 217 : 26, warn ? 119 : 115, warn ? 6 : 232);
    doc.roundedRect(ML, y, TW, boxH, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(warn ? 120 : 26, warn ? 60 : 70, warn ? 6 : 150);
    doc.text(warn ? '⚠  Warning' : 'ℹ  Info', ML + 3, y + 4);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    let ly = y + 8;
    for (const l of lines) { doc.text(l, ML + 3, ly); ly += 4.3; }
    return y + boxH + 4;
  }

  function stepList(steps: string[], y: number): number {
    for (let i = 0; i < steps.length; i++) {
      if (y > PH - 25) { newPage(); y = 30; }
      doc.setFillColor(26, 115, 232);
      doc.circle(ML + 2.5, y - 1.5, 2.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text(String(i + 1), ML + 2.5, y - 0.5, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      const lines = doc.splitTextToSize(steps[i], TW - 8);
      doc.text(lines, ML + 7, y);
      y += lines.length * 4.5 + 1.5;
    }
    return y + 2;
  }

  function bulletList(items: string[], y: number): number {
    for (const item of items) {
      if (y > PH - 20) { newPage(); y = 30; }
      doc.setFillColor(26, 115, 232);
      doc.circle(ML + 1.5, y - 1, 1.2, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      const lines = doc.splitTextToSize(item, TW - 6);
      doc.text(lines, ML + 5, y);
      y += lines.length * 4.5 + 1;
    }
    return y + 2;
  }

  function elementCard(name: string, desc: string, fields: string[], y: number): number {
    if (y > PH - 40) { newPage(); y = 30; }
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(200, 210, 220);
    const descLines = doc.splitTextToSize(desc, TW - 6);
    const fieldText = fields.join('  ·  ');
    const fieldLines = doc.splitTextToSize(fieldText, TW - 6);
    const boxH = 7 + descLines.length * 4.5 + (fields.length ? fieldLines.length * 4 + 4 : 0);
    doc.roundedRect(ML, y, TW, boxH, 2, 2, 'FD');
    doc.setFillColor(26, 115, 232);
    doc.roundedRect(ML + 2, y + 2, doc.getStringUnitWidth(name) * 10 * 0.352 + 4, 5, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(name, ML + 4, y + 5.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(60, 60, 60);
    let ly = y + 10;
    for (const l of descLines) { doc.text(l, ML + 3, ly); ly += 4.5; }
    if (fields.length) {
      doc.setFontSize(8.5);
      doc.setTextColor(100, 120, 140);
      for (const l of fieldLines) { doc.text(l, ML + 3, ly); ly += 4; }
    }
    return y + boxH + 3;
  }

  function propTable(rows: Array<[string, string]>, y: number): number {
    if (y > PH - 40) { newPage(); y = 30; }
    for (const [k, v] of rows) {
      if (y > PH - 18) { newPage(); y = 30; }
      const vLines = doc.splitTextToSize(v, TW - 55);
      const rowH = vLines.length * 4.2 + 4;
      doc.setFillColor(245, 248, 252);
      doc.setDrawColor(220, 228, 238);
      doc.roundedRect(ML, y, 50, rowH, 1, 1, 'FD');
      doc.roundedRect(ML + 52, y, TW - 52, rowH, 1, 1, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(26, 60, 130);
      doc.text(k, ML + 2, y + rowH / 2 + 1);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      let vy = y + 3.5;
      for (const l of vLines) { doc.text(l, ML + 54, vy); vy += 4.2; }
      y += rowH + 1.5;
    }
    return y + 2;
  }

  function kbTable(rows: Array<[string[], string]>, y: number): number {
    const colW = [70, TW - 70];
    if (y > PH - 40) { newPage(); y = 30; }
    doc.setFillColor(241, 245, 249);
    doc.rect(ML, y - 4, TW, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(80, 100, 120);
    doc.text('Shortcut', ML + 2, y);
    doc.text('Action', ML + colW[0] + 2, y);
    y += 4;
    for (const [keys, action] of rows) {
      if (y > PH - 20) { newPage(); y = 30; }
      doc.setDrawColor(230, 235, 240);
      doc.line(ML, y, ML + TW, y);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(50, 70, 100);
      doc.text(keys.join(' + '), ML + 2, y + 4);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      doc.text(action, ML + colW[0] + 2, y + 4);
      y += 7;
    }
    return y + 4;
  }

  // ── COVER PAGE ─────────────────────────────────────────────────────────────
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, PW, PH, 'F');

  doc.setFillColor(26, 115, 232);
  doc.rect(0, PH * 0.42, PW, 55, 'F');

  doc.setFillColor(26, 115, 232);
  doc.rect(0, 0, PW, 4, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(36);
  doc.setTextColor(255, 255, 255);
  doc.text('WHAMO', PW / 2, 70, { align: 'center' });

  doc.setFontSize(22);
  doc.setTextColor(147, 197, 253);
  doc.text('Network Designer', PW / 2, 84, { align: 'center' });

  doc.setFontSize(13);
  doc.setTextColor(200, 220, 255);
  doc.text('User Manual', PW / 2, 95, { align: 'center' });

  doc.setDrawColor(26, 115, 232);
  doc.setLineWidth(0.5);
  doc.line(ML, 103, PW - ML, 103);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(148, 163, 184);
  doc.text('Hydraulic Transient Analysis Tool', PW / 2, 112, { align: 'center' });
  doc.text('Water Hammer & Mass Oscillation', PW / 2, 120, { align: 'center' });

  doc.setFillColor(30, 41, 59);
  doc.roundedRect(PW / 2 - 40, 135, 80, 24, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(26, 115, 232);
  doc.text('VERSION 1.0', PW / 2, 145, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text(new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }), PW / 2, 153, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('Complete Reference Guide', PW / 2, PH * 0.42 + 14, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(200, 220, 255);
  const coverTopics = [
    'Network Elements  ·  All Properties  ·  Connections  ·  Simulations',
    'Excel Import/Export  ·  INP/OUT Files  ·  Keyboard Shortcuts',
  ];
  let cy = PH * 0.42 + 23;
  for (const t of coverTopics) { doc.text(t, PW / 2, cy, { align: 'center' }); cy += 7; }

  doc.setFontSize(8);
  doc.setTextColor(100, 120, 150);
  doc.text('WHAMO Network Designer  ·  All rights reserved', PW / 2, PH - 12, { align: 'center' });

  // ── TABLE OF CONTENTS ──────────────────────────────────────────────────────
  newPage();
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, PW, PH, 'F');

  doc.setFillColor(26, 115, 232);
  doc.rect(0, 0, PW, 14, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('TABLE OF CONTENTS', ML, 9.5);

  const tocItems = [
    ['01', 'Getting Started',      'Creating a project, opening, saving, undo/redo'],
    ['02', 'Network Elements',     'Reservoir, Node, Junction, Surge Tank, Flow BC, Conduit, Dummy Pipe'],
    ['03', 'All Properties',       'Full property reference for every element — name, unit, description, meaning, how to use'],
    ['04', 'Connections',          'Drawing conduits, connection rules, valid/invalid combinations'],
    ['05', 'Flex Table',           'Spreadsheet editor, filters, units, T/H schedules, material'],
    ['06', 'Excel Import/Export',  'Single-tab and multi-sheet workbook workflows'],
    ['07', 'Running Simulations',  'Parameters, output requests, generating .OUT files'],
    ['08', 'INP & OUT Files',      'Generating .INP, viewing .OUT, visualization tool'],
    ['09', 'Keyboard Shortcuts',   'Canvas, Flex Table, and ReactFlow control shortcuts'],
    ['10', 'Troubleshooting',      'Common issues and solutions'],
  ];

  let ty = 28;
  for (const [num, title, desc] of tocItems) {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(220, 228, 238);
    doc.roundedRect(ML, ty, TW, 16, 2, 2, 'FD');
    doc.setFillColor(26, 115, 232);
    doc.roundedRect(ML + 2, ty + 2, 10, 12, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(num, ML + 7, ty + 9.5, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(20, 30, 50);
    doc.text(title, ML + 16, ty + 6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 115, 135);
    const descL = doc.splitTextToSize(desc, TW - 20);
    doc.text(descL[0], ML + 16, ty + 11.5);
    ty += 20;
  }

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(150, 160, 175);
  doc.text('This document was generated automatically from the WHAMO Network Designer help system.', ML, PH - 14);

  // ── SECTION 1: GETTING STARTED ─────────────────────────────────────────────
  newPage();
  let y = sectionHeading('1.  Getting Started', 22);
  y = para('WHAMO Network Designer lets you visually build water distribution networks and export them for hydraulic simulation using the WHAMO engine.', y);
  y += 2;
  y = subHeading('Creating a New Project', y);
  y = stepList([
    'Click New in the title bar to create a blank project.',
    'Enter a project name in the centre field of the title bar.',
    'Add elements using the INSERT ribbon (Reservoir, Node, Junction, etc.).',
    'Connect elements by hovering a node until the green handle appears, then dragging to another node.',
    'Click Save As to persist the project to the server.',
  ], y);
  y = subHeading('Opening an Existing Project', y);
  y = stepList([
    'Click Open in the title bar.',
    'Select a project from the Projects list panel.',
    'The canvas, properties, and all settings are restored automatically.',
  ], y);
  y = subHeading('Saving', y);
  y = para('Use Save to overwrite the current project, or Save As to create a new revision. Projects are stored on the server and remain available after logging out.', y);
  y = noteBox('All element property changes are tracked with Undo/Redo (up to 50 steps). Use Ctrl+Z and Ctrl+Y to navigate the history.', y);

  // ── SECTION 2: NETWORK ELEMENTS (DETAILED) ─────────────────────────────────
  newPage();
  y = sectionHeading('2.  Network Elements', 22);
  y = para('Each element in WHAMO represents a physical hydraulic component. Click any INSERT ribbon button to place an element on the canvas. Below is comprehensive documentation for every supported element type.', y);
  y += 2;

  // RESERVOIR
  y = subHeading('Reservoir', y);
  y = para('A Reservoir is a fixed or schedule-driven hydraulic boundary condition that provides a constant or time-varying hydraulic head (water surface elevation) to the network. It acts as the primary driving force in most WHAMO simulations.', y);
  y = miniHeading('Purpose & When to Use', y);
  y = bulletList([
    'Use at the upstream or downstream end of a pipeline system where the head is known or prescribed.',
    'Represents large storage tanks, impoundments, lakes, or any boundary where head is controlled.',
    'Required: every valid WHAMO network must have at least one Reservoir.',
  ], y);
  y = miniHeading('How to Add', y);
  y = stepList([
    'Click the Reservoir button in the INSERT ribbon.',
    'A Reservoir node is placed on the canvas.',
    'Click the node to select it, then edit properties in the Properties Panel on the right.',
    'Connect it to Nodes or Junctions using conduits.',
  ], y);
  y = miniHeading('Properties', y);
  y = propTable([
    ['Label', 'Unique identifier for this element (required, case-sensitive).'],
    ['Elevation (m/ft)', 'Head of the reservoir boundary. In Fixed mode this is the constant head; in Schedule mode it is the initial head.'],
    ['Mode', 'Fixed: constant head throughout simulation. Schedule: head varies per the H-Schedule pairs.'],
    ['H-Schedule #', 'References a time/head schedule (T-H pairs). Only active when Mode = Schedule.'],
    ['Loss Coefficient', 'Minor loss coefficient at the reservoir connection (typically 0.5 for a sharp-edged inlet).'],
  ], y);
  y = noteBox('Validation rule: A Reservoir must be connected to at least one conduit. An isolated Reservoir will cause a validation error.', y, true);

  // NODE
  y = subHeading('Node', y);
  y = para('A Node is the basic junction point in a WHAMO network. It represents a location in the piping system where pipes meet, but where no special boundary condition or demand exists. Nodes are the simplest connection element.', y);
  y = miniHeading('Purpose & When to Use', y);
  y = bulletList([
    'Use wherever two or more conduits join without a demand flow or special behaviour.',
    'Ideal for pipe tee junctions that are purely topological (no off-take demand).',
    'Can also be used as intermediate points along a long pipeline to divide it into computational segments.',
  ], y);
  y = miniHeading('Properties', y);
  y = propTable([
    ['Label', 'Unique identifier for this element (required).'],
    ['Elevation (m/ft)', 'Elevation of the node. Used for pressure and HGL calculations.'],
    ['Node Number', 'Auto-assigned internal WHAMO node number. Editable if required to match a specific WHAMO input convention.'],
  ], y);
  y = noteBox('Nodes must have at least one conduit connection to be valid. Isolated nodes are flagged during validation.', y, true);

  // JUNCTION
  y = subHeading('Junction', y);
  y = para('A Junction is a demand junction that allows lateral off-take (consumption) flows. It behaves like a Node but also supports a specified demand flow rate that is extracted from the network at that location.', y);
  y = miniHeading('Purpose & When to Use', y);
  y = bulletList([
    'Use wherever a customer demand, off-take, or consumer draw is modelled.',
    'Use for tee junctions where a side branch carries a known demand flow.',
    'The demand may be zero, making Junction functionally identical to Node.',
  ], y);
  y = miniHeading('Properties', y);
  y = propTable([
    ['Label', 'Unique identifier (required).'],
    ['Elevation', 'Node elevation for HGL and pressure calculations.'],
    ['Demand (m³/s or ft³/s)', 'Steady-state demand flow extracted at this junction. Positive value = extraction from network.'],
  ], y);
  y = noteBox('Demand is applied as a constant off-take. For time-varying demands, use a Flow BC element instead.', y);

  // SURGE TANK
  y = subHeading('Surge Tank', y);
  y = para('A Surge Tank is an open or closed pressure vessel connected to the pipeline to suppress water hammer (hydraulic transients). It absorbs and releases flow to moderate pressure fluctuations and protect the system from extreme pressure events.', y);
  y = miniHeading('Purpose & When to Use', y);
  y = bulletList([
    'Place near the section where transient pressures need to be reduced.',
    'Use an open tank when the water surface vents to atmosphere.',
    'Use a closed (air vessel) tank to provide a pressurised cushion — configure using E/A (elevation/area) pairs.',
    'Recommended wherever significant water hammer risk exists, such as rapid changes in flow.',
  ], y);
  y = miniHeading('Properties', y);
  y = propTable([
    ['Label', 'Unique identifier (required).'],
    ['Tank Top', 'Maximum water level elevation the tank can reach before overflowing.'],
    ['Tank Bottom', 'Minimum water level (empty tank). Simulation warns if level drops below this.'],
    ['Initial Water Level', 'Water surface elevation at the start of the simulation (t = 0).'],
    ['Riser Diameter', 'Diameter of the connection pipe between the tank and the main pipeline.'],
    ['Area / Shape (E/A pairs)', 'For closed (non-prismatic) tanks: elevation-area pairs defining the tank cross-section shape.'],
  ], y);
  y = noteBox('Surge tanks are modelled as infinite-celerity elements internally. Do not set celerity on surge tank conduit connections — this is handled automatically.', y);
  y = noteBox('Validation: Tank Bottom must be less than Tank Top. Initial Water Level must be between Tank Bottom and Tank Top.', y, true);

  // FLOW BC
  y = subHeading('Flow Boundary (Flow BC)', y);
  y = para('A Flow Boundary Condition (Flow BC) injects or extracts a prescribed flow rate at a specific point in the network. It acts as a source or sink of flow, either at a constant rate or following a time-varying schedule.', y);
  y = miniHeading('Purpose & When to Use', y);
  y = bulletList([
    'Use to model inflow from an external source not represented by another network boundary.',
    'Use to model controlled extraction (e.g., irrigation offtake) that varies with time.',
    'Ideal for simulating demand fluctuations, operational scenarios, or emergency shut-offs.',
    'Can represent any controlled flow injection or withdrawal point.',
  ], y);
  y = miniHeading('Properties', y);
  y = propTable([
    ['Label', 'Unique identifier (required).'],
    ['Flow Rate (Q)', 'The prescribed flow rate (m³/s or ft³/s). Positive = injection into system; negative = extraction.'],
    ['Mode', 'Fixed: constant flow rate. Schedule: flow varies according to Q-Schedule pairs.'],
    ['Q-Schedule #', 'References a time/flow schedule. Active only when Mode = Schedule.'],
  ], y);
  y = noteBox('Unlike a Reservoir (which prescribes head), a Flow BC prescribes flow. Do not confuse the two — using the wrong boundary type will give incorrect simulation results.', y, true);

  // CONDUIT & DUMMY PIPE
  y = subHeading('Conduit (Pipe)', y);
  y = para('A Conduit is the fundamental flow-carrying element in WHAMO. Every pair of connected nodes is linked by a conduit, which represents a pipe section with defined hydraulic properties. The conduit carries both steady-state and transient flow between elements.', y);
  y = miniHeading('Purpose & When to Use', y);
  y = bulletList([
    'Every connection between two network elements in WHAMO is a conduit.',
    'Set pipe length, diameter, wave speed (celerity), and friction factor accurately for correct transient modelling.',
    'The Courant condition (DTCOMP × a / L ≤ 1) must be satisfied for numerical stability.',
  ], y);
  y = miniHeading('Properties', y);
  y = propTable([
    ['Length (L)', 'Physical pipe length in metres (SI) or feet (FPS). Must be > 0.'],
    ['Diameter (D)', 'Internal pipe diameter in m or ft. Must be > 0.'],
    ['Celerity (a)', 'Pressure-wave speed in m/s or ft/s. Typically 800–1400 m/s for steel pipes.'],
    ['Friction (f)', "Darcy-Weisbach friction factor, or Manning's n if Manning's formula is selected."],
    ['Pipe Material', "Selecting a material auto-fills Manning's n, Young's Modulus (E), and computes wave speed."],
    ['Has Added Loss', 'Enables a minor-loss coefficient (K) for fittings, bends, or special features on this conduit.'],
  ], y);
  y = noteBox('Courant condition: DTCOMP × celerity / Length must be ≤ 1.0. If violated, WHAMO will produce incorrect results or fail to converge.', y, true);

  y = subHeading('Dummy Pipe', y);
  y = para('A Dummy Pipe is a special conduit with zero (or negligible) resistance used to connect elements that are physically very close together, or to model instantaneous connections such as the junction of two tanks.', y);
  y = miniHeading('Purpose & When to Use', y);
  y = bulletList([
    'Use to connect a Surge Tank to the main pipeline when the riser length is negligible.',
    'Use to split a conduit into segments without adding physical pipe resistance.',
    'Dummy Pipes should not carry meaningful head loss — they are topological connectors only.',
  ], y);
  y = propTable([
    ['Length (L)', 'Typically set to a very small value (e.g., 0.001 m). WHAMO treats it as zero resistance.'],
    ['Diameter (D)', 'Should match the connecting pipe diameter for continuity.'],
    ['Celerity (a)', 'Set to a high value (e.g., 9999 m/s) to represent rigid-column behaviour.'],
  ], y);

  // ── SECTION 3: ALL PROPERTIES ──────────────────────────────────────────────
  newPage();
  y = sectionHeading('3.  All Properties', 22);
  y = para('Complete property reference for every element type. Each property lists its name, unit, description, meaning in the context of WHAMO simulation, and guidance on how to set the correct value.', y);
  y += 2;

  for (const ep of ALL_ELEMENT_PROPS) {
    y = subHeading(ep.element, y);
    const epRows: Array<[string, string]> = ep.properties.map(p => [
      p.unit ? `${p.name}\n(${p.unit})` : p.name,
      `${p.description} — ${p.meaning} ${p.howToUse}`,
    ]);
    y = propTable(epRows, y);
    y += 2;
  }

  // ── SECTION 4: CONNECTIONS (DETAILED) ──────────────────────────────────────
  newPage();
  y = sectionHeading('4.  Connections', 22);
  y = para('Every pair of connected elements in WHAMO is linked by a conduit. Connections define the network topology and control how flow and pressure waves propagate through the system. This section covers all supported connection types, their rules, and best practices.', y);
  y += 2;

  y = subHeading('Standard Conduit Connection', y);
  y = para('A standard conduit is a regular pipe linking two network nodes. It is the most common connection type and carries both steady-state and transient flow.', y);
  y = miniHeading('How to Draw', y);
  y = stepList([
    'Hover over a source element until the green connection handle appears on its edge.',
    'Click and drag from the handle to the target element.',
    'Release the mouse over the target — a conduit is created automatically.',
    'Select the conduit in the Flex Table (Conduit tab) to set its hydraulic properties.',
  ], y);
  y = miniHeading('Valid Connections', y);
  y = bulletList([
    'Reservoir → Node, Junction, Surge Tank, Flow BC',
    'Node → Node, Junction, Reservoir, Surge Tank, Flow BC',
    'Junction → Node, Junction, Reservoir, Surge Tank',
    'Surge Tank → Node, Junction (via riser conduit or dummy pipe)',
  ], y);
  y = miniHeading('Invalid Connections', y);
  y = bulletList([
    'Reservoir → Reservoir directly (two boundary conditions cannot be directly connected — add a Node in between).',
    'Self-loop: connecting an element to itself.',
    'Connecting two elements with a conduit that has zero length or diameter in production networks.',
  ], y);
  y = noteBox('Every conduit must have non-zero Length, Diameter, and Celerity before running a simulation. Missing values will cause a validation error.', y, true);

  y = subHeading('Reservoir Connections', y);
  y = para('A Reservoir connects to the network via one or more standard conduits. It provides the head boundary condition at its connection point.', y);
  y = bulletList([
    'A Reservoir can connect to: Node, Junction, Surge Tank (via conduit), Flow BC.',
    'Two Reservoirs cannot be directly connected — place a Node between them.',
    'Multiple conduits can connect to a single Reservoir (e.g., a storage tank serving multiple branches).',
    'The Reservoir\'s loss coefficient applies to all conduits connecting to it.',
  ], y);
  y = noteBox('At least one Reservoir must exist in the network. WHAMO requires a head boundary to solve the steady-state system before running the transient.', y, true);

  y = subHeading('Surge Tank Connections', y);
  y = para('A Surge Tank connects to the main pipeline via a conduit (usually a short riser pipe or dummy pipe). It acts as an open or closed side-branch vessel.', y);
  y = bulletList([
    'Surge Tank connects to: Node or Junction. It cannot connect to a Reservoir directly.',
    'The riser conduit (from main pipe to tank base) must have a diameter set — this is the riser diameter.',
    'For very short risers, use a Dummy Pipe connection to minimise computational issues.',
    'Only one conduit should connect to a Surge Tank (it is a side-branch, not a through-flow element).',
  ], y);
  y = noteBox('Attempting to connect a Surge Tank to two pipeline nodes (as a through-element) is an invalid configuration and will fail validation.', y, true);

  y = subHeading('Flow BC Connections', y);
  y = para('A Flow BC connects to the network via a single conduit and injects or extracts flow at that point.', y);
  y = bulletList([
    'Flow BC connects to: Node or Junction. Typically only one connection per Flow BC.',
    'Positive Q injects flow into the network; negative Q extracts flow.',
    'Flow BC can be used as an alternative to a Reservoir where the flow (not head) is the known boundary.',
  ], y);

  // ── SECTION 5: FLEX TABLE ──────────────────────────────────────────────────
  newPage();
  y = sectionHeading('5.  Flex Table', 22);
  y = para('The Flex Table gives you a spreadsheet-like view of every element in the network. Open it from Tools → Flex Table in the ribbon.', y);
  y += 2;
  y = subHeading('Tab Filters', y);
  y = para('Use the filter chips at the top to switch between supported network element types.', y);
  y = subHeading('Editing Cells', y);
  y = para('Click any white cell to edit it inline. Grey background cells are read-only for that element type. Press Tab or Enter to commit; Escape cancels.', y);
  y = subHeading('Unit System', y);
  y = para('The SI / FPS toggle controls the global display unit. Individual rows can override this via the Unit column — an amber border indicates a per-element override.', y);
  y = subHeading('T/H and Q Schedule Pairs', y);
  y = para('For reservoirs with H-Schedule mode, or flow boundaries with Q-Schedule mode, click the Edit Pairs button in that row to open the pairs editor. Enter time/value pairs to define the schedule.', y);
  y = subHeading('Pipe Material (Conduit Tab)', y);
  y = para("Selecting a material in the Material column auto-fills Manning's n, Pipe Elastic Modulus (E), and recalculates wave speed for all conduits or just the selected row, depending on the Apply Material to All Conduits checkbox.", y);
  y = noteBox('Clicking a row in the Flex Table selects the corresponding element on the canvas (and vice versa), keeping both views in sync.', y);

  // ── SECTION 6: EXCEL IMPORT/EXPORT ─────────────────────────────────────────
  newPage();
  y = sectionHeading('6.  Excel Import / Export', 22);
  y = para('The Flex Table supports lossless round-trip Excel synchronization. Export a workbook, edit values in Excel, and import back — all element data is preserved.', y);
  y += 2;
  y = subHeading('Exporting a Single Element Type', y);
  y = stepList([
    'Open the Flex Table (Tools → Flex Table).',
    'Select the desired element type tab (e.g. Conduit).',
    'Click the Export Excel button in the top-right of the tab bar.',
    'An .xlsx file named whamo_conduit_YYYY-MM-DD.xlsx is downloaded.',
  ], y);
  y = subHeading('Exporting All Element Types (Multi-Sheet)', y);
  y = stepList([
    'Open the Flex Table and stay on the All tab.',
    'Click Export Excel — a multi-sheet workbook is created.',
    'Each element type with data gets its own clearly labelled sheet.',
    'The workbook is named whamo_all_<ProjectName>_YYYY-MM-DD.xlsx.',
  ], y);
  y = subHeading('Importing from Excel', y);
  y = stepList([
    'Make sure your network already contains the elements you want to update.',
    'Select the matching tab in the Flex Table (or All for a multi-sheet file).',
    'Click Import Excel and select the .xlsx file.',
    'Each row is matched by its Label. Rows whose labels do not match an existing element are skipped.',
    'After a multi-sheet import, a summary dialog shows updated/skipped counts per sheet.',
  ], y);
  y = noteBox('Import only updates existing elements — it does not create new ones. Make sure all elements exist on the canvas before importing.', y, true);
  y = noteBox('The exported workbook includes Excel data-validation dropdowns for Pipe Material, Mode, and boolean toggles. These dropdowns are preserved on re-import.', y);

  // ── SECTION 7: RUNNING SIMULATIONS ─────────────────────────────────────────
  newPage();
  y = sectionHeading('7.  Running Simulations', 22);
  y = para('WHAMO Network Designer can run the WHAMO hydraulic transient engine directly. Configure parameters, specify output requests, then generate your results.', y);
  y += 2;
  y = subHeading('Computational Parameters', y);
  y = para('Click Generate → .INP or .OUT to open the generation panel. Computational Parameters appear at the top; set DTCOMP (computation step), DTOUT (output interval), and TMAX (maximum simulation time) for each stage.', y);
  y = subHeading('Output Requests', y);
  y = stepList([
    'Click Generate → .INP or .OUT to open the generation panel and configure output requests below the parameters.',
    'Select a node or element, or choose a group type (Nodes, Conduits, Elements).',
    'Tick the variables you want to record for the selected output request.',
    'Choose HISTORY, select an element and variables, then click Add Request. Requests are only created when you add them manually.',
    'Review the Current Requests list at the bottom.',
  ], y);
  y = subHeading('Generating the .OUT File', y);
  y = stepList([
    'Click Generate → .OUT in the ribbon.',
    'The network is validated. Fix any errors and try again.',
    'After validation, the WHAMO engine runs on the server and the .OUT file is generated.',
    'The result is displayed in the file preview panel — you can also send it to Visualization.',
  ], y);
  y = noteBox('The WHAMO engine requires Wine on Linux. It runs in an isolated temporary directory and cleans up after each run.', y);

  // ── SECTION 8: INP & OUT FILES ─────────────────────────────────────────────
  newPage();
  y = sectionHeading('8.  INP & OUT Files', 22);
  y = para('WHAMO uses two text-based file formats: the .INP input file and the .OUT output file. Both can be previewed, downloaded, and analysed within the Designer.', y);
  y += 2;
  y = subHeading('.INP File', y);
  y = para("The .INP file is the WHAMO input definition. It describes the network topology, element properties, computational parameters, and output requests in WHAMO's native format.", y);
  y = stepList([
    'Click Generate → .INP in the ribbon.',
    'The network is validated first. Resolve any errors shown.',
    "After validation, review Computational Parameters and output requests in the generation panel, then continue to generate the .INP.",
    'The file is downloaded to your computer.',
  ], y);
  y = subHeading('.OUT File', y);
  y = para('The .OUT file is produced by the WHAMO engine after a simulation run. It contains time-series results for all requested output variables.', y);
  y = subHeading('Viewing Results in Visualization', y);
  y = stepList([
    'Click Tools → Visualization in the ribbon.',
    'Load a .OUT file using the file picker inside the Visualization view.',
    'Switch between Profile Graph (animated HGL) and History Graph (time-series plots).',
  ], y);
  y = noteBox('The .OUT file parser runs entirely client-side — no server upload is needed to view results.', y);

  // ── SECTION 9: KEYBOARD SHORTCUTS ──────────────────────────────────────────
  newPage();
  y = sectionHeading('9.  Keyboard Shortcuts', 22);
  y = para('Use these shortcuts to speed up common actions while working in the canvas or Flex Table.', y);
  y += 2;
  y = subHeading('Canvas Shortcuts', y);
  y = kbTable([
    [['Ctrl', 'Z'], 'Undo last change'],
    [['Ctrl', 'Y'], 'Redo'],
    [['Ctrl', 'S'], 'Save project'],
    [['Delete'], 'Delete selected element(s)'],
    [['Escape'], 'Deselect / cancel link-drawing mode'],
    [['Ctrl', 'A'], 'Select all elements on canvas'],
    [['Ctrl', '+'], 'Zoom in'],
    [['Ctrl', '-'], 'Zoom out'],
    [['Ctrl', 'Shift', 'F'], 'Fit view to network'],
    [['Space'], 'Pan canvas (hold while dragging)'],
  ], y);
  y = subHeading('Flex Table Shortcuts', y);
  y = kbTable([
    [['Tab'], 'Move to next editable cell'],
    [['Shift', 'Tab'], 'Move to previous editable cell'],
    [['Enter'], 'Commit edit and move to next row'],
    [['Escape'], 'Cancel edit without saving'],
  ], y);
  y = subHeading('Canvas Controls (Mouse)', y);
  y = kbTable([
    [['Scroll Wheel'], 'Zoom in / out on canvas'],
    [['Click + Drag (background)'], 'Pan canvas'],
    [['Click + Drag (node)'], 'Move element'],
    [['Click (node)'], 'Select element, show Properties Panel'],
  ], y);

  // ── SECTION 10: TROUBLESHOOTING ────────────────────────────────────────────
  newPage();
  y = sectionHeading('10.  Troubleshooting', 22);
  y = para('Common issues and how to resolve them.', y);
  y += 2;
  const issues: Array<[string, string]> = [
    [
      'Validation fails with "No path from Reservoir to Node"',
      'Every node must be reachable from at least one Reservoir via conduits. Check the canvas for disconnected elements or broken conduit connections.',
    ],
    [
      'WHAMO engine returns an error or empty .OUT file',
      'Ensure all conduit lengths, diameters, and celerities are non-zero. Check that DTCOMP × celerity / length ≤ 1 (Courant condition). Review the error message in the preview panel for WHAMO-specific diagnostics.',
    ],
    [
      'Import Excel: all rows skipped',
      'The import matches rows by Label. Ensure the Label column in your Excel file matches exactly the element labels on the canvas (case-sensitive). Use Export Excel first to get the correct format.',
    ],
    [
      'Multi-sheet export shows empty workbook',
      'The All tab export only includes element types that have at least one element. Make sure your network has elements before exporting.',
    ],
    [
      'Canvas elements overlap after Auto-Arrange',
      'Auto-Arrange uses a tree layout and works best on networks with a clear flow direction. For complex looped networks, manually position elements after arranging.',
    ],
    [
      'Surge Tank celerity is very high or infinite',
      'Surge tanks are modelled as infinite-celerity elements in WHAMO. This is expected — do not adjust the celerity for surge tank connections.',
    ],
    [
      'Undo/Redo is not available',
      'Undo/Redo is only available when a project is open. Make sure you have opened or saved a project first.',
    ],
    [
      'Reservoir connection gives unrealistic results',
      'Check that the Reservoir elevation is set correctly and that the Loss Coefficient is appropriate (0.5 for sharp-edged inlet, 0.0 for fully flush connection).',
    ],
  ];
  for (const [q, a] of issues) {
    if (y > PH - 40) { newPage(); y = 30; }
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(210, 220, 230);
    const qLines = doc.splitTextToSize(q, TW - 8);
    const aLines = doc.splitTextToSize(a, TW - 8);
    const boxH = qLines.length * 5 + aLines.length * 4.5 + 10;
    doc.roundedRect(ML, y, TW, boxH, 2, 2, 'FD');
    doc.setFillColor(26, 115, 232);
    doc.roundedRect(ML, y, TW, qLines.length * 5 + 4, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(255, 255, 255);
    let qy = y + 5;
    for (const l of qLines) { doc.text(l, ML + 3, qy); qy += 5; }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(50, 70, 90);
    let ay = y + qLines.length * 5 + 7;
    for (const l of aLines) { doc.text(l, ML + 3, ay); ay += 4.5; }
    y += boxH + 3;
  }

  // ── Add page numbers to all pages after TOC ────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let p = 3; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(160, 170, 185);
    doc.text(`${p - 2}`, PW / 2, PH - 10, { align: 'center' });
    doc.text('WHAMO Network Designer — User Manual', ML, PH - 10);
    doc.text(`v1.0`, PW - MR, PH - 10, { align: 'right' });
    doc.setDrawColor(220, 230, 240);
    doc.setLineWidth(0.3);
    doc.line(ML, PH - 13, PW - MR, PH - 13);
  }

  doc.save('WHAMO_User_Manual.pdf');
}

// ─── Element visual SVGs ──────────────────────────────────────────────────────

// ─── Canvas-faithful element icon components (using actual project PNGs) ───────

/** Renders a node exactly as it appears on the WHAMO canvas (circle + icon + label). */
function CanvasCircleIcon({ icon, label, size = 120 }: { icon?: string; label: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: '3px solid #000', background: 'white',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 2, flexShrink: 0,
    }}>
      {icon && (
        <img src={icon} alt={label}
          style={{ width: size * 0.46, height: size * 0.46, objectFit: 'contain', pointerEvents: 'none' }} />
      )}
      <span style={{ fontSize: size * 0.19, fontWeight: 700, color: '#000', lineHeight: 1, whiteSpace: 'nowrap' }}>
        {label}
      </span>
    </div>
  );
}

function ReservoirSVG() { return <CanvasCircleIcon icon={damIcon} label="R1" />; }

function NodeSVG() {
  return (
    <div style={{
      width: 120, height: 120, borderRadius: '50%', border: '3px solid #000',
      background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ fontSize: 28, fontWeight: 700, color: '#000' }}>N1</span>
    </div>
  );
}

function JunctionSVG() { return <CanvasCircleIcon icon={yIntersectionIcon} label="J1" />; }
function SurgeTankSVG() { return <CanvasCircleIcon icon={waterTankIcon} label="ST1" />; }

function FlowBCSVG() {
  return (
    <div style={{
      padding: '16px 26px', border: '2px solid #000', borderRadius: 10,
      background: 'white', display: 'inline-flex', flexDirection: 'column',
      alignItems: 'center', gap: 6,
    }}>
      <img src={windIcon} alt="Flow BC" style={{ width: 54, height: 54, objectFit: 'contain' }} />
      <span style={{ fontSize: 20, fontWeight: 700, color: '#000', whiteSpace: 'nowrap' }}>Q1</span>
    </div>
  );
}

function ConduitSVG() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      <CanvasCircleIcon label="N1" size={72} />
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ width: 50, height: 3, background: '#64748b' }} />
        <div style={{ width: 0, height: 0, borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderLeft: '14px solid #64748b' }} />
      </div>
      <CanvasCircleIcon label="N2" size={72} />
    </div>
  );
}

function DummyPipeSVG() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      <CanvasCircleIcon label="N1" size={72} />
      <svg width="60" height="16" style={{ flexShrink: 0 }}>
        <line x1="0" y1="8" x2="46" y2="8" stroke="#94a3b8" strokeWidth="2.5" strokeDasharray="6,4" />
        <polygon points="40,3 40,13 54,8" fill="#94a3b8" />
      </svg>
      <CanvasCircleIcon icon={waterTankIcon} label="ST1" size={72} />
    </div>
  );
}

const ELEMENT_SVG_MAP: Record<string, React.ReactNode> = {
  reservoir:     <ReservoirSVG />,
  node:          <NodeSVG />,
  junction:      <JunctionSVG />,
  'surge-tank':  <SurgeTankSVG />,
  'flow-bc':     <FlowBCSVG />,
  conduit:       <ConduitSVG />,
  'dummy-pipe':  <DummyPipeSVG />,
};

function ElementVisualCard({ id, label }: { id: string; label: string }) {
  const visual = ELEMENT_SVG_MAP[id];
  if (!visual) return null;
  return (
    <div className="flex flex-col items-center gap-1.5 mb-4 p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="w-16 h-12 flex items-center justify-center">
        {visual}
      </div>
      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{label} — Canvas Appearance</span>
    </div>
  );
}

// ─── Connection diagram — div-based, using actual project PNG icons ────────────

/** Small canvas-style node for use inside connection diagrams. */
function DiagNode({ icon, label, diamond, size = 70 }: {
  icon?: string; label: string; diamond?: boolean; size?: number;
}) {
  if (diamond) {
    return (
      <div style={{ width: size, height: size, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <div style={{ width: size * 0.72, height: size * 0.72, background: '#16a34a', border: '2px solid #166534', borderRadius: 3, transform: 'rotate(45deg)', position: 'absolute' }} />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {icon && <img src={icon} alt={label} style={{ width: size * 0.36, height: size * 0.36, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />}
          <span style={{ fontSize: size * 0.2, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{label}</span>
        </div>
      </div>
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', border: '2px solid #000',
      background: 'white', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 1, flexShrink: 0,
    }}>
      {icon && <img src={icon} alt={label} style={{ width: size * 0.46, height: size * 0.46, objectFit: 'contain' }} />}
      <span style={{ fontSize: size * 0.22, fontWeight: 700, color: '#000', lineHeight: 1, whiteSpace: 'nowrap' }}>{label}</span>
    </div>
  );
}

/** Rectangular Flow BC node for connection diagrams. */
function DiagFlowBC({ label = 'Q1', size = 70 }: { label?: string; size?: number }) {
  return (
    <div style={{
      padding: '8px 16px', border: '2px solid #000', borderRadius: 6,
      background: 'white', display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: 3, flexShrink: 0,
    }}>
      <img src={windIcon} alt="Flow BC" style={{ width: size * 0.5, height: size * 0.5, objectFit: 'contain' }} />
      <span style={{ fontSize: size * 0.22, fontWeight: 700, color: '#000', lineHeight: 1 }}>{label}</span>
    </div>
  );
}

/** Arrow connector between nodes in a diagram. */
function DiagArrow({ dashed = false }: { dashed?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0, margin: '0 4px' }}>
      {dashed
        ? <svg width="50" height="4" style={{ display: 'block' }}><line x1="0" y1="2" x2="42" y2="2" stroke="#64748b" strokeWidth="2.5" strokeDasharray="6,4"/><polygon points="38,0 38,4 48,2" fill="#64748b"/></svg>
        : <><div style={{ width: 42, height: 2.5, background: '#64748b' }} /><div style={{ width: 0, height: 0, borderTop: '6px solid transparent', borderBottom: '6px solid transparent', borderLeft: '9px solid #64748b' }} /></>
      }
    </div>
  );
}

/** Row layout for a connection diagram. */
function DiagRow({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', alignItems: 'center', gap: 0, justifyContent: 'center' }}>{children}</div>;
}

function ConnectionDiagramSVG({ type }: { type: string }) {
  if (type === 'conduit') return (
    <DiagRow>
      <DiagNode icon={damIcon} label="R1" />
      <DiagArrow />
      <DiagNode label="N1" />
      <DiagArrow />
      <DiagNode label="N2" />
    </DiagRow>
  );
  if (type === 'dummy-pipe') return (
    <DiagRow>
      <DiagNode label="N1" />
      <DiagArrow dashed />
      <DiagNode icon={waterTankIcon} label="ST1" />
    </DiagRow>
  );
  if (type === 'reservoir-conn') return (
    <DiagRow>
      <DiagNode icon={damIcon} label="R1" />
      <DiagArrow />
      <DiagNode label="N1" />
      <DiagArrow />
      <DiagNode label="N2" />
    </DiagRow>
  );
  if (type === 'surge-tank-conn') return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <DiagNode icon={waterTankIcon} label="ST1" size={62} />
      <div style={{ width: 2.5, height: 14, background: '#64748b' }} />
      <DiagRow>
        <DiagNode label="N1" size={62} />
        <DiagArrow />
        <DiagNode label="N2" size={62} />
        <DiagArrow />
        <DiagNode label="N3" size={62} />
      </DiagRow>
    </div>
  );
  if (type === 'flow-bc-conn') return (
    <DiagRow>
      <DiagNode label="N1" />
      <DiagArrow />
      <DiagFlowBC />
    </DiagRow>
  );
  // default fallback
  return (
    <DiagRow>
      <DiagNode label="N1" />
      <DiagArrow />
      <DiagNode label="N2" />
    </DiagRow>
  );
}

function ConnectionDiagramCard({ type, label }: { type: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 mb-4 p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="w-full h-14 flex items-center justify-center">
        <ConnectionDiagramSVG type={type} />
      </div>
      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{label} — Connection Diagram</span>
    </div>
  );
}

// ─── UI helper components ─────────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[18px] font-bold text-slate-900 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
      {children}
    </h2>
  );
}

function SectionLead({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[13px] text-slate-500 mb-5 leading-relaxed" style={{ fontFamily: 'Poppins, sans-serif' }}>
      {children}
    </p>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[13px] font-bold text-slate-800 mt-5 mb-1.5" style={{ fontFamily: 'Poppins, sans-serif' }}>
      {children}
    </h3>
  );
}

function MiniHeading({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-[11px] font-bold text-blue-700 mt-3 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
      {children}
    </h4>
  );
}

function Para({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[13px] text-slate-600 leading-relaxed mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
      {children}
    </p>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mb-3">
      <span className="text-blue-500 flex-shrink-0 mt-0.5">ℹ</span>
      <p className="text-[12px] text-blue-800 leading-relaxed" style={{ fontFamily: 'Poppins, sans-serif' }}>
        {children}
      </p>
    </div>
  );
}

function Warn({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
      <span className="text-amber-500 flex-shrink-0 mt-0.5">⚠</span>
      <p className="text-[12px] text-amber-900 leading-relaxed" style={{ fontFamily: 'Poppins, sans-serif' }}>
        {children}
      </p>
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="list-none space-y-1 mb-3">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2">
          <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-blue-500 mt-2" />
          <p className="text-[12px] text-slate-600 leading-relaxed" style={{ fontFamily: 'Poppins, sans-serif' }}>{item}</p>
        </li>
      ))}
    </ul>
  );
}

function PropTable({ rows }: { rows: Array<[string, string]> }) {
  return (
    <div className="rounded-lg border border-slate-200 overflow-hidden mb-3">
      {rows.map(([k, v], i) => (
        <div key={i} className={cn('grid grid-cols-[160px_1fr] text-[11px]', i % 2 === 0 ? 'bg-slate-50' : 'bg-white')}>
          <div className="px-2.5 py-2 font-bold text-blue-700 border-r border-slate-200" style={{ fontFamily: 'Poppins, sans-serif' }}>{k}</div>
          <div className="px-2.5 py-2 text-slate-600" style={{ fontFamily: 'Poppins, sans-serif' }}>{v}</div>
        </div>
      ))}
    </div>
  );
}

function ElementCard({ name, badge, desc, fields }: { name: string; badge: string; desc: string; fields?: string[] }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white mb-3 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border-b border-slate-200">
        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', badge)}>{name}</span>
        <p className="text-[12px] text-slate-600" style={{ fontFamily: 'Poppins, sans-serif' }}>{desc}</p>
      </div>
      {fields && fields.length > 0 && (
        <div className="px-3 py-2 flex flex-wrap gap-1.5">
          {fields.map(f => (
            <span key={f} className="text-[10px] font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">{f}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function KbRow({ keys, action }: { keys: string[]; action: string }) {
  return (
    <tr className="border-b border-slate-100">
      <td className="py-2 pr-4">
        <div className="flex items-center gap-1">
          {keys.map((k, i) => (
            <span key={i}>
              <kbd className="inline-block px-1.5 py-0.5 text-[11px] font-mono bg-slate-100 border border-slate-300 rounded shadow-sm">{k}</kbd>
              {i < keys.length - 1 && <span className="text-slate-400 text-[11px] mx-0.5">+</span>}
            </span>
          ))}
        </div>
      </td>
      <td className="py-2 text-[12px] text-slate-600" style={{ fontFamily: 'Poppins, sans-serif' }}>{action}</td>
    </tr>
  );
}

function StepList({ steps }: { steps: string[] }) {
  return (
    <ol className="list-none space-y-1.5 mb-3">
      {steps.map((s, i) => (
        <li key={i} className="flex items-start gap-2">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#1a73e8] text-white text-[10px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
          <p className="text-[13px] text-slate-600 leading-relaxed" style={{ fontFamily: 'Poppins, sans-serif' }}>{s}</p>
        </li>
      ))}
    </ol>
  );
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: Array<{ value: string; label: string }>; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide" style={{ fontFamily: 'Poppins, sans-serif' }}>{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="appearance-none pl-2.5 pr-7 py-1.5 text-[12px] font-medium bg-white border border-slate-200 rounded-lg text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/30 shadow-sm"
          style={{ fontFamily: 'Poppins, sans-serif' }}
          data-testid="help-element-filter"
        >
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );
}

// Detailed element doc block
function ElementDoc({
  name, badge, description, purpose, howToAdd, properties, bestPractices, commonMistakes, warnings, validationRules,
}: {
  name: string;
  badge: string;
  description: string;
  purpose: string[];
  howToAdd: string[];
  properties: Array<[string, string]>;
  bestPractices: string[];
  commonMistakes: string[];
  warnings: string[];
  validationRules: string[];
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-xl border border-slate-200 bg-white mb-4 overflow-hidden shadow-sm">
      <button
        className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 border-b border-slate-200 hover:bg-slate-100 transition-colors text-left"
        onClick={() => setOpen(o => !o)}
        data-testid={`element-doc-${name.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <span className={cn('text-[11px] font-bold px-2.5 py-1 rounded-full flex-shrink-0', badge)}>{name}</span>
        <p className="text-[12px] text-slate-600 flex-1" style={{ fontFamily: 'Poppins, sans-serif' }}>{description}</p>
        <ChevronDown className={cn('w-4 h-4 text-slate-400 flex-shrink-0 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="px-4 pt-3 pb-4">
          {(() => {
            const svgKey = name.toLowerCase().replace(/\s*\(.*?\)/g, '').replace(/\s+/g, '-').trim();
            const visual = ELEMENT_SVG_MAP[svgKey];
            return visual ? (
              <div className="float-right ml-6 mb-4 flex flex-col items-center gap-3 p-6 bg-white rounded-2xl border-2 border-slate-200 shadow-md" style={{ minWidth: 190 }}>
                <div className="flex items-center justify-center" style={{ minHeight: 130 }}>
                  {visual}
                </div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Canvas Icon</span>
              </div>
            ) : null;
          })()}
          <MiniHeading>Purpose & When to Use</MiniHeading>
          <BulletList items={purpose} />
          <div style={{ clear: 'both' }} />
          <MiniHeading>How to Add</MiniHeading>
          <StepList steps={howToAdd} />
          <MiniHeading>Properties</MiniHeading>
          <PropTable rows={properties} />
          {bestPractices.length > 0 && (
            <>
              <MiniHeading>Best Practices</MiniHeading>
              <BulletList items={bestPractices} />
            </>
          )}
          {warnings.length > 0 && warnings.map((w, i) => <Warn key={i}>{w}</Warn>)}
          {validationRules.length > 0 && (
            <>
              <MiniHeading>Validation Rules & Errors</MiniHeading>
              <BulletList items={validationRules} />
            </>
          )}
          {commonMistakes.length > 0 && (
            <>
              <MiniHeading>Common Mistakes</MiniHeading>
              <BulletList items={commonMistakes} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Detailed connection doc block
function ConnectionDoc({
  name, description, howToDraw, validConnections, invalidConnections, properties, warnings, troubleshooting,
}: {
  name: string;
  description: string;
  howToDraw: string[];
  validConnections: string[];
  invalidConnections: string[];
  properties: Array<[string, string]>;
  warnings: string[];
  troubleshooting: string[];
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-xl border border-slate-200 bg-white mb-4 overflow-hidden shadow-sm">
      <button
        className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 border-b border-slate-200 hover:bg-slate-100 transition-colors text-left"
        onClick={() => setOpen(o => !o)}
        data-testid={`connection-doc-${name.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 flex-shrink-0">{name}</span>
        <p className="text-[12px] text-slate-600 flex-1" style={{ fontFamily: 'Poppins, sans-serif' }}>{description}</p>
        <ChevronDown className={cn('w-4 h-4 text-slate-400 flex-shrink-0 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="px-4 pt-3 pb-4">
          <div className="mb-4 p-5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center" style={{ minHeight: 140 }}>
            <ConnectionDiagramSVG type={name.toLowerCase().replace(/\s+/g, '-')} />
          </div>
          <MiniHeading>How to Draw</MiniHeading>
          <StepList steps={howToDraw} />
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <MiniHeading>Valid Connections</MiniHeading>
              <BulletList items={validConnections} />
            </div>
            <div>
              <MiniHeading>Invalid Connections</MiniHeading>
              <BulletList items={invalidConnections} />
            </div>
          </div>
          {properties.length > 0 && (
            <>
              <MiniHeading>Required Properties</MiniHeading>
              <PropTable rows={properties} />
            </>
          )}
          {warnings.map((w, i) => <Warn key={i}>{w}</Warn>)}
          {troubleshooting.length > 0 && (
            <>
              <MiniHeading>Troubleshooting</MiniHeading>
              <BulletList items={troubleshooting} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Section content ──────────────────────────────────────────────────────────

function GettingStarted() {
  return (
    <>
      <SectionTitle>Getting Started</SectionTitle>
      <SectionLead>WHAMO Network Designer lets you visually build water distribution networks and export them for hydraulic simulation using the WHAMO engine.</SectionLead>

      <SubHeading>Creating a New Project</SubHeading>
      <StepList steps={[
        'Click New in the title bar to create a blank project.',
        'Enter a project name in the centre field of the title bar.',
        'Add elements using the INSERT ribbon (Reservoir, Node, Junction, etc.).',
        'Connect elements by hovering a node until the green handle appears, then dragging to another node.',
        'Click Save As to persist the project to the server.',
      ]} />

      <SubHeading>Opening an Existing Project</SubHeading>
      <StepList steps={[
        'Click Open in the title bar.',
        'Select a project from the Projects list panel.',
        'The canvas, properties, and all settings are restored automatically.',
      ]} />

      <SubHeading>Saving</SubHeading>
      <Para>Use <strong>Save</strong> to overwrite the current project, or <strong>Save As</strong> to create a new revision. Projects are stored on the server and remain available after logging out.</Para>

      <Note>All element property changes are tracked with Undo/Redo (up to 50 steps). Use <strong>Ctrl+Z</strong> and <strong>Ctrl+Y</strong> to navigate the history.</Note>
    </>
  );
}

const ELEMENT_OPTIONS = [
  { value: 'all', label: 'All Elements' },
  { value: 'reservoir', label: 'Reservoir' },
  { value: 'node', label: 'Node' },
  { value: 'junction', label: 'Junction' },
  { value: 'surge-tank', label: 'Surge Tank' },
  { value: 'flow-bc', label: 'Flow BC' },
  { value: 'conduit', label: 'Conduit' },
  { value: 'dummy-pipe', label: 'Dummy Pipe' },
];

const ELEMENT_DATA = [
  {
    id: 'reservoir',
    name: 'Reservoir',
    badge: 'bg-blue-600 text-white',
    description: 'Fixed or schedule-driven hydraulic boundary. Provides a constant or time-varying head.',
    purpose: [
      'Use at the upstream or downstream end of a pipeline where the head is known or prescribed.',
      'Represents large storage tanks, impoundments, lakes, or any boundary where head is controlled.',
      'Every valid WHAMO network must contain at least one Reservoir as the head boundary condition.',
    ],
    howToAdd: [
      'Click the Reservoir button in the INSERT ribbon.',
      'A Reservoir node appears on the canvas.',
      'Click the node and edit its properties in the right-hand Properties Panel.',
      'Draw conduits from the Reservoir to connect it to the rest of the network.',
    ],
    properties: [
      ['Label', 'Unique identifier for this element (required, case-sensitive).'],
      ['Elevation (m/ft)', 'Hydraulic head at this boundary. In Fixed mode = constant head; in Schedule mode = initial head.'],
      ['Mode', 'Fixed: constant head throughout simulation. Schedule: head varies with time per H-Schedule.'],
      ['H-Schedule #', 'Reference number for a T-H (time/head) schedule. Active only when Mode = Schedule.'],
      ['Loss Coefficient', 'Minor loss coefficient at the reservoir connection (typically 0.5 for sharp-edged inlet).'],
    ] as Array<[string, string]>,
    bestPractices: [
      'Set the elevation to the steady-state water surface elevation at the start of simulation.',
      'For time-varying reservoirs (tidal boundaries, dam drawdown), use Schedule mode with a well-defined H-Schedule.',
      'Keep loss coefficient between 0 (perfectly rounded inlet) and 1 (sudden contraction).',
    ],
    commonMistakes: [
      'Leaving the Reservoir isolated (no connected conduits) — this fails validation.',
      'Directly connecting two Reservoirs without an intermediate Node or conduit.',
      'Setting a very high loss coefficient (> 1) for normal inlet conditions.',
    ],
    warnings: [
      'A Reservoir directly connected to another Reservoir is invalid — place a Node between them.',
    ],
    validationRules: [
      'Must have at least one conduit connection.',
      'Elevation must be a valid number (not empty).',
      'H-Schedule # must reference a defined schedule when Mode = Schedule.',
    ],
  },
  {
    id: 'node',
    name: 'Node',
    badge: 'bg-slate-600 text-white',
    description: 'Basic junction point in the network. Used wherever pipes meet without special behaviour.',
    purpose: [
      'Use wherever two or more conduits join with no demand flow or boundary condition.',
      'Ideal for pipe tee junctions that are topological only.',
      'Can serve as intermediate points along a long pipeline to create computational segments.',
    ],
    howToAdd: [
      'Click the Node button in the INSERT ribbon.',
      'A Node appears on the canvas.',
      'Connect conduits to the Node from other elements.',
      'Set Elevation in the Properties Panel.',
    ],
    properties: [
      ['Label', 'Unique identifier (required).'],
      ['Elevation (m/ft)', 'Elevation of the node used for pressure and HGL calculations.'],
      ['Node Number', 'Auto-assigned internal WHAMO number. Editable if required.'],
    ] as Array<[string, string]>,
    bestPractices: [
      'Use Nodes rather than Junctions where no demand exists to keep the model simple.',
      'Place Nodes at significant elevation changes along a pipeline for accurate pressure profiling.',
    ],
    commonMistakes: [
      'Leaving a Node with no connections — isolated nodes fail validation.',
      'Using Junction when no demand is needed (functional, but adds unnecessary complexity).',
    ],
    warnings: [],
    validationRules: [
      'Must have at least one conduit connection to be valid.',
      'Elevation must be a valid numeric value.',
    ],
  },
  {
    id: 'junction',
    name: 'Junction',
    badge: 'bg-emerald-600 text-white',
    description: 'Demand or tee junction with optional demand flow. Use for lateral off-takes.',
    purpose: [
      'Use wherever a customer demand, off-take, or consumer draw is modelled.',
      'Use for tee junctions where a side branch carries a known demand flow.',
      'Demand may be zero, making Junction functionally equivalent to Node.',
    ],
    howToAdd: [
      'Click the Junction button in the INSERT ribbon.',
      'Place the Junction on the canvas and connect conduits to it.',
      'Set Elevation and Demand in the Properties Panel.',
    ],
    properties: [
      ['Label', 'Unique identifier (required).'],
      ['Elevation', 'Node elevation for HGL and pressure calculations.'],
      ['Demand (m³/s or ft³/s)', 'Steady-state demand flow extracted at this junction. Positive = extraction from network.'],
    ] as Array<[string, string]>,
    bestPractices: [
      'Set demand to the average steady-state withdrawal rate for the consumer served by this junction.',
      'For time-varying demands, use a Flow BC element instead of a Junction demand.',
    ],
    commonMistakes: [
      'Setting a negative demand (supply into network) — use Flow BC for that purpose instead.',
      'Forgetting to set demand when modelling off-takes, leaving it at zero.',
    ],
    warnings: [],
    validationRules: [
      'Must have at least one conduit connection.',
      'Demand must be a non-negative number (zero is valid).',
    ],
  },
  {
    id: 'surge-tank',
    name: 'Surge Tank',
    badge: 'bg-purple-600 text-white',
    description: 'Open or closed surge vessel. Models water-hammer suppression chambers.',
    purpose: [
      'Install near vulnerable pipeline sections to suppress water-hammer pressure fluctuations.',
      'Open tank: water surface vents to atmosphere — models simple standpipes.',
      'Closed tank (air vessel): uses E/A pairs to define a pressurised cushion.',
      'Use wherever significant water-hammer risk exists, such as rapid flow changes.',
    ],
    howToAdd: [
      'Click the Surge Tank button in the INSERT ribbon.',
      'Place the Surge Tank near the section it is intended to protect.',
      'Connect it to the main pipeline via a short conduit or Dummy Pipe.',
      'Set Tank Top, Tank Bottom, Initial Water Level, and Riser Diameter in Properties Panel.',
    ],
    properties: [
      ['Label', 'Unique identifier (required).'],
      ['Tank Top', 'Maximum water level elevation (overflow level).'],
      ['Tank Bottom', 'Minimum water level (empty tank elevation).'],
      ['Initial Water Level', 'Water surface elevation at t = 0. Must be between Tank Bottom and Tank Top.'],
      ['Riser Diameter', 'Diameter of the connection pipe between tank and main pipeline.'],
      ['Area/Shape (E/A pairs)', 'Elevation-area pairs for non-prismatic closed tanks.'],
    ] as Array<[string, string]>,
    bestPractices: [
      'Size the tank to handle the full transient volume exchange without emptying or overflowing.',
      'Place the surge tank as close as possible (physically) to the protected equipment.',
      'Use a Dummy Pipe for the connection when the riser length is negligible.',
    ],
    commonMistakes: [
      'Setting Initial Water Level outside the Tank Bottom–Top range causes immediate simulation failure.',
      'Connecting Surge Tank to two pipeline nodes (it is a side-branch, not a through element).',
      'Not setting Riser Diameter — defaults to zero which prevents flow exchange.',
    ],
    warnings: [
      'Surge tanks are modelled as infinite-celerity elements in WHAMO. Do not manually adjust celerity on surge tank conduit connections.',
      'Tank Bottom must be less than Tank Top. Initial Water Level must be between these limits.',
    ],
    validationRules: [
      'Tank Bottom < Initial Water Level < Tank Top.',
      'Riser Diameter must be > 0.',
      'Surge Tank must have exactly one conduit connection (side-branch only).',
    ],
  },
  {
    id: 'flow-bc',
    name: 'Flow BC',
    badge: 'bg-orange-600 text-white',
    description: 'Flow boundary condition. Injects or extracts a prescribed flow rate, optionally time-varying.',
    purpose: [
      'Model inflow from an external source not represented by another boundary element.',
      'Model controlled extraction (irrigation, industrial withdrawal) that varies with time.',
      'Simulate demand fluctuations, operational scenarios, or emergency shut-offs.',
    ],
    howToAdd: [
      'Click the Flow BC button in the INSERT ribbon.',
      'Place the element and connect it to the target Node or Junction.',
      'Set Flow Rate, Mode, and Q-Schedule if time-varying in the Properties Panel.',
    ],
    properties: [
      ['Label', 'Unique identifier (required).'],
      ['Flow Rate (Q)', 'Prescribed flow rate (m³/s or ft³/s). Positive = injection; negative = extraction.'],
      ['Mode', 'Fixed: constant flow. Schedule: flow varies with time per Q-Schedule.'],
      ['Q-Schedule #', 'Reference to a T-Q (time/flow) schedule. Active when Mode = Schedule.'],
    ] as Array<[string, string]>,
    bestPractices: [
      'Use positive Q for injection (inflow) and negative Q for extraction (withdrawal).',
      'For systems with a known variable inflow, use Schedule mode with measured data.',
    ],
    commonMistakes: [
      'Confusing Flow BC (prescribes Q) with Reservoir (prescribes head) — using the wrong type gives incorrect boundary conditions.',
      'Setting Q-Schedule # without switching Mode to Schedule.',
    ],
    warnings: [
      'Do not use Flow BC and Reservoir at the same network endpoint — only one boundary condition type per location.',
    ],
    validationRules: [
      'Flow Rate must be a valid number (positive or negative).',
      'Q-Schedule # must reference a defined schedule when Mode = Schedule.',
      'Must have at least one conduit connection.',
    ],
  },
  {
    id: 'conduit',
    name: 'Conduit (Pipe)',
    badge: 'bg-slate-500 text-white',
    description: 'Fundamental flow-carrying element linking any two connected nodes.',
    purpose: [
      'Every connection between two network elements is a conduit.',
      'Carries both steady-state and transient flow between nodes.',
      'The Courant condition (DTCOMP × celerity / length ≤ 1) must be satisfied.',
    ],
    howToAdd: [
      'Hover over a source element until the green connection handle appears.',
      'Click and drag from the handle to the target element.',
      'Release the mouse over the target — a conduit is created automatically.',
      'Select the conduit in the Flex Table (Conduit tab) to set hydraulic properties.',
    ],
    properties: [
      ['Length (L)', 'Physical pipe length in m or ft. Must be > 0.'],
      ['Diameter (D)', 'Internal pipe diameter in m or ft. Must be > 0.'],
      ['Celerity (a)', 'Pressure-wave speed in m/s or ft/s. Typically 800–1400 m/s for steel.'],
      ['Friction (f)', "Darcy-Weisbach friction factor or Manning's n."],
      ['Pipe Material', "Auto-fills Manning's n, Young's Modulus (E), and computes wave speed."],
      ['Has Added Loss', 'Enables a minor-loss coefficient (K) for fittings, bends, etc.'],
    ] as Array<[string, string]>,
    bestPractices: [
      'Verify that DTCOMP × celerity / length ≤ 1 for all conduits before running simulations.',
      'Use the Pipe Material selector to auto-calculate celerity rather than entering it manually.',
      'Avoid very short conduits (< 1 m) in production networks — they require very small DTCOMP values.',
    ],
    commonMistakes: [
      'Leaving Length, Diameter, or Celerity at zero — simulation fails validation.',
      'Violating the Courant condition (DTCOMP × a / L > 1) — produces incorrect results.',
    ],
    warnings: [
      'Courant condition: DTCOMP × celerity / Length must be ≤ 1.0. Violating this causes numerical instability and incorrect simulation results.',
    ],
    validationRules: [
      'Length > 0, Diameter > 0, Celerity > 0.',
      'Must connect exactly two nodes.',
      'Courant number ≤ 1 must be satisfied.',
    ],
  },
  {
    id: 'dummy-pipe',
    name: 'Dummy Pipe',
    badge: 'bg-slate-400 text-white',
    description: 'Zero-resistance conduit for very short connections or topological splits.',
    purpose: [
      'Connect a Surge Tank to the main pipeline when riser length is negligible.',
      'Split a conduit into computational segments without adding physical resistance.',
      'Represent instantaneous connections (e.g., two tanks sharing a common wall).',
    ],
    howToAdd: [
      'Click the Dummy Pipe button in the INSERT ribbon to activate dummy pipe mode.',
      'Drag from the source to the target node.',
      'Set a very small Length (e.g., 0.001 m) and high Celerity (e.g., 9999 m/s).',
    ],
    properties: [
      ['Length (L)', 'Typically 0.001 m or similar negligible value.'],
      ['Diameter (D)', 'Should match the connecting pipe diameter for continuity.'],
      ['Celerity (a)', 'Set to high value (e.g., 9999 m/s) to represent rigid-column behaviour.'],
    ] as Array<[string, string]>,
    bestPractices: [
      'Use Dummy Pipes only for genuinely negligible connections — not for convenience.',
      'Keep Dummy Pipe length realistic (not exactly zero, which causes division errors).',
    ],
    commonMistakes: [
      'Setting Length to exactly 0 — causes division by zero in wave speed calculations.',
      'Using Dummy Pipes for long connections where pipe hydraulics matter.',
    ],
    warnings: [],
    validationRules: [
      'Length must be a small positive value (> 0, not exactly zero).',
      'Celerity must be > 0.',
    ],
  },
];

function NetworkElements() {
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? ELEMENT_DATA : ELEMENT_DATA.filter(e => e.id === filter);

  return (
    <>
      <SectionTitle>Network Elements</SectionTitle>
      <SectionLead>Each element in WHAMO represents a physical hydraulic component. Click any INSERT ribbon button to add an element to the canvas.</SectionLead>

      <FilterSelect
        label="Filter:"
        value={filter}
        options={ELEMENT_OPTIONS}
        onChange={setFilter}
      />

      {filtered.map(el => (
        <ElementDoc key={el.id} {...el} />
      ))}
    </>
  );
}

const CONNECTION_OPTIONS = [
  { value: 'all', label: 'All Connections' },
  { value: 'conduit', label: 'Standard Conduit' },
  { value: 'dummy-pipe', label: 'Dummy Pipe' },
  { value: 'reservoir-conn', label: 'Reservoir Connections' },
  { value: 'surge-tank-conn', label: 'Surge Tank Connections' },
  { value: 'flow-bc-conn', label: 'Flow BC Connections' },
];

const CONNECTION_DATA = [
  {
    id: 'conduit',
    name: 'Standard Conduit',
    description: 'Regular pipe linking any two network nodes. Carries steady-state and transient flow.',
    howToDraw: [
      'Hover over a source element until the green connection handle appears on its edge.',
      'Click and drag from the handle to the target element.',
      'Release over the target — a conduit is created automatically.',
      'Open the Flex Table (Conduit tab) and set Length, Diameter, and Celerity.',
    ],
    validConnections: [
      'Reservoir → Node',
      'Reservoir → Junction',
      'Node → Node',
      'Node → Junction',
      'Junction → Junction',
      'Node → Surge Tank',
      'Junction → Surge Tank',
      'Node → Flow BC',
    ],
    invalidConnections: [
      'Reservoir → Reservoir directly',
      'Self-loop (element to itself)',
      'Surge Tank → Surge Tank',
    ],
    properties: [
      ['Length (L)', 'Physical pipe length in m or ft. Must be > 0.'],
      ['Diameter (D)', 'Internal pipe diameter in m or ft. Must be > 0.'],
      ['Celerity (a)', 'Pressure-wave speed (m/s or ft/s).'],
      ['Friction (f)', "Darcy-Weisbach or Manning's friction factor."],
      ['Material', 'Auto-fills friction, E, and celerity when selected.'],
    ] as Array<[string, string]>,
    warnings: [
      'Every conduit must have non-zero Length, Diameter, and Celerity before running a simulation. Missing values cause validation failure.',
      'Courant condition: DTCOMP × celerity / length ≤ 1 must be met for numerical stability.',
    ],
    troubleshooting: [
      'Conduit appears disconnected: check that both endpoints snapped to element handles (green dots).',
      'Simulation fails with "zero-length pipe": set Length to a positive non-zero value in the Flex Table.',
      'Very high celerity values: verify Pipe Material selection — some materials produce unrealistically high wave speeds for thin-walled pipes.',
    ],
  },
  {
    id: 'dummy-pipe',
    name: 'Dummy Pipe',
    description: 'Zero-resistance topological connector for very short or negligible connections.',
    howToDraw: [
      'Click the Dummy Pipe button in the INSERT ribbon to activate dummy pipe mode.',
      'Drag from source element to target element.',
      'Set Length to a very small positive value (e.g., 0.001 m) and Celerity to 9999 m/s.',
      'Click Dummy Pipe button again to deactivate mode.',
    ],
    validConnections: [
      'Node → Surge Tank (short riser)',
      'Junction → Surge Tank (short riser)',
      'Node → Node (topological split)',
    ],
    invalidConnections: [
      'Long pipe sections (use standard conduit instead)',
      'Reservoir → Surge Tank (should go through a node)',
    ],
    properties: [
      ['Length (L)', 'Very small positive value (e.g., 0.001 m). Must not be exactly zero.'],
      ['Diameter (D)', 'Match to connecting pipe diameter for flow continuity.'],
      ['Celerity (a)', 'High value (e.g., 9999 m/s) for rigid-column behaviour.'],
    ] as Array<[string, string]>,
    warnings: [
      'Never set Dummy Pipe Length to exactly 0.0 — this causes a division-by-zero in wave speed calculations.',
    ],
    troubleshooting: [
      'Simulation crash at Dummy Pipe: check that Length is a small positive number, not zero.',
      'Unexpected pressure drop through dummy pipe: ensure friction factor is set to 0 or very small.',
    ],
  },
  {
    id: 'reservoir-conn',
    name: 'Reservoir Connections',
    description: 'How Reservoirs connect to the rest of the network via conduits.',
    howToDraw: [
      'Draw a standard conduit from the Reservoir handle to any target node (Node, Junction).',
      'Set Length, Diameter, and Celerity on the resulting conduit.',
      'Set the Loss Coefficient on the Reservoir to model inlet/outlet losses.',
    ],
    validConnections: [
      'Reservoir → Node',
      'Reservoir → Junction',
      'Reservoir → Flow BC (unusual but valid)',
      'Multiple conduits from a single Reservoir (branching)',
    ],
    invalidConnections: [
      'Reservoir → Reservoir directly (place a Node between them)',
      'Reservoir → Surge Tank directly (use an intermediate Node)',
      'Reservoir self-loop',
    ],
    properties: [
      ['Loss Coefficient', 'Applied at the Reservoir boundary to all connecting conduits.'],
    ] as Array<[string, string]>,
    warnings: [
      'Every WHAMO network must have at least one Reservoir. Without a head boundary, the steady-state system cannot be solved.',
      'Directly connecting two Reservoirs produces an over-specified system — always place an intermediate Node.',
    ],
    troubleshooting: [
      'Validation error "no head boundary": make sure at least one Reservoir exists and is connected.',
      'Head at reservoir junction looks wrong: check Loss Coefficient setting on the Reservoir.',
    ],
  },
  {
    id: 'surge-tank-conn',
    name: 'Surge Tank Connections',
    description: 'How Surge Tanks connect as side-branch vessels to the main pipeline.',
    howToDraw: [
      'Draw a conduit (or Dummy Pipe) from the main pipeline Node to the Surge Tank.',
      'Set a small Riser Diameter on the Surge Tank for restricted inlet.',
      'Verify that Tank Bottom < Initial Level < Tank Top.',
    ],
    validConnections: [
      'Node → Surge Tank',
      'Junction → Surge Tank',
    ],
    invalidConnections: [
      'Reservoir → Surge Tank directly',
      'Surge Tank → Surge Tank',
      'Surge Tank with two pipeline connections (side-branch only)',
    ],
    properties: [
      ['Riser Diameter', 'Controls flow exchange rate between tank and main pipe. Must be > 0.'],
    ] as Array<[string, string]>,
    warnings: [
      'A Surge Tank must have exactly ONE conduit connection. Connecting it between two pipeline nodes as a through-element is invalid.',
      'Surge tanks have infinite celerity in WHAMO — do not try to manually set celerity on the connecting conduit.',
    ],
    troubleshooting: [
      'Surge tank has no effect on transient: check that Riser Diameter is set correctly and tank is near the protected element.',
      'Validation error on tank: ensure Tank Bottom < Initial Level < Tank Top.',
    ],
  },
  {
    id: 'flow-bc-conn',
    name: 'Flow BC Connections',
    description: 'How Flow Boundary Conditions inject or extract flow at a specific network point.',
    howToDraw: [
      'Draw a conduit from the target Node or Junction to the Flow BC element.',
      'Set the Flow Rate and Mode in the Properties Panel.',
      'If using Schedule mode, define Q-Schedule pairs.',
    ],
    validConnections: [
      'Node → Flow BC',
      'Junction → Flow BC',
    ],
    invalidConnections: [
      'Reservoir → Flow BC at same location (conflicting boundary types)',
      'Flow BC with multiple conduit connections (typically only one)',
    ],
    properties: [
      ['Flow Rate (Q)', 'Positive = injection into network; negative = extraction.'],
      ['Mode', 'Fixed or Schedule.'],
    ] as Array<[string, string]>,
    warnings: [
      'Do not place a Flow BC and a Reservoir at the same network node — conflicting boundary conditions will produce incorrect results.',
    ],
    troubleshooting: [
      'Unexpected flow imbalance: verify that Flow BC Q sign is correct (positive for inflow, negative for extraction).',
      'Schedule flow not varying: ensure Mode is set to Schedule and Q-Schedule pairs are defined.',
    ],
  },
];

function Connections() {
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? CONNECTION_DATA : CONNECTION_DATA.filter(c => c.id === filter);

  return (
    <>
      <SectionTitle>Connections</SectionTitle>
      <SectionLead>Every pair of connected elements is linked by a conduit. Drawing and editing conduits is the primary way to build your network topology.</SectionLead>

      <FilterSelect
        label="Filter:"
        value={filter}
        options={CONNECTION_OPTIONS}
        onChange={setFilter}
      />

      {filtered.map(conn => (
        <ConnectionDoc key={conn.id} {...conn} />
      ))}
    </>
  );
}

function FlexTableSection() {
  return (
    <>
      <SectionTitle>Flex Table</SectionTitle>
      <SectionLead>The Flex Table gives you a spreadsheet-like view of every element in the network. Open it from Tools → Flex Table in the ribbon.</SectionLead>

      <SubHeading>Tab Filters</SubHeading>
      <Para>Use the filter chips at the top to switch between supported element types.</Para>

      <SubHeading>Editing Cells</SubHeading>
      <Para>Click any white cell to edit it inline. Cells with a grey background are read-only for that element type. Press <kbd className="px-1 py-0.5 text-[11px] font-mono bg-slate-100 border border-slate-300 rounded shadow-sm">Tab</kbd> or <kbd className="px-1 py-0.5 text-[11px] font-mono bg-slate-100 border border-slate-300 rounded shadow-sm">Enter</kbd> to commit a change.</Para>

      <SubHeading>Unit System</SubHeading>
      <Para>The SI / FPS toggle controls the global display unit. Individual rows can override this via the <strong>Unit</strong> column — an amber border indicates a per-element override.</Para>

      <SubHeading>T/H and Q Schedule Pairs</SubHeading>
      <Para>For reservoirs with H-Schedule mode, or flow boundaries with Q-Schedule mode, click the <strong>Edit Pairs</strong> button in that row to open the pairs editor.</Para>

      <SubHeading>Pipe Material (Conduit Tab)</SubHeading>
      <Para>Selecting a material auto-fills Manning's n, Young's Modulus (E), and recalculates wave speed — for all conduits or just the selected row depending on the <strong>Apply Material to All Conduits</strong> checkbox.</Para>

      <Note>Clicking a row in the Flex Table selects the corresponding element on the canvas (and vice versa), keeping both views in sync.</Note>
    </>
  );
}

function ExcelSection() {
  return (
    <>
      <SectionTitle>Excel Import / Export</SectionTitle>
      <SectionLead>The Flex Table supports lossless round-trip Excel synchronization. Export a workbook, edit values in Excel, and import back — all element data is preserved.</SectionLead>

      <SubHeading>Exporting a Single Element Type</SubHeading>
      <StepList steps={[
        'Open the Flex Table (Tools → Flex Table).',
        'Select the desired element type tab (e.g. Conduit).',
        'Click the Export Excel button in the top-right of the tab bar.',
        'An .xlsx file named whamo_conduit_YYYY-MM-DD.xlsx is downloaded.',
      ]} />

      <SubHeading>Exporting All Element Types (Multi-Sheet)</SubHeading>
      <StepList steps={[
        'Open the Flex Table and stay on the All tab.',
        'Click Export Excel — a multi-sheet workbook is created.',
        'Each element type with data gets its own clearly labelled sheet.',
        'The workbook is named whamo_all_<ProjectName>_YYYY-MM-DD.xlsx.',
      ]} />

      <SubHeading>Importing from Excel</SubHeading>
      <StepList steps={[
        'Make sure your network already contains the elements you want to update.',
        'Select the matching tab in the Flex Table (or All for a multi-sheet file).',
        'Click Import Excel and select the .xlsx file.',
        'Each row is matched by its Label. Rows whose labels do not match an existing element are skipped.',
        'After a multi-sheet import, a summary dialog shows updated/skipped counts per sheet.',
      ]} />

      <Warn>Import only updates existing elements — it does not create new ones. Make sure all elements exist on the canvas before importing.</Warn>
      <Note>The exported workbook includes Excel data-validation dropdowns for fields like Pipe Material, Mode, and boolean toggles. These dropdowns are preserved on re-import.</Note>
    </>
  );
}

function SimulationSection() {
  return (
    <>
      <SectionTitle>Running Simulations</SectionTitle>
      <SectionLead>WHAMO Network Designer can run the WHAMO hydraulic transient engine directly. Configure parameters, specify output requests, then generate your results.</SectionLead>

      <SubHeading>Computational Parameters</SubHeading>
      <Para>Click <strong>Generate → .INP or .OUT</strong> to open the generation panel. Computational Parameters appear at the top; set DTCOMP (computation step), DTOUT (output interval), and TMAX (maximum time) for each simulation stage.</Para>

      <SubHeading>Output Requests</SubHeading>
      <StepList steps={[
        'Click Generate → .INP or .OUT to open the generation panel and configure output requests below the parameters.',
        'Select a node or element, or choose a group type (Nodes, Conduits, Elements).',
        'Tick the variables you want to record for the selected request.',
        'Choose HISTORY, select an element and variables, then click Add Request. Requests are only created when you add them manually.',
        'Review the Current Requests list at the bottom.',
      ]} />

      <SubHeading>Generating the .OUT File</SubHeading>
      <StepList steps={[
        'Click Generate → .OUT in the ribbon.',
        'The network is validated. Fix any errors and try again.',
        'After validation, the WHAMO engine runs on the server and the .OUT file is generated.',
        'The result is displayed in the file preview panel.',
      ]} />

      <Note>The WHAMO engine requires Wine on Linux. It runs in an isolated temporary directory and cleans up after each run.</Note>
    </>
  );
}

function FilesSection() {
  return (
    <>
      <SectionTitle>INP & OUT Files</SectionTitle>
      <SectionLead>WHAMO uses two text-based file formats: the .INP input file and the .OUT output file. Both can be previewed, downloaded, and analysed within the Designer.</SectionLead>

      <SubHeading>.INP File</SubHeading>
      <Para>The .INP file is the WHAMO input definition. It describes the network topology, element properties, computational parameters, and output requests in WHAMO's native format.</Para>
      <StepList steps={[
        'Click Generate → .INP in the ribbon.',
        'The network is validated first. Resolve any errors shown.',
        'After validation, confirm the output requests, then click Generate .INP.',
        'The file is downloaded to your computer.',
      ]} />

      <SubHeading>.OUT File</SubHeading>
      <Para>The .OUT file is produced by the WHAMO engine after a simulation run. It contains time-series results for all requested output variables.</Para>
      <StepList steps={[
        'Click Tools → Visualization in the ribbon.',
        'Load a .OUT file using the file picker inside the Visualization view.',
        'Switch between Profile Graph (animated HGL) and History Graph (time-series plots).',
      ]} />

      <Note>The .OUT file parser runs entirely client-side — no server upload is needed to view results.</Note>
    </>
  );
}

function ShortcutsSection() {
  return (
    <>
      <SectionTitle>Keyboard Shortcuts</SectionTitle>
      <SectionLead>Use these shortcuts to speed up common actions while working in the canvas or Flex Table.</SectionLead>

      <SubHeading>Canvas</SubHeading>
      <table className="w-full mb-4 text-[12px]" style={{ fontFamily: 'Poppins, sans-serif' }}>
        <thead>
          <tr className="bg-slate-50">
            <th className="text-left pb-2 pt-1 text-slate-500 font-semibold text-[10px] uppercase tracking-wide pr-4">Shortcut</th>
            <th className="text-left pb-2 pt-1 text-slate-500 font-semibold text-[10px] uppercase tracking-wide">Action</th>
          </tr>
        </thead>
        <tbody>
          <KbRow keys={['Ctrl', 'Z']} action="Undo last change" />
          <KbRow keys={['Ctrl', 'Y']} action="Redo" />
          <KbRow keys={['Ctrl', 'S']} action="Save project" />
          <KbRow keys={['Delete']} action="Delete selected element(s)" />
          <KbRow keys={['Escape']} action="Deselect / cancel link-drawing mode" />
          <KbRow keys={['Ctrl', 'A']} action="Select all elements on canvas" />
          <KbRow keys={['Ctrl', '+']} action="Zoom in" />
          <KbRow keys={['Ctrl', '-']} action="Zoom out" />
          <KbRow keys={['Ctrl', 'Shift', 'F']} action="Fit view to network" />
          <KbRow keys={['Space']} action="Pan canvas (hold while dragging)" />
        </tbody>
      </table>

      <SubHeading>Flex Table</SubHeading>
      <table className="w-full mb-4 text-[12px]" style={{ fontFamily: 'Poppins, sans-serif' }}>
        <thead>
          <tr className="bg-slate-50">
            <th className="text-left pb-2 pt-1 text-slate-500 font-semibold text-[10px] uppercase tracking-wide pr-4">Shortcut</th>
            <th className="text-left pb-2 pt-1 text-slate-500 font-semibold text-[10px] uppercase tracking-wide">Action</th>
          </tr>
        </thead>
        <tbody>
          <KbRow keys={['Tab']} action="Move to next editable cell" />
          <KbRow keys={['Shift', 'Tab']} action="Move to previous editable cell" />
          <KbRow keys={['Enter']} action="Commit edit and move to next row" />
          <KbRow keys={['Escape']} action="Cancel edit without saving" />
        </tbody>
      </table>
    </>
  );
}

function TroubleshootingSection() {
  return (
    <>
      <SectionTitle>Troubleshooting</SectionTitle>
      <SectionLead>Common issues and how to resolve them.</SectionLead>

      {[
        { q: 'Validation fails with "No path from Reservoir to Node"', a: 'Every node must be reachable from at least one Reservoir via conduits. Check the canvas for disconnected elements or broken conduit connections.' },
        { q: 'WHAMO engine returns an error or empty .OUT file', a: 'Ensure all conduit lengths, diameters, and celerities are non-zero. Check that DTCOMP × celerity / length ≤ 1 (Courant condition). Review the error message in the preview panel.' },
        { q: 'Import Excel: all rows skipped', a: 'The import matches rows by Label. Ensure the Label column in your Excel file matches exactly the element labels on the canvas (case-sensitive). Use Export Excel first to get the correct format.' },
        { q: 'Multi-sheet export shows empty workbook', a: 'The All tab export only includes element types that have at least one element. Make sure your network has elements before exporting.' },
        { q: 'Canvas elements overlap after Auto-Arrange', a: 'Auto-Arrange uses a tree layout and works best on networks with a clear flow direction. For complex looped networks, manually position elements after arranging.' },
        { q: 'Surge Tank celerity is very high or infinite', a: 'Surge tanks are modelled as infinite-celerity elements in WHAMO. This is expected — do not adjust the celerity for surge tank connections.' },
        { q: 'Undo/Redo is not available', a: 'Undo/Redo is only available when a project is open. Make sure you have opened or saved a project first.' },
        { q: 'Reservoir connection gives unrealistic results', a: 'Check that the Reservoir elevation is set correctly and that the Loss Coefficient is appropriate (0.5 for sharp-edged inlet, 0.0 for fully flush connection).' },
        { q: 'Flow BC not affecting simulation', a: 'Check that Mode is set correctly (Fixed or Schedule) and that Q-Schedule # references a valid defined schedule. Verify Q sign: positive for inflow, negative for extraction.' },
        { q: 'Junction demand not appearing in results', a: 'Demand at a Junction is a steady-state extraction. Verify the demand value in the Flex Table and ensure the output request includes the junction node.' },
      ].map(({ q, a }) => (
        <div key={q} className="mb-4 rounded-lg border border-slate-200 overflow-hidden">
          <div className="flex items-start gap-2 px-3 py-2.5 bg-slate-50 border-b border-slate-200">
            <ChevronRight className="w-3.5 h-3.5 text-[#1a73e8] flex-shrink-0 mt-0.5" />
            <p className="text-[12px] font-semibold text-slate-800" style={{ fontFamily: 'Poppins, sans-serif' }}>{q}</p>
          </div>
          <p className="text-[12px] text-slate-600 px-3 py-2.5 leading-relaxed" style={{ fontFamily: 'Poppins, sans-serif' }}>{a}</p>
        </div>
      ))}
    </>
  );
}

// ─── All Properties Section ───────────────────────────────────────────────────
interface PropRow {
  name: string;
  unit?: string;
  description: string;
  meaning: string;
  howToUse: string;
}

interface ElementProps {
  id: string;
  element: string;
  badge: string;
  badgeColor: string;
  properties: PropRow[];
}

const ALL_ELEMENT_PROPS: ElementProps[] = [
  {
    id: 'reservoir',
    element: 'Reservoir',
    badge: 'Reservoir',
    badgeColor: 'bg-blue-600',
    properties: [
      { name: 'Label / ID', description: 'Unique alphanumeric identifier for this element.', meaning: 'Used as the node label on the canvas and in the INP file. Must be unique across all elements.', howToUse: 'Type a short memorable tag such as "R1" or "UPSTRM". Avoid spaces.' },
      { name: 'Comment', description: 'Free-text internal comment (c/C style).', meaning: 'Not used in simulation. Acts as a note for the engineer — visible only in the properties panel and INP file header.', howToUse: 'Describe the reservoir purpose, e.g. "Upper forebay — elevation taken from survey 2024".' },
      { name: 'Node Number', description: 'Auto-assigned integer identifier.', meaning: 'The WHAMO engine references all nodes by number. This is set automatically and cannot normally be edited.', howToUse: 'Leave as assigned. It appears in the INP file as the node index.' },
      { name: 'Elevation', unit: 'ft / m', description: 'Datum elevation of the node above mean sea level or project datum.', meaning: 'Used to compute pressure head at the node. All heads in WHAMO are absolute, so consistent datum across the network is critical.', howToUse: 'Enter the ground/pipe centreline elevation at this reservoir location. Match units (SI vs FPS) with the global unit toggle.' },
      { name: 'Mode', description: 'Boundary condition type: Fixed HW or H Schedule.', meaning: '"Fixed HW" holds the head constant throughout the simulation. "H Schedule" lets the head vary over time according to a defined schedule.', howToUse: 'Use Fixed HW for steady reservoirs (tanks, constant-head sources). Use H Schedule when the upstream head fluctuates (tidal, operational level change).' },
      { name: 'Reservoir Elev HW', unit: 'ft / m', description: 'Head water elevation — the water surface elevation in the reservoir.', meaning: 'This is the total head supplied at this boundary node. It drives the initial conditions and the steady-state solution.', howToUse: 'Enter the normal operating water surface elevation. Must be higher than the pipe centreline to drive flow.' },
      { name: 'Loss Coefficient', description: 'Entry/exit head-loss coefficient at the reservoir face.', meaning: 'Accounts for local hydraulic losses as flow enters or leaves the reservoir. K=0 means no loss; K=1 is a typical abrupt entry.', howToUse: 'Use 0.5 for a sharp-edged entry, 0 for a well-rounded bell-mouth, or 1.0 for a projecting pipe. Leave blank to default to 0.' },
      { name: 'H-Schedule #', description: 'Index of the head-time schedule used when Mode = H Schedule.', meaning: 'References a schedule table defined in the Flex Table that provides head values at each time step.', howToUse: 'First create the schedule in the Flex Table (Schedule tab), then enter its number here.' },
    ],
  },
  {
    id: 'node',
    element: 'Node',
    badge: 'Node',
    badgeColor: 'bg-slate-500',
    properties: [
      { name: 'Label / ID', description: 'Unique alphanumeric identifier for this element.', meaning: 'Used as the node label on the canvas and in the INP file.', howToUse: 'Type a short tag such as "N1". Avoid spaces and duplicate labels.' },
      { name: 'Comment', description: 'Free-text internal comment.', meaning: 'Not used in simulation. Serves as engineer notes.', howToUse: 'Describe the node location or purpose.' },
      { name: 'Node Number', description: 'Auto-assigned integer identifier.', meaning: 'The WHAMO engine references this node by number in the INP file.', howToUse: 'Leave as assigned automatically.' },
      { name: 'Elevation', unit: 'ft / m', description: 'Pipe centreline elevation at this node.', meaning: 'Used to convert pressure head to pressure and to compute HGL profiles along the pipe.', howToUse: 'Enter the elevation at the pipe centreline. Use the same datum as all other nodes in the network.' },
    ],
  },
  {
    id: 'junction',
    element: 'Junction',
    badge: 'Junction',
    badgeColor: 'bg-green-600',
    properties: [
      { name: 'Label / ID', description: 'Unique alphanumeric identifier.', meaning: 'Identifies the junction in the INP file and on the canvas.', howToUse: 'Use a short label such as "J1" or "JCT_3WAY".' },
      { name: 'Comment', description: 'Free-text internal comment.', meaning: 'Not used in simulation. Acts as engineer note.', howToUse: 'Describe the junction role, e.g. "3-way tee at a pipeline branch".' },
      { name: 'Node Number', description: 'Auto-assigned integer.', meaning: 'WHAMO engine node index used in the INP file.', howToUse: 'Leave as assigned.' },
      { name: 'Elevation', unit: 'ft / m', description: 'Pipe centreline elevation at this junction.', meaning: 'Sets the datum for head calculations through the junction.', howToUse: 'Enter the elevation at the pipe centreline for all pipes meeting at this junction.' },
      { name: 'Demand', unit: 'm³/s or ft³/s', description: 'Steady-state lateral demand (withdrawal or injection) at this node.', meaning: 'Represents a consumer load or lateral inflow at the junction. Positive = withdrawal from network; negative = injection into network.', howToUse: 'Enter the design demand flow rate. Use 0 for a simple pass-through junction. Verify units match the global unit toggle.' },
    ],
  },
  {
    id: 'surge-tank',
    element: 'Surge Tank',
    badge: 'Surge Tank',
    badgeColor: 'bg-purple-600',
    properties: [
      { name: 'Label / ID', description: 'Unique alphanumeric identifier.', meaning: 'Identifies the surge tank in the INP file and on the canvas.', howToUse: 'Use a short label such as "ST1".' },
      { name: 'Comment', description: 'Free-text internal comment (c/C style).', meaning: 'Not used in simulation.', howToUse: 'Describe the surge tank design basis.' },
      { name: 'Node Number', description: 'Auto-assigned integer.', meaning: 'WHAMO engine node index.', howToUse: 'Leave as assigned.' },
      { name: 'Node Elevation', unit: 'ft / m', description: 'Elevation of the node at the base of the surge tank riser.', meaning: 'The reference elevation where the surge tank connects to the pipe.', howToUse: 'Set to the pipe centreline elevation at the surge tank location.' },
      { name: 'Tank Type', description: 'Configuration type: SIMPLE, ORIFICE, CLOSED, AIR, or D/S.', meaning: 'SIMPLE = open standpipe; ORIFICE = restricted entry/exit; CLOSED = pressurised air vessel; AIR = air cushion; D/S = differential surge tank.', howToUse: 'Select the type that matches the physical installation. SIMPLE is the most common.' },
      { name: 'Top Elevation', unit: 'ft / m', description: 'Elevation of the top of the surge tank.', meaning: 'Defines the overflow level. The simulation tracks whether the water level exceeds this limit.', howToUse: 'Set to the actual tank top/overflow elevation.' },
      { name: 'Bottom Elevation', unit: 'ft / m', description: 'Elevation of the bottom of the surge tank.', meaning: 'Defines the drain/empty level. Water level cannot fall below this in the model.', howToUse: 'Set to the tank base or minimum operating level.' },
      { name: 'Riser Diameter', unit: 'ft / m', description: 'Internal diameter of the riser pipe connecting the tank to the main conduit.', meaning: 'Controls the flow exchange rate between the main pipe and the tank. Smaller riser = more damping.', howToUse: 'Enter the actual riser pipe internal diameter.' },
      { name: 'Initial Water Level', unit: 'ft / m', description: 'Water surface elevation in the tank at t = 0.', meaning: 'Sets the initial condition for the surge tank. Must be between Bottom and Top Elevation.', howToUse: 'Use the steady-state water level from a hydraulic analysis or from operating records.' },
      { name: 'Area / Shape (S/A pairs)', description: 'Cross-sectional area vs elevation pairs for non-uniform tanks.', meaning: 'For tanks with varying cross-section, multiple (elevation, area) pairs define the tank geometry. Used to accurately track volume.', howToUse: 'Enter pairs in the Flex Table schedule grid. Leave empty for a constant-area (cylindrical) tank.' },
    ],
  },
  {
    id: 'flow-bc',
    element: 'Flow BC',
    badge: 'Flow BC',
    badgeColor: 'bg-orange-500',
    properties: [
      { name: 'Label / ID', description: 'Unique alphanumeric identifier.', meaning: 'Identifies the flow boundary in the INP file and on the canvas.', howToUse: 'Use a short label such as "FBC1".' },
      { name: 'Comment', description: 'Free-text internal comment.', meaning: 'Not used in simulation.', howToUse: 'Describe the flow boundary source or purpose.' },
      { name: 'Node Number', description: 'Auto-assigned integer.', meaning: 'WHAMO engine node index.', howToUse: 'Leave as assigned.' },
      { name: 'Flow Rate (Q)', unit: 'm³/s or ft³/s', description: 'Prescribed constant flow rate injected or extracted at this node.', meaning: 'Positive Q injects flow into the network; negative Q extracts flow. Used for steady-state and fixed-flow transient scenarios.', howToUse: 'Enter the design flow rate in the active unit system. Use positive for supply, negative for demand.' },
      { name: 'Mode', description: 'Boundary condition type: Fixed Q or Q Schedule.', meaning: '"Fixed Q" holds the flow constant. "Q Schedule" varies the flow over time using a schedule table.', howToUse: 'Use Fixed Q for constant injection/extraction; use Q Schedule for time-varying flow scenarios.' },
      { name: 'Q-Schedule #', description: 'Index of the flow-time schedule when Mode = Q Schedule.', meaning: 'References a schedule table in the Flex Table that specifies flow at each time step.', howToUse: 'Create the schedule in the Flex Table (Schedule tab) first, then enter its number here.' },
    ],
  },
  {
    id: 'conduit',
    element: 'Conduit',
    badge: 'Conduit',
    badgeColor: 'bg-slate-600',
    properties: [
      { name: 'Label / ID', description: 'Unique alphanumeric identifier for this conduit/pipe.', meaning: 'Identifies the pipe in the INP file and the Flex Table.', howToUse: 'Auto-generated but editable, e.g. "P1", "MAIN-1".' },
      { name: 'Length (L)', unit: 'ft / m', description: 'Physical pipe length between upstream and downstream nodes.', meaning: 'The most sensitive parameter in water hammer analysis. Longer pipes = longer wave travel times = different resonance frequencies.', howToUse: 'Measure the actual pipe centreline length. Do not use horizontal plan distance for steep pipelines — use the 3D length.' },
      { name: 'Diameter (D)', unit: 'ft / m', description: 'Internal (bore) diameter of the pipe.', meaning: 'Determines flow velocity and head loss. Also used in wave speed calculation when E and WT are provided.', howToUse: 'Use the inside diameter (not nominal or outside diameter). Convert nominal sizes using standard pipe tables.' },
      { name: 'Celerity (a)', unit: 'm/s or ft/s', description: 'Pressure wave speed (acoustic velocity) in the pipe.', meaning: 'The fundamental parameter of water hammer. Governs the Joukowsky pressure rise (ΔH = aΔV/g) and wave travel time. Typical range: 200–1400 m/s.', howToUse: 'Calculate from pipe material using a=4720/√(1+(3·10⁵/E)·(D/WT)) or enter directly if known. For steel: ~1200 m/s; HDPE: ~300 m/s; concrete: ~1000 m/s.' },
      { name: 'Friction (f)', description: 'Darcy-Weisbach friction factor or Manning\'s n, depending on method selected.', meaning: 'Controls steady-state head loss and the attenuation of transient waves. Darcy-Weisbach f = dimensionless (typical 0.01–0.04); Manning n = s/m^(1/3) (typical 0.010–0.015).', howToUse: 'For new steel: f=0.015. For old cast iron: f=0.025–0.04. For HDPE: f=0.009. Alternatively enter Manning n and let WHAMO compute f = 185·n²/D^(1/3).' },
      { name: 'E (Young\'s Modulus)', unit: 'psi or Pa', description: 'Modulus of elasticity of the pipe wall material.', meaning: 'Used with WT to automatically compute wave speed. Steel ≈ 30,000,000 psi; HDPE ≈ 130,000 psi.', howToUse: 'Enter along with WT instead of specifying Celerity directly. The formula c=4720/√(1+(3·10⁵/E)·(D/WT)) is shown in the panel.' },
      { name: 'WT (Wall Thickness)', unit: 'ft / m', description: 'Pipe wall thickness.', meaning: 'Used with E to compute wave speed. Thicker walls → higher wave speed (stiffer pipe).', howToUse: 'Enter the nominal wall thickness from pipe specifications. Convert to the active unit system.' },
      { name: 'Manning\'s n', description: 'Manning\'s roughness coefficient for computing friction factor.', meaning: 'An alternative to specifying the Darcy-Weisbach f directly. WHAMO converts n to f using f=185·n²/D^(1/3).', howToUse: 'Typical values: smooth plastic 0.009, concrete 0.011–0.013, cast iron 0.012–0.015, corroded steel 0.015–0.025.' },
    ],
  },
  {
    id: 'dummy-pipe',
    element: 'Dummy Pipe',
    badge: 'Dummy Pipe',
    badgeColor: 'bg-gray-400',
    properties: [
      { name: 'Label / ID', description: 'Unique alphanumeric identifier.', meaning: 'Identifies the dummy pipe element in the INP file.', howToUse: 'Use a label such as "DP1".' },
      { name: 'Comment', description: 'Free-text internal comment.', meaning: 'Not used in simulation.', howToUse: 'Note why the dummy pipe exists, e.g. "Topology connector only — zero length".' },
      { name: 'Length', unit: 'ft / m', description: 'Nominal pipe length (typically near-zero or 1).', meaning: 'A dummy pipe is a zero-resistance connection used to satisfy topology or to connect special elements. Set length small but non-zero to avoid division-by-zero.', howToUse: 'Use the minimum value (e.g. 0.001 m or 1 ft) to keep it computationally stable.' },
      { name: 'Diameter', unit: 'ft / m', description: 'Pipe bore diameter.', meaning: 'Used for velocity calculations. Match to the adjacent pipe to minimise any numerical artefacts.', howToUse: 'Set to match the adjacent conduit diameter.' },
      { name: 'Celerity', unit: 'm/s or ft/s', description: 'Wave speed in the dummy pipe.', meaning: 'Should match the connected conduit\'s celerity. Using a very high celerity makes the dummy pipe act as a rigid link.', howToUse: 'Set equal to the adjacent conduit\'s celerity, or use 1200 m/s (steel equivalent) for a rigid connection.' },
    ],
  },
];

const PROP_FILTER_OPTIONS = [
  { value: 'all',         label: 'All Elements' },
  { value: 'reservoir',   label: 'Reservoir' },
  { value: 'node',        label: 'Node' },
  { value: 'junction',    label: 'Junction' },
  { value: 'surge-tank',  label: 'Surge Tank' },
  { value: 'flow-bc',     label: 'Flow BC' },
  { value: 'conduit',     label: 'Conduit' },
  { value: 'dummy-pipe',  label: 'Dummy Pipe' },
];

function ElementPropCard({ id, element, badge, badgeColor, properties }: ElementProps) {
  const [open, setOpen] = useState(true);
  return (
    <div className="mb-4 rounded-lg border border-slate-200 overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
      >
        <span className={`inline-block text-white text-[10px] font-bold px-2 py-0.5 rounded ${badgeColor}`}>
          {badge}
        </span>
        <span className="font-semibold text-slate-700 text-sm flex-1">{element} Properties</span>
        <ChevronDown className={cn('w-4 h-4 text-slate-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100">
                <th className="text-left px-4 py-2 font-semibold text-slate-600 border-b border-slate-200 w-[16%]">Property</th>
                <th className="text-left px-4 py-2 font-semibold text-slate-600 border-b border-slate-200 w-[9%]">Unit</th>
                <th className="text-left px-4 py-2 font-semibold text-slate-600 border-b border-slate-200 w-[25%]">Description</th>
                <th className="text-left px-4 py-2 font-semibold text-slate-600 border-b border-slate-200 w-[28%]">Meaning</th>
                <th className="text-left px-4 py-2 font-semibold text-slate-600 border-b border-slate-200 w-[22%]">How to Use</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((p, i) => (
                <tr key={p.name} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="px-4 py-2 font-medium text-slate-800 border-b border-slate-100 align-top">{p.name}</td>
                  <td className="px-4 py-2 text-slate-500 border-b border-slate-100 align-top whitespace-nowrap">{p.unit ?? '—'}</td>
                  <td className="px-4 py-2 text-slate-700 border-b border-slate-100 align-top">{p.description}</td>
                  <td className="px-4 py-2 text-slate-600 border-b border-slate-100 align-top">{p.meaning}</td>
                  <td className="px-4 py-2 text-slate-600 border-b border-slate-100 align-top">{p.howToUse}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AllPropertiesSection() {
  const [filter, setFilter] = useState('all');
  const filtered = filter === 'all' ? ALL_ELEMENT_PROPS : ALL_ELEMENT_PROPS.filter(e => e.id === filter);

  return (
    <>
      <SectionTitle>All Properties</SectionTitle>
      <SectionLead>
        Every configurable property for every element type — what it means, why it matters, and how to set it correctly. Use the filter to focus on a single element.
      </SectionLead>

      <FilterSelect
        label="Filter:"
        value={filter}
        options={PROP_FILTER_OPTIONS}
        onChange={setFilter}
      />

      {filtered.map(ep => (
        <ElementPropCard key={ep.id} {...ep} />
      ))}
    </>
  );
}

// ─── Demo Videos Section ──────────────────────────────────────────────────────

const VIDEO_FILTER_OPTIONS = [
  { value: 'all',               label: 'All Videos' },
  { value: 'reservoir',         label: 'Reservoir' },
  { value: 'node',              label: 'Node' },
  { value: 'junction',          label: 'Junction' },
  { value: 'surge-tank',        label: 'Surge Tank' },
  { value: 'flow-bc',           label: 'Flow BC' },
  { value: 'conduit',           label: 'Conduit' },
  { value: 'flex-table',        label: 'Flex Table' },
  { value: 'visualization',     label: 'Visualization' },
  { value: 'inp-generation',    label: 'INP Generation' },
  { value: 'out-generation',    label: 'OUT Generation' },
  { value: 'complete-workflow', label: 'Complete Workflow' },
];

interface VideoEntry {
  id: string;
  title: string;
  description: string;
  category: string;
  categoryLabel: string;
  categoryColor: string;
  duration: string;
  src: string | null;
}

const VIDEO_DATA: VideoEntry[] = [
  // Element connection tutorials
  { id: 'v-reservoir', title: 'Adding & Connecting a Reservoir', description: 'Click the Reservoir tool, place the element on canvas, connect to a downstream Node, and configure head elevation and loss coefficient.', category: 'reservoir', categoryLabel: 'Reservoir', categoryColor: 'bg-blue-600', duration: '~3 min', src: null },
  { id: 'v-node', title: 'Placing Nodes and Routing Pipes', description: 'Add Node elements as junction points along a pipeline, connect them with conduits, and set elevations for pressure profiling.', category: 'node', categoryLabel: 'Node', categoryColor: 'bg-slate-600', duration: '~2 min', src: null },
  { id: 'v-junction', title: 'Creating a Demand Junction', description: 'Place a Junction element at a lateral off-take point, connect it to the main line, and set a steady-state demand flow value.', category: 'junction', categoryLabel: 'Junction', categoryColor: 'bg-emerald-600', duration: '~3 min', src: null },
  { id: 'v-surge-tank', title: 'Installing a Surge Tank', description: 'Place a Surge Tank beside the pipeline, connect via a short Dummy Pipe riser, and configure tank top, bottom, and initial water level.', category: 'surge-tank', categoryLabel: 'Surge Tank', categoryColor: 'bg-purple-600', duration: '~4 min', src: null },
  { id: 'v-flow-bc', title: 'Setting Up a Flow Boundary Condition', description: 'Add a Flow BC element, connect it to the network, choose Fixed or Schedule mode, and configure the flow rate or Q-Schedule.', category: 'flow-bc', categoryLabel: 'Flow BC', categoryColor: 'bg-orange-600', duration: '~3 min', src: null },
  { id: 'v-conduit', title: 'Configuring Conduit Properties', description: 'Select a conduit in the Flex Table, set Length, Diameter, Celerity and Friction, use the Pipe Material selector to auto-calculate wave speed.', category: 'conduit', categoryLabel: 'Conduit', categoryColor: 'bg-slate-500', duration: '~4 min', src: null },
  // Feature tutorials
  { id: 'v-flex-table', title: 'Using the Flex Table', description: 'Open the Flex Table, filter by element type, edit cells inline, toggle SI/FPS units, and use the material selector to bulk-update conduit properties.', category: 'flex-table', categoryLabel: 'Flex Table', categoryColor: 'bg-indigo-600', duration: '~6 min', src: null },
  { id: 'v-excel-import', title: 'Importing Data from Excel', description: 'Export a workbook, edit values in Excel, then import back — rows are matched by Label. Covers single-element and multi-sheet workflows.', category: 'flex-table', categoryLabel: 'Flex Table', categoryColor: 'bg-indigo-600', duration: '~4 min', src: null },
  { id: 'v-excel-export', title: 'Exporting to Excel', description: 'Export a single element type or a full multi-sheet workbook from the Flex Table. Includes data-validation dropdowns for material and mode fields.', category: 'flex-table', categoryLabel: 'Flex Table', categoryColor: 'bg-indigo-600', duration: '~3 min', src: null },
  { id: 'v-parameters', title: 'Configuring Simulation Parameters', description: 'Open Generate → .INP or .OUT, set DTCOMP, DTOUT, and TMAX for each simulation time stage, and verify the Courant condition is satisfied.', category: 'out-generation', categoryLabel: 'OUT Generation', categoryColor: 'bg-green-700', duration: '~4 min', src: null },
  { id: 'v-visualization', title: 'Viewing Results in Visualization', description: 'Open Tools → Visualization, load a .OUT file, switch between Profile Graph (animated HGL) and History Graph (time-series) views.', category: 'visualization', categoryLabel: 'Visualization', categoryColor: 'bg-teal-600', duration: '~5 min', src: null },
  { id: 'v-inp', title: 'Generating the INP File', description: 'Run network validation, review Computational Parameters and output requests in the generation panel, then generate the WHAMO input file.', category: 'inp-generation', categoryLabel: 'INP Generation', categoryColor: 'bg-amber-600', duration: '~4 min', src: null },
  { id: 'v-out', title: 'Running Simulation & Generating OUT File', description: 'Configure parameters, add output requests, click Generate → .OUT. The WHAMO engine validates, runs, and returns the .OUT results file.', category: 'out-generation', categoryLabel: 'OUT Generation', categoryColor: 'bg-green-700', duration: '~5 min', src: null },
  // Complete workflow
  { id: 'v-workflow', title: 'Complete Workflow: Start to Simulation Results', description: 'Full walkthrough: create a project, add elements, draw connections, edit properties in the Flex Table, import/export Excel, configure parameters, generate INP, run simulation, and review results in Visualization.', category: 'complete-workflow', categoryLabel: 'Complete Workflow', categoryColor: 'bg-rose-600', duration: '~20 min', src: null },
];

// ─── Video Player (step-cycling animated guide thumbnails) ───────────────────

const VP_CSS = `
@keyframes vp-line   { from{width:0} to{width:100%} }
@keyframes vp-vline  { from{height:0} to{height:100%} }
@keyframes vp-pop    { from{opacity:0;transform:scale(.5)} to{opacity:1;transform:scale(1)} }
@keyframes vp-pulse  { 0%,100%{transform:scale(1)} 50%{transform:scale(1.18)} }
@keyframes vp-glow   { 0%,100%{box-shadow:0 0 0 0 rgba(26,115,232,.5)} 50%{box-shadow:0 0 0 8px rgba(26,115,232,0)} }
@keyframes vp-spin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
@keyframes vp-dot    { 0%{transform:translateX(-2px);opacity:0} 50%{opacity:1} 100%{transform:translateX(22px);opacity:0} }
@keyframes vp-chart  { from{stroke-dashoffset:320} to{stroke-dashoffset:0} }
@keyframes vp-prog   { from{width:0%} to{width:72%} }
@keyframes vp-blink  { 0%,49%{opacity:1} 50%,99%{opacity:0} }
@keyframes vp-slide-u{ from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
@keyframes vp-slide-l{ from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
@keyframes vp-hl     { 0%,100%{background:#f0f9ff} 50%{background:#bfdbfe} }
@keyframes vp-hl-btn { 0%,100%{filter:brightness(1)} 50%{filter:brightness(1.25)} }
@keyframes vp-bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
`;

function VideoAnimStyles() {
  return <style dangerouslySetInnerHTML={{ __html: VP_CSS }} />;
}

// ─── Shared mini primitives for video frames ─────────────────────────────────

function VN({ icon, label, size = 36, glow = false, pulse = false }: {
  icon?: string; label: string; size?: number; glow?: boolean; pulse?: boolean;
}) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', border: '2.5px solid #1e293b',
      background: 'white', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', flexShrink: 0, gap: 1,
      animation: pulse ? 'vp-pulse 1.2s ease-in-out infinite' : glow ? 'vp-glow 1.5s ease-in-out infinite' : undefined,
    }}>
      {icon && <img src={icon} alt="" style={{ width: size * 0.44, height: size * 0.44, objectFit: 'contain' }} />}
      <span style={{ fontSize: Math.max(7, size * 0.22), fontWeight: 700, color: '#1e293b', lineHeight: 1 }}>{label}</span>
    </div>
  );
}

// Keep old name for backward compat
function AN({ icon, label, size = 38, style = {}, imgStyle = {} }: {
  icon?: string; label: string; size?: number; style?: React.CSSProperties; imgStyle?: React.CSSProperties;
}) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', border: '2.5px solid #1e293b',
      background: 'white', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', flexShrink: 0, gap: 1, ...style,
    }}>
      {icon && <img src={icon} alt="" style={{ width: size * 0.44, height: size * 0.44, objectFit: 'contain', ...imgStyle }} />}
      <span style={{ fontSize: Math.max(8, size * 0.22), fontWeight: 700, color: '#1e293b', lineHeight: 1, whiteSpace: 'nowrap' }}>{label}</span>
    </div>
  );
}

function VFlowBC({ size = 38, label = 'Q1' }: { size?: number; label?: string }) {
  return (
    <div style={{ padding: '4px 8px', border: '2.5px solid #1e293b', borderRadius: 6, background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flexShrink: 0 }}>
      <img src={windIcon} alt="" style={{ width: size * 0.5, height: size * 0.5, objectFit: 'contain' }} />
      <span style={{ fontSize: Math.max(8, size * 0.22), fontWeight: 700, color: '#1e293b', lineHeight: 1 }}>{label}</span>
    </div>
  );
}

function VArrow({ w = 32, dashed = false, color = '#64748b', animated = false }: { w?: number; dashed?: boolean; color?: string; animated?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0, animation: animated ? 'vp-bounce 1s ease-in-out infinite' : undefined }}>
      {dashed
        ? <svg width={w} height={6}><line x1={0} y1={3} x2={w - 8} y2={3} stroke={color} strokeWidth={2} strokeDasharray="4,3" /><polygon points={`${w - 8},0 ${w - 8},6 ${w},3`} fill={color} /></svg>
        : <><div style={{ width: w - 8, height: 2.5, background: color }} /><div style={{ width: 0, height: 0, borderTop: '5px solid transparent', borderBottom: '5px solid transparent', borderLeft: `8px solid ${color}` }} /></>
      }
    </div>
  );
}

function Chip({ text, color = '#1a73e8' }: { text: string; color?: string }) {
  return (
    <div style={{ fontSize: 9, fontWeight: 700, color, background: `${color}18`, border: `1px solid ${color}55`, borderRadius: 4, padding: '2px 7px', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
      {text}
    </div>
  );
}

function ToolBtn({ icon, label, active = false }: { icon: string; label: string; active?: boolean }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
      padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${active ? '#1a73e8' : '#e2e8f0'}`,
      background: active ? '#dbeafe' : 'white', flexShrink: 0,
      animation: active ? 'vp-glow 1.5s ease-in-out infinite' : undefined,
    }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{ fontSize: 8, fontWeight: 700, color: active ? '#1a73e8' : '#64748b' }}>{label}</span>
    </div>
  );
}

function MiniTable({ headers, rows, hlRow = -1, hlCol = -1, editVal = '' }: {
  headers: string[]; rows: string[][]; hlRow?: number; hlCol?: number; editVal?: string;
}) {
  return (
    <div style={{ background: 'white', borderRadius: 7, border: '1px solid #e2e8f0', overflow: 'hidden', width: '100%' }}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${headers.length}, 1fr)`, background: '#1e293b', padding: '3px 8px' }}>
        {headers.map(h => <span key={h} style={{ fontSize: 8, fontWeight: 700, color: 'white', padding: '1px 0' }}>{h}</span>)}
      </div>
      {rows.map((row, ri) => (
        <div key={ri} style={{ display: 'grid', gridTemplateColumns: `repeat(${headers.length}, 1fr)`, padding: '3px 8px', borderTop: '1px solid #f1f5f9', background: ri === hlRow ? '#eff6ff' : 'transparent', animation: ri === hlRow ? 'vp-hl 1.5s ease-in-out infinite' : undefined }}>
          {row.map((v, ci) => (
            <span key={ci} style={{ fontSize: 9, fontFamily: 'monospace', color: ri === hlRow && ci === hlCol ? '#1a73e8' : '#374151', fontWeight: ri === hlRow && ci === hlCol ? 700 : 400, outline: ri === hlRow && ci === hlCol ? '2px solid #1a73e8' : 'none', outlineOffset: 1, borderRadius: 2 }}>
              {ri === hlRow && ci === hlCol ? (editVal || v) : v}
              {ri === hlRow && ci === hlCol && <span style={{ animation: 'vp-blink 0.9s step-end infinite' }}>|</span>}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Frame builder ────────────────────────────────────────────────────────────

interface AnimFrame { title: string; content: React.ReactNode; ms: number; }

function buildFrames(id: string): AnimFrame[] {
  // Row helper
  const row = (children: React.ReactNode, gap = 8) => (
    <div style={{ display: 'flex', alignItems: 'center', gap, flexWrap: 'nowrap' }}>{children}</div>
  );
  const col = (children: React.ReactNode, gap = 8) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap }}>{children}</div>
  );

  switch (id) {

    // ── v-reservoir ───────────────────────────────────────────────────────
    case 'v-reservoir': return [
      { ms: 2000, title: 'Select the Reservoir tool from the toolbar', content: col(<>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Toolbar</div>
        {row(<>
          <ToolBtn icon="🌊" label="Node" />
          <ToolBtn icon="🏔" label="Reservoir" active />
          <ToolBtn icon="🪣" label="Tank" />
        </>, 6)}
        <Chip text="Click to activate Reservoir tool" color="#1a73e8" />
      </>) },
      { ms: 2000, title: 'Click on the canvas to place the reservoir', content: col(<>
        <VN icon={damIcon} label="R1" size={52} glow />
        <Chip text="R1 placed at (120, 80)" />
      </>) },
      { ms: 2200, title: 'Drag from R1 to connect a downstream Node', content: col(<>
        {row(<>
          <VN icon={damIcon} label="R1" size={44} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <div style={{ width: 60, height: 3, background: '#64748b', borderRadius: 2, animation: 'vp-line 0.8s ease-out infinite alternate' }} />
          </div>
          <VN label="N1" size={38} pulse />
        </>)}
        <Chip text="Drag → release on target node" color="#16a34a" />
      </>) },
      { ms: 2200, title: 'Set Elevation and operating mode', content: col(<>
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 14px', width: 180 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>R1 Properties</div>
          {[['Elevation (m)', '120.0'], ['Mode', 'Fixed ▾'], ['Loss Coeff.', '0.0']].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 9, color: '#64748b' }}>{k}</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: '#1a73e8', fontFamily: 'monospace' }}>{v}</span>
            </div>
          ))}
        </div>
        <Chip text="Elevation + mode configured ✓" color="#16a34a" />
      </>) },
    ];

    // ── v-node ────────────────────────────────────────────────────────────
    case 'v-node': return [
      { ms: 1800, title: 'Select the Node tool and click to place N1', content: col(<>
        <VN label="N1" size={50} glow />
        <Chip text="Node placed — sets pipe junction point" />
      </>) },
      { ms: 2000, title: 'Draw conduit from N1 to place N2', content: col(<>
        {row(<>
          <VN label="N1" size={38} />
          <VArrow w={50} animated />
          <VN label="N2" size={38} pulse />
        </>)}
        <Chip text="Conduit C1 connecting N1 → N2" color="#7c3aed" />
      </>) },
      { ms: 2000, title: 'Continue pipeline — add N3', content: col(<>
        {row(<>
          <VN icon={damIcon} label="R1" size={34} />
          <VArrow w={28} />
          <VN label="N1" size={34} />
          <VArrow w={28} />
          <VN label="N2" size={34} />
          <VArrow w={28} />
          <VN label="N3" size={34} pulse />
        </>)}
      </>) },
      { ms: 2200, title: 'Open Flex Table to set Node elevations', content: col(<>
        <MiniTable headers={['Label','Elevation (m)','Notes']} rows={[['N1','45.0','upstream'],['N2','38.0','mid'],['N3','30.0','outlet']]} hlRow={1} hlCol={1} editVal="38.0" />
        <Chip text="Elevation sets HGL reference points" color="#16a34a" />
      </>) },
    ];

    // ── v-junction ────────────────────────────────────────────────────────
    case 'v-junction': return [
      { ms: 1800, title: 'Place a Junction element at a lateral off-take', content: col(<>
        <VN icon={yIntersectionIcon} label="J1" size={52} glow />
        <Chip text="Junction = lateral demand point" color="#059669" />
      </>) },
      { ms: 2000, title: 'Connect the main pipeline through J1', content: col(<>
        {row(<>
          <VN label="N1" size={36} />
          <VArrow w={32} />
          <VN icon={yIntersectionIcon} label="J1" size={44} pulse />
          <VArrow w={32} />
          <VN label="N2" size={36} />
        </>)}
        <Chip text="Main line passes through junction" />
      </>) },
      { ms: 2200, title: 'Demand flow exits downward from J1', content: col(<>
        {row(<><VN label="N1" size={34} /><VArrow w={28} /><VN icon={yIntersectionIcon} label="J1" size={40} /><VArrow w={28} /><VN label="N2" size={34} /></>)}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, marginTop: -4 }}>
          <div style={{ width: 2.5, height: 22, background: '#f59e0b', animation: 'vp-vline 0.7s ease-out infinite alternate' }} />
          <div style={{ width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '10px solid #f59e0b' }} />
        </div>
        <Chip text="Off-take demand" color="#f59e0b" />
      </>) },
      { ms: 2000, title: 'Set the steady-state demand flow value', content: col(<>
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 14px', width: 175 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>J1 Properties</div>
          {[['Demand Q (m³/s)', '0.050'],['Elevation (m)', '42.0']].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 9, color: '#64748b' }}>{k}</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: '#f59e0b', fontFamily: 'monospace' }}>{v}</span>
            </div>
          ))}
        </div>
        <Chip text="Q = 0.05 m³/s demand set ✓" color="#16a34a" />
      </>) },
    ];

    // ── v-surge-tank ──────────────────────────────────────────────────────
    case 'v-surge-tank': return [
      { ms: 1800, title: 'Place a Surge Tank beside the pipeline', content: col(<>
        <VN icon={waterTankIcon} label="ST1" size={52} glow />
        <Chip text="Surge Tank suppresses transient surges" color="#7c3aed" />
      </>) },
      { ms: 2000, title: 'Draw a Dummy Pipe riser from N2 up to ST1', content: col(<>
        <VN icon={waterTankIcon} label="ST1" size={42} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
          <div style={{ width: 2.5, height: 28, background: '#94a3b8', animation: 'vp-vline 0.6s ease-out infinite alternate', borderRadius: 2 }} />
        </div>
        {row(<><VN label="N1" size={34} /><VArrow w={28} /><VN label="N2" size={34} pulse /></>)}
        <Chip text="Dummy Pipe: short riser connection" color="#7c3aed" />
      </>) },
      { ms: 2200, title: 'Connect the Surge Tank to the pipeline', content: col(<>
        <VN icon={waterTankIcon} label="ST1" size={40} />
        <div style={{ width: 2, height: 16, background: '#94a3b8' }} />
        {row(<><VN label="N1" size={32} /><VArrow w={22} /><VN label="N2" size={32} pulse /><VArrow w={22} /><VN label="N3" size={32} /></>)}
      </>) },
      { ms: 2200, title: 'Configure tank top, bottom, and initial level', content: col(<>
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 14px', width: 180 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>ST1 Properties</div>
          {[['Top (m)', '60.0'],['Bottom (m)', '30.0'],['Initial level (m)', '45.0'],['Area (m²)', '5.0']].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontSize: 9, color: '#64748b' }}>{k}</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: '#7c3aed', fontFamily: 'monospace' }}>{v}</span>
            </div>
          ))}
        </div>
        <Chip text="Surge suppressed ✓" color="#16a34a" />
      </>) },
    ];

    // ── v-flow-bc ─────────────────────────────────────────────────────────
    case 'v-flow-bc': return [
      { ms: 1800, title: 'Place a Flow BC element on the canvas', content: col(<>
        <VFlowBC size={48} />
        <Chip text="Flow BC injects / withdraws flow" color="#ea580c" />
      </>) },
      { ms: 2000, title: 'Connect Flow BC to a network node', content: col(<>
        {row(<>
          <VFlowBC size={40} />
          <div style={{ position: 'relative', width: 48, height: 16 }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ position: 'absolute', top: '50%', left: `${i * 34}%`, transform: 'translateY(-50%)', width: 8, height: 8, borderRadius: '50%', background: '#1a73e8', animation: `vp-dot 1s ${i * 330}ms infinite` }} />
            ))}
            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 2, background: '#cbd5e1', transform: 'translateY(-50%)' }} />
          </div>
          <VArrow w={14} color="#1a73e8" />
          <VN label="N5" size={36} pulse />
        </>)}
        <Chip text="Flow injected into N5" />
      </>) },
      { ms: 2000, title: 'Choose operating mode: Fixed or Q-Schedule', content: col(<>
        {row(<>
          <div style={{ padding: '6px 10px', borderRadius: 6, border: '1.5px solid #e2e8f0', background: '#f8fafc', opacity: 0.6 }}><span style={{ fontSize: 9, fontWeight: 700, color: '#64748b' }}>Fixed Q</span></div>
          <div style={{ padding: '6px 10px', borderRadius: 6, border: '2px solid #1a73e8', background: '#dbeafe' }}><span style={{ fontSize: 9, fontWeight: 700, color: '#1a73e8' }}>Q-Schedule ✓</span></div>
        </>, 10)}
        <Chip text="Q-Schedule varies flow over time" />
      </>) },
      { ms: 2000, title: 'Configure the flow rate or schedule', content: col(<>
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 14px', width: 180 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>Q1 Properties</div>
          {[['Mode','Q-Schedule'],['Q (m³/s)','0.200'],['T-start (s)','0.0'],['T-end (s)','10.0']].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontSize: 9, color: '#64748b' }}>{k}</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: '#ea580c', fontFamily: 'monospace' }}>{v}</span>
            </div>
          ))}
        </div>
        <Chip text="Flow BC configured ✓" color="#16a34a" />
      </>) },
    ];

    // ── v-conduit ─────────────────────────────────────────────────────────
    case 'v-conduit': return [
      { ms: 1800, title: 'Select a conduit in the Flex Table', content: col(<>
        <MiniTable headers={['Label','Length','Diam.','Material']} rows={[['C1','250','0.6','Steel'],['C2','180','0.5','Steel'],['C3','320','0.8','HDPE']]} hlRow={0} hlCol={0} />
        <Chip text="Select conduit row to edit" />
      </>) },
      { ms: 2000, title: 'Set Length and Diameter', content: col(<>
        {row(<>
          <VN label="N1" size={34} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Chip text="L = 250 m" />
            <div style={{ width: 70, height: 3, background: '#475569', borderRadius: 2 }} />
            <Chip text="D = 0.6 m" color="#7c3aed" />
          </div>
          <VN label="N2" size={34} />
        </>)}
      </>) },
      { ms: 2000, title: 'Select pipe material from dropdown', content: col(<>
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', width: 175 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#64748b', marginBottom: 5 }}>Material</div>
          {['Steel (a=1300)','Cast Iron','HDPE','Asbestos cement'].map((m,i) => (
            <div key={m} style={{ padding: '3px 6px', borderRadius: 4, background: i === 0 ? '#dbeafe' : 'transparent', fontSize: 9, color: i === 0 ? '#1a73e8' : '#475569', fontWeight: i === 0 ? 700 : 400, marginBottom: 1 }}>{m}</div>
          ))}
        </div>
        <Chip text="Material auto-fills celerity" />
      </>) },
      { ms: 2200, title: 'Celerity (wave speed) is auto-calculated', content: col(<>
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 14px', width: 180 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>C1 — Steel Pipe</div>
          {[['Length (m)','250.0'],['Diameter (m)','0.600'],['Celerity a (m/s)','1300 ✓'],['Darcy f','0.015'],['Courant #','0.98 ✓']].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontSize: 9, color: '#64748b' }}>{k}</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: '#0891b2', fontFamily: 'monospace' }}>{v}</span>
            </div>
          ))}
        </div>
      </>) },
    ];

    // ── v-flex-table ──────────────────────────────────────────────────────
    case 'v-flex-table': return [
      { ms: 1800, title: 'Open the Flex Table from the toolbar', content: col(<>
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', width: 200 }}>
          <div style={{ background: '#1e293b', padding: '5px 10px', fontSize: 9, fontWeight: 700, color: 'white' }}>Flex Table</div>
          <MiniTable headers={['Label','From','To','Length']} rows={[['C1','R1','N1','250'],['C2','N1','N2','180'],['C3','N2','N3','320']]} />
        </div>
        <Chip text="Open: Tools → Flex Table" />
      </>) },
      { ms: 2000, title: 'Filter by element type', content: col(<>
        {row(<>
          {['All','Nodes','Conduits'].map((t, i) => (
            <div key={t} style={{ padding: '4px 8px', borderRadius: 14, border: `1.5px solid ${i === 2 ? '#1a73e8' : '#e2e8f0'}`, background: i === 2 ? '#dbeafe' : 'white', fontSize: 9, fontWeight: i === 2 ? 700 : 400, color: i === 2 ? '#1a73e8' : '#64748b' }}>{t}</div>
          ))}
        </>, 5)}
        <MiniTable headers={['Label','Length','Diam.','a (m/s)']} rows={[['C1','250','0.60','1300'],['C2','180','0.50','1100'],['C3','320','0.80','1200']]} />
      </>) },
      { ms: 2200, title: 'Click any cell to edit inline', content: col(<>
        <MiniTable headers={['Label','Length','Diam.','a (m/s)']} rows={[['C1','250','0.60','1300'],['C2','180','0.55','1100'],['C3','320','0.80','1200']]} hlRow={1} hlCol={2} editVal="0.55" />
        <Chip text="Click cell → type new value → Enter" />
      </>) },
      { ms: 2000, title: 'Toggle SI / FPS units', content: col(<>
        {row(<>
          <div style={{ padding: '5px 12px', borderRadius: 6, border: '2px solid #1a73e8', background: '#dbeafe', fontSize: 10, fontWeight: 700, color: '#1a73e8' }}>SI</div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>⇌</div>
          <div style={{ padding: '5px 12px', borderRadius: 6, border: '1.5px solid #e2e8f0', background: 'white', fontSize: 10, fontWeight: 700, color: '#64748b' }}>FPS</div>
        </>, 10)}
        <Chip text="All values convert automatically" color="#16a34a" />
      </>) },
    ];

    // ── v-excel-import ────────────────────────────────────────────────────
    case 'v-excel-import': return [
      { ms: 1800, title: 'Export a template workbook from the Flex Table', content: col(<>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 46, background: '#1a73e8', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <img src={damIcon} alt="" style={{ width: 20, height: 20, filter: 'brightness(0) invert(1)' }} />
          </div>
          <VArrow w={36} color="#16a34a" animated />
          <div style={{ width: 36, height: 44, background: '#16a34a', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 16, fontWeight: 900, color: 'white' }}>X</span>
          </div>
        </div>
        <Chip text="Export template.xlsx first" color="#16a34a" />
      </>) },
      { ms: 2000, title: 'Edit data values directly in Excel', content: col(<>
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', width: 200 }}>
          <div style={{ background: '#16a34a', padding: '4px 8px', fontSize: 9, fontWeight: 700, color: 'white' }}>data.xlsx — Conduits</div>
          <MiniTable headers={['Label','Length','Diam.']} rows={[['C1','250','0.60'],['C2','200','0.55'],['C3','320','0.80']]} hlRow={1} hlCol={1} editVal="200" />
        </div>
        <Chip text="Edit values freely in Excel" />
      </>) },
      { ms: 2000, title: 'Import the edited workbook back into WHAMO', content: col(<>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 44, background: '#16a34a', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 16, fontWeight: 900, color: 'white' }}>X</span>
          </div>
          <VArrow w={36} color="#1a73e8" animated />
          <div style={{ width: 38, height: 46, background: '#1a73e8', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <img src={damIcon} alt="" style={{ width: 20, height: 20, filter: 'brightness(0) invert(1)' }} />
          </div>
        </div>
        <Chip text="Flex Table → Import → select file" />
      </>) },
      { ms: 2000, title: 'Rows matched by Label column — data updated', content: col(<>
        <MiniTable headers={['Label','Length','Status']} rows={[['C1','250','✓ unchanged'],['C2','200','✓ updated'],['C3','320','✓ unchanged']]} hlRow={1} hlCol={2} />
        <Chip text="Matched by Label column ✓" color="#16a34a" />
      </>) },
    ];

    // ── v-excel-export ────────────────────────────────────────────────────
    case 'v-excel-export': return [
      { ms: 1800, title: 'Open the Flex Table — filter to element type', content: col(<>
        <MiniTable headers={['Label','Length','Diam.','a']} rows={[['C1','250','0.60','1300'],['C2','180','0.50','1100'],['C3','320','0.80','1200']]} />
        <Chip text="Flex Table showing Conduits" />
      </>) },
      { ms: 2000, title: 'Click Export button — choose scope', content: col(<>
        {row(<>
          <div style={{ padding: '6px 10px', borderRadius: 6, border: '1.5px solid #e2e8f0', background: '#f8fafc', fontSize: 9, fontWeight: 700, color: '#64748b' }}>This type</div>
          <div style={{ padding: '6px 10px', borderRadius: 6, border: '2px solid #1a73e8', background: '#dbeafe', fontSize: 9, fontWeight: 700, color: '#1a73e8', animation: 'vp-glow 1.5s infinite' }}>All Types ✓</div>
        </>, 8)}
        <Chip text="All Types = multi-sheet workbook" />
      </>) },
      { ms: 2000, title: 'Multi-sheet workbook generated', content: col(<>
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', width: 185 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#16a34a', marginBottom: 5 }}>network.xlsx</div>
          {['Reservoirs','Nodes','Junctions','Conduits','…'].map((s,i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2, opacity: i > 3 ? 0.5 : 1 }}>
              <span style={{ fontSize: 9 }}>📄</span>
              <span style={{ fontSize: 9, color: '#475569', fontFamily: 'monospace' }}>{s}</span>
            </div>
          ))}
        </div>
        <Chip text="9 sheets downloaded ✓" color="#16a34a" />
      </>) },
      { ms: 2000, title: 'Validation dropdowns included for material fields', content: col(<>
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '8px 12px', width: 185 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#15803d', marginBottom: 5 }}>Material column (Excel dropdown)</div>
          {['Steel','Cast Iron','HDPE','Asbestos cement'].map((m, i) => (
            <div key={m} style={{ padding: '2px 5px', borderRadius: 3, background: i === 0 ? '#dcfce7' : 'transparent', fontSize: 9, color: '#374151', marginBottom: 1 }}>{i === 0 ? '✓ ' : ''}{m}</div>
          ))}
        </div>
        <Chip text="Data-validation prevents invalid entries" color="#16a34a" />
      </>) },
    ];

    // ── v-parameters ──────────────────────────────────────────────────────
    case 'v-parameters': return [
      { ms: 1800, title: 'Open Generate → .INP/.OUT panel', content: col(<>
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 14px', width: 185 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>Simulation Parameters</div>
          {[['DTCOMP (s)','—'],['DTOUT (s)','—'],['TMAX (s)','—']].map(([k,v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 9, color: '#64748b' }}>{k}</span>
              <span style={{ fontSize: 9, fontFamily: 'monospace', color: '#94a3b8' }}>{v}</span>
            </div>
          ))}
        </div>
        <Chip text="Computational Parameters available in generation panel" />
      </>) },
      { ms: 2000, title: 'Set DTCOMP — computational time step', content: col(<>
        <div style={{ width: 185 }}>
          {[['DTCOMP','0.010 s','#1a73e8', 1], ['DTOUT','—','#7c3aed',0],['TMAX','—','#16a34a',0]].map(([l,v,c,active]) => (
            <div key={l as string} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: '#64748b', width: 56 }}>{l}</span>
              <div style={{ flex: 1, height: 7, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: c as string, borderRadius: 4, width: active ? '35%' : '0%', transition: 'width 0.5s' }} />
              </div>
              <span style={{ fontSize: 9, fontWeight: active ? 700 : 400, color: active ? c as string : '#94a3b8', fontFamily: 'monospace', width: 44 }}>{v as string}</span>
            </div>
          ))}
        </div>
        <Chip text="DTCOMP = Δx/a (Courant condition)" />
      </>) },
      { ms: 2000, title: 'Set DTOUT and TMAX for the simulation', content: col(<>
        <div style={{ width: 185 }}>
          {[['DTCOMP','0.010 s','#1a73e8', 35], ['DTOUT','0.100 s','#7c3aed', 60],['TMAX','30.0 s','#16a34a', 80]].map(([l,v,c,pct]) => (
            <div key={l as string} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: '#64748b', width: 56 }}>{l}</span>
              <div style={{ flex: 1, height: 7, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: c as string, borderRadius: 4, width: `${pct}%` }} />
              </div>
              <span style={{ fontSize: 9, fontWeight: 700, color: c as string, fontFamily: 'monospace', width: 44 }}>{v as string}</span>
            </div>
          ))}
        </div>
      </>) },
      { ms: 2200, title: 'Verify Courant condition is satisfied', content: col(<>
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', width: 185 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#15803d', marginBottom: 6 }}>Courant Check</div>
          {[['Cr = a·Δt/Δx','≤ 1.0'],['Longest pipe Δx','25.0 m'],['a·DTCOMP','13.0 m'],['Courant #','0.52 ✓']].map(([k,v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontSize: 9, color: '#16a34a' }}>{k}</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: '#15803d', fontFamily: 'monospace' }}>{v}</span>
            </div>
          ))}
        </div>
        <Chip text="Courant condition satisfied ✓" color="#16a34a" />
      </>) },
    ];

    // ── v-visualization ───────────────────────────────────────────────────
    case 'v-visualization': return [
      { ms: 1800, title: 'Open Tools → Visualization', content: col(<>
        {row(<>
          <ToolBtn icon="📊" label="Visualize" active />
          <ToolBtn icon="📋" label="Table" />
          <ToolBtn icon="📁" label="Files" />
        </>, 8)}
        <Chip text="Loads .OUT results file for viewing" color="#0891b2" />
      </>) },
      { ms: 2000, title: 'Load a .OUT results file', content: col(<>
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 14px', width: 185 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#64748b', marginBottom: 5 }}>Select .OUT file</div>
          <div style={{ padding: '5px 8px', borderRadius: 5, border: '1.5px dashed #94a3b8', fontSize: 9, color: '#64748b', marginBottom: 6 }}>network_run1.out ✓</div>
          <div style={{ padding: '5px', borderRadius: 5, background: '#1a73e8', color: 'white', fontSize: 9, fontWeight: 700, textAlign: 'center', animation: 'vp-glow 1.5s infinite' }}>Load File</div>
        </div>
        <Chip text=".OUT file loaded successfully" color="#16a34a" />
      </>) },
      { ms: 2400, title: 'Profile Graph — animated HGL over pipe stations', content: col(<>
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 6, padding: '5px 8px', width: '95%' }}>
          <div style={{ fontSize: 8, fontWeight: 700, color: '#0891b2', marginBottom: 3 }}>HGL Profile — t = 2.4 s</div>
          <svg width="100%" height={62}>
            {[15,30,45].map(y => <line key={y} x1={8} y1={y} x2="98%" y2={y} stroke="#f1f5f9" strokeWidth={1} />)}
            <path d="M8,50 L40,42 L75,38 L110,24 L150,30 L185,18 L215,28" stroke="#ef4444" strokeWidth={1.5} fill="none" strokeDasharray="4,3" opacity={0.6} />
            <path d="M8,56 L40,52 L75,50 L110,45 L150,52 L185,46 L215,55" stroke="#3b82f6" strokeWidth={1.5} fill="none" strokeDasharray="4,3" opacity={0.6} />
            <path d="M8,52 L40,46 L75,42 L110,30 L150,40 L185,26 L215,38" stroke="#1a73e8" strokeWidth={2.5} fill="none"
              style={{ strokeDasharray: 280, animation: 'vp-chart 2s ease-out infinite alternate' }} />
            <text x="50%" y={60} fontSize={7} fill="#94a3b8" textAnchor="middle">Pipe station →</text>
          </svg>
          {row(<><Chip text="Max" color="#ef4444" /><Chip text="HGL" /><Chip text="Min" color="#3b82f6" /></>, 5)}
        </div>
      </>) },
      { ms: 2200, title: 'Switch to History Graph — time-series at a node', content: col(<>
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 6, padding: '5px 8px', width: '95%' }}>
          <div style={{ fontSize: 8, fontWeight: 700, color: '#7c3aed', marginBottom: 3 }}>History — Node N5 Pressure (m)</div>
          <svg width="100%" height={62}>
            {[15,30,45].map(y => <line key={y} x1={8} y1={y} x2="98%" y2={y} stroke="#f1f5f9" strokeWidth={1} />)}
            <path d="M8,30 C25,28 35,18 55,12 C70,8 80,22 100,25 C120,28 140,35 160,30 C175,26 195,28 215,30" stroke="#7c3aed" strokeWidth={2.5} fill="none"
              style={{ strokeDasharray: 280, animation: 'vp-chart 2s ease-out infinite alternate' }} />
            <text x="50%" y={60} fontSize={7} fill="#94a3b8" textAnchor="middle">Time (s) →</text>
          </svg>
        </div>
        <Chip text="Time-series at selected node/pipe" color="#7c3aed" />
      </>) },
    ];

    // ── v-inp ─────────────────────────────────────────────────────────────
    case 'v-inp': return [
      { ms: 1800, title: 'Run network validation first', content: col(<>
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', width: 185 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#1e293b', marginBottom: 5 }}>Validation</div>
          {['All nodes connected ✓','No orphan elements ✓','Courant satisfied ✓','Reservoirs defined ✓'].map(msg => (
            <div key={msg} style={{ fontSize: 9, color: '#16a34a', marginBottom: 2 }}>{msg}</div>
          ))}
        </div>
        <Chip text="Network valid — ready to generate" color="#16a34a" />
      </>) },
      { ms: 2000, title: 'Configure output requests in the panel', content: col(<>
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', width: 185 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#1e293b', marginBottom: 5 }}>Output Requests</div>
          {[['HGRAPH N5','✓ Head history'],['PGRAPH N5','✓ Pressure history'],['PROFILE','✓ Pipe profiles'],['MAXMIN','✓ Envelope']].map(([k,v]) => (
            <div key={k} style={{ display: 'flex', gap: 6, marginBottom: 3 }}>
              <span style={{ fontSize: 8, fontFamily: 'monospace', color: '#1a73e8', width: 72 }}>{k}</span>
              <span style={{ fontSize: 8, color: '#16a34a' }}>{v}</span>
            </div>
          ))}
        </div>
      </>) },
      { ms: 2000, title: 'Click Generate → .INP to produce the file', content: col(<>
        <div style={{ padding: '7px 20px', borderRadius: 8, background: '#d97706', color: 'white', fontSize: 11, fontWeight: 700, animation: 'vp-glow 1.5s infinite', cursor: 'default' }}>
          ⬇ Generate .INP
        </div>
        <Chip text="Validates → writes WHAMO input file" color="#d97706" />
      </>) },
      { ms: 2200, title: 'INP file downloads — inspect the output', content: col(<>
        <div style={{ background: '#1e293b', borderRadius: 8, padding: '7px 10px', width: 200, fontFamily: 'monospace', fontSize: 8 }}>
          {[['RESERVOIRS','#f59e0b'],['  RESRV ID R1 HW 120.0 FINISH','#86efac'],['CONDUITS','#f59e0b'],['  PIPE ID C1 FROM R1 TO N1 L 250','#86efac']].map(([t,c], i) => (
            <div key={i} style={{ color: c, overflow: 'hidden', whiteSpace: 'nowrap' }}>{t}</div>
          ))}
          <span style={{ color: '#fff', animation: 'vp-blink 0.8s step-end infinite' }}>█</span>
        </div>
        <Chip text="network.INP downloaded ✓" color="#16a34a" />
      </>) },
    ];

    // ── v-out ─────────────────────────────────────────────────────────────
    case 'v-out': return [
      { ms: 1800, title: 'Confirm parameters and add output requests', content: col(<>
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', width: 180 }}>
          {[['DTCOMP','0.010 s'],['DTOUT','0.100 s'],['TMAX','30.0 s']].map(([k,v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 9, color: '#64748b' }}>{k}</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: '#16a34a', fontFamily: 'monospace' }}>{v} ✓</span>
            </div>
          ))}
        </div>
        <Chip text="Parameters ready" color="#16a34a" />
      </>) },
      { ms: 1800, title: 'Click Generate → .OUT', content: col(<>
        <div style={{ padding: '8px 22px', borderRadius: 8, background: '#15803d', color: 'white', fontSize: 12, fontWeight: 700, animation: 'vp-glow 1.5s infinite' }}>
          ⬇ Generate .OUT
        </div>
        <Chip text="Sends .INP to WHAMO engine" color="#15803d" />
      </>) },
      { ms: 2400, title: 'WHAMO engine running — progress updates', content: col(<>
        <div style={{ position: 'relative', width: 48, height: 48 }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '4px solid #e2e8f0' }} />
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '4px solid transparent', borderTopColor: '#15803d', animation: 'vp-spin 0.9s linear infinite' }} />
          <div style={{ position: 'absolute', inset: 8, borderRadius: '50%', background: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 12 }}>⚙</span>
          </div>
        </div>
        <div style={{ width: 180, height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: 'linear-gradient(90deg,#15803d,#22c55e)', borderRadius: 4, animation: 'vp-prog 2.2s ease-in-out infinite alternate' }} />
        </div>
        <Chip text="WHAMO.EXE running…" color="#15803d" />
      </>) },
      { ms: 2200, title: '.OUT results file ready — load in Visualization', content: col(<>
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', width: 185 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#15803d', marginBottom: 5 }}>✓ Complete</div>
          {[['Runtime','2.3 s'],['Time steps','3 000'],['Output pts','300'],['File size','1.4 MB']].map(([k,v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontSize: 9, color: '#64748b' }}>{k}</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: '#15803d', fontFamily: 'monospace' }}>{v}</span>
            </div>
          ))}
        </div>
        <Chip text="network_run1.out downloaded ✓" color="#16a34a" />
      </>) },
    ];

    // ── v-workflow ────────────────────────────────────────────────────────
    case 'v-workflow': return [
      { ms: 2000, title: 'Step 1: Design your network on the canvas', content: col(<>
        {row(<>
          <VN icon={damIcon} label="R1" size={34} />
          <VArrow w={22} />
          <VN label="N1" size={30} />
          <VArrow w={22} />
          <VArrow w={22} />
          <VN label="N2" size={30} />
        </>)}
        <Chip text="1 / 5 — Design network" color="#1a73e8" />
      </>) },
      { ms: 2000, title: 'Step 2: Edit properties in the Flex Table', content: col(<>
        <MiniTable headers={['Label','Length','Diam.','a']} rows={[['C1','250','0.60','1300'],['C2','180','0.50','1100']]} hlRow={0} hlCol={2} />
        <Chip text="2 / 5 — Configure properties" color="#7c3aed" />
      </>) },
      { ms: 2000, title: 'Step 3: Generate the .INP file', content: col(<>
        <div style={{ background: '#1e293b', borderRadius: 7, padding: '6px 10px', width: 185, fontFamily: 'monospace', fontSize: 8 }}>
          {[['RESERVOIRS','#f59e0b'],['  RESRV ID R1 ...','#86efac'],['CONDUITS','#f59e0b'],['  PIPE ID C1 ...','#86efac']].map(([t,c],i) => <div key={i} style={{ color: c }}>{t}</div>)}
        </div>
        <Chip text="3 / 5 — Generate .INP" color="#d97706" />
      </>) },
      { ms: 2000, title: 'Step 4: Run the WHAMO simulation engine', content: col(<>
        <div style={{ width: 185, height: 9, background: '#f1f5f9', borderRadius: 5, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: 'linear-gradient(90deg,#0891b2,#22d3ee)', borderRadius: 5, animation: 'vp-prog 2s ease-in-out infinite alternate' }} />
        </div>
        <Chip text="4 / 5 — Run WHAMO engine" color="#0891b2" />
      </>) },
      { ms: 2200, title: 'Step 5: Review results in Visualization', content: col(<>
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 6, padding: '4px 7px', width: '95%' }}>
          <svg width="100%" height={52}>
            <path d="M6,42 L36,32 L66,38 L96,20 L130,34 L164,22 L195,30" stroke="#ef4444" strokeWidth={1.5} fill="none" strokeDasharray="4,3" opacity={0.6} />
            <path d="M6,38 L36,26 L66,32 L96,14 L130,28 L164,16 L195,24" stroke="#1a73e8" strokeWidth={2.5} fill="none" style={{ strokeDasharray: 260, animation: 'vp-chart 2s ease-out infinite alternate' }} />
            <path d="M6,48 L36,46 L66,48 L96,44 L130,50 L164,46 L195,48" stroke="#3b82f6" strokeWidth={1.5} fill="none" strokeDasharray="4,3" opacity={0.6} />
          </svg>
        </div>
        <Chip text="5 / 5 — View HGL results ✓" color="#16a34a" />
      </>) },
    ];

    default: return [
      { ms: 2000, title: 'Demo guide', content: <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}><Video className="w-8 h-8 text-slate-300" /></div> },
    ];
  }
}

// ─── VideoPlayer — React step-cycling animated guide ──────────────────────────

function VideoPlayer({ id }: { id: string }) {
  const frames = buildFrames(id);
  const [fi, setFi] = useState(0);
  const [visible, setVisible] = useState(true);

  // Cycle frames: fade out → advance → fade in
  useEffect(() => {
    const dur = frames[fi]?.ms ?? 2000;
    const t = setTimeout(() => {
      setVisible(false);
      const t2 = setTimeout(() => {
        setFi(prev => (prev + 1) % frames.length);
        setVisible(true);
      }, 280);
      return () => clearTimeout(t2);
    }, dur);
    return () => clearTimeout(t);
  }, [fi, frames.length]);

  const frame = frames[fi];

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'linear-gradient(135deg,#f8fafc 0%,#f1f5f9 100%)' }}>
      {/* Header bar with step title + dots */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', background: 'rgba(15,23,42,0.82)', backdropFilter: 'blur(2px)', flexShrink: 0 }}>
        <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#1a73e8', animation: 'vp-pulse 1.4s ease-in-out infinite', flexShrink: 0 }} />
        <span style={{ fontSize: 8.5, fontWeight: 600, color: '#e2e8f0', fontFamily: 'Poppins,sans-serif', flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{frame?.title}</span>
        <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
          {frames.map((_, i) => (
            <div key={i} style={{ height: 5, borderRadius: 3, background: i === fi ? '#1a73e8' : '#475569', width: i === fi ? 14 : 5, transition: 'width 0.3s ease, background 0.3s ease' }} />
          ))}
        </div>
      </div>
      {/* Content area — fades between frames */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '10px 12px 8px',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.28s ease-in-out',
      }}>
        {frame?.content}
      </div>
    </div>
  );
}

// (AnimatedScene replaced by VideoPlayer + buildFrames above)
function _ObsoleteAnimatedScene({ id }: { id: string }) {
  const _dummy = id;
  return null;

  switch (_dummy) {

    // ── Reservoir ──────────────────────────────────────────────────────────
    case 'v-reservoir': return (
      <div style={sceneStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <AN icon={damIcon} label="R1" size={42} style={{ animation: 'va-pop 0.6s 0s both, va-glow 2s 0.8s infinite' }} />
            <div style={{ overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
              <div style={{ animation: 'va-grow-w 0.7s 0.9s both', width: 44, height: 2, background: '#64748b', flexShrink: 0 }} />
              <div style={{ width: 0, height: 0, borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderLeft: '7px solid #64748b', animation: 'va-slide-r 0.3s 1.6s both', flexShrink: 0 }} />
            </div>
            <AN label="N1" size={36} style={{ animation: 'va-pop 0.6s 1.7s both' }} />
          </div>
          <div style={{ display: 'flex', gap: 8, animation: 'va-slide-u 0.5s 2.2s both' }}>
            <ALabel text="Elevation: 120 m" delay="2.2s" />
            <ALabel text="Mode: Fixed" delay="2.4s" color="#16a34a" />
          </div>
        </div>
      </div>
    );

    // ── Node ───────────────────────────────────────────────────────────────
    case 'v-node': return (
      <div style={sceneStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <AN icon={damIcon} label="R1" size={38} style={{ animation: 'va-pop 0.5s 0s both' }} />
          <AArrow w={28} />
          <AN label="N1" size={34} style={{ animation: 'va-pop 0.5s 0.7s both' }} />
          <AArrow w={28} />
          <AN label="N2" size={34} style={{ animation: 'va-pop 0.5s 1.4s both' }} />
          <AArrow w={28} />
          <AN label="N3" size={34} style={{ animation: 'va-pop 0.5s 2.1s both' }} />
        </div>
        <div style={{ position: 'absolute', bottom: 10, display: 'flex', gap: 6, animation: 'va-slide-u 0.5s 2.8s both' }}>
          <ALabel text="Elev: 45 m" delay="2.8s" />
          <ALabel text="Elev: 38 m" delay="3s" />
          <ALabel text="Elev: 30 m" delay="3.2s" />
        </div>
      </div>
    );

    // ── Junction ───────────────────────────────────────────────────────────
    case 'v-junction': return (
      <div style={sceneStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <AN label="N1" size={34} style={{ animation: 'va-pop 0.5s 0s both' }} />
            <AArrow w={24} />
            <AN icon={yIntersectionIcon} label="J1" size={40} style={{ animation: 'va-pop 0.5s 0.8s both, va-glow 2s 1.4s infinite' }} />
            <AArrow w={24} />
            <AN label="N2" size={34} style={{ animation: 'va-pop 0.5s 1.6s both' }} />
          </div>
          {/* Demand off-take arrow downward */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'va-slide-u 0.5s 2.2s both' }}>
            <div style={{ width: 2, height: 18, background: '#f59e0b', animation: 'va-grow-h 0.5s 2.2s both' }} />
            <div style={{ width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '8px solid #f59e0b' }} />
            <ALabel text="Q = 0.05 m³/s" color="#f59e0b" delay="2.7s" />
          </div>
        </div>
      </div>
    );

    // ── Surge Tank ─────────────────────────────────────────────────────────
    case 'v-surge-tank': return (
      <div style={sceneStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
          {/* Surge tank above */}
          <AN icon={waterTankIcon} label="ST1" size={40} style={{ animation: 'va-pop 0.6s 0s both, va-pulse 2s 1s infinite' }} />
          {/* Vertical riser */}
          <div style={{ width: 2, height: 20, background: '#94a3b8', animation: 'va-grow-h 0.4s 0.8s both' }} />
          {/* Main pipeline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, animation: 'va-pop 0.5s 1.3s both' }}>
            <AN label="N1" size={34} />
            <AArrow w={22} />
            <AN label="N2" size={34} />
            <AArrow w={22} />
            <AN label="N2" size={34} />
          </div>
          <ALabel text="Surge suppressed ✓" color="#16a34a" delay="2.2s" style={{ marginTop: 8, animation: 'va-slide-u 0.5s 2.2s both' }} />
        </div>
      </div>
    );

    // ── Flow BC ────────────────────────────────────────────────────────────
    case 'v-flow-bc': return (
      <div style={sceneStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <AFlowBC size={40} style={{ animation: 'va-pop 0.6s 0s both' } as any} />
            {/* animated flow particles */}
            <div style={{ position: 'relative', width: 50, height: 20 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  position: 'absolute', top: '50%', left: `${i * 30}%`, transform: 'translateY(-50%)',
                  width: 8, height: 8, borderRadius: '50%', background: '#1a73e8', opacity: 0,
                  animation: `va-flow 1.2s ${D(i * 400 + 800)} infinite`,
                }} />
              ))}
              <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 2, background: '#cbd5e1', transform: 'translateY(-50%)' }} />
            </div>
            <AArrow w={18} color="#1a73e8" />
            <AN label="N1" size={36} style={{ animation: 'va-pop 0.5s 0.9s both' }} />
          </div>
          <div style={{ display: 'flex', gap: 6, animation: 'va-slide-u 0.5s 2s both' }}>
            <ALabel text="Mode: Q-Schedule" delay="2s" />
            <ALabel text="Q = 0.2 m³/s" color="#f59e0b" delay="2.3s" />
          </div>
        </div>
      </div>
    );

    // ── Conduit ────────────────────────────────────────────────────────────
    case 'v-conduit': return (
      <div style={sceneStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <AN label="N1" size={32} style={{ animation: 'va-pop 0.5s 0s both' }} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <ALabel text="L = 250 m" delay="0.8s" />
              <div style={{ width: 70, height: 3, background: '#475569', borderRadius: 2, animation: 'va-grow-w 0.6s 0.5s both' }} />
              <ALabel text="D = 0.6 m" delay="1.2s" color="#7c3aed" />
            </div>
            <AN label="N2" size={32} style={{ animation: 'va-pop 0.5s 0.5s both' }} />
          </div>
          <div style={{ display: 'flex', gap: 5, animation: 'va-slide-u 0.5s 2s both' }}>
            <ALabel text="a = 1200 m/s" delay="2s" color="#0891b2" />
            <ALabel text="f = 0.015" delay="2.3s" color="#d97706" />
          </div>
        </div>
      </div>
    );

    // ── Flex Table ─────────────────────────────────────────────────────────
    case 'v-flex-table': return (
      <div style={sceneStyle}>
        <div style={{ animation: 'va-pop 0.5s 0s both', background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden', width: '85%' }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr 1fr', background: '#1e293b', padding: '4px 8px' }}>
            {['Label', 'Length', 'Diameter', 'Celerity'].map(h => (
              <span key={h} style={{ fontSize: 8, fontWeight: 700, color: 'white' }}>{h}</span>
            ))}
          </div>
          {/* Rows */}
          {[
            ['C1', '250', '0.6', '1200'],
            ['C2', '180', '0.5', '1100'],
            ['C3', '320', '0.8', '1250'],
          ].map(([lbl, l, d, a], i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '60px 1fr 1fr 1fr',
              padding: '4px 8px', borderTop: '1px solid #f1f5f9',
              animation: i === 1 ? `va-row-hl 2s ${D(i * 400 + 600)} infinite` : undefined,
            }}>
              {[lbl, l, d, a].map((v, j) => (
                <span key={j} style={{ fontSize: 9, color: i === 1 && j === 2 ? '#1a73e8' : '#374151', fontWeight: i === 1 && j === 2 ? 700 : 400, fontFamily: 'monospace' }}>{v}{j > 0 && i === 1 && j === 2 ? '|' : ''}</span>
              ))}
            </div>
          ))}
        </div>
        <ALabel text="Editing inline ✎" delay="1.8s" style={{ position: 'absolute', bottom: 8, animation: 'va-slide-u 0.5s 1.8s both' }} />
      </div>
    );

    // ── Excel Import ───────────────────────────────────────────────────────
    case 'v-excel-import': return (
      <div style={sceneStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Excel file */}
          <div style={{ animation: 'va-pop 0.5s 0s both', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <div style={{ width: 40, height: 48, background: '#16a34a', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 900, color: 'white' }}>X</span>
            </div>
            <span style={{ fontSize: 8, fontWeight: 700, color: '#16a34a' }}>data.xlsx</span>
          </div>
          {/* Animated arrow */}
          <div style={{ display: 'flex', alignItems: 'center', animation: 'va-arrow 1s 0.8s infinite' }}>
            <div style={{ width: 36, height: 3, background: '#1a73e8', borderRadius: 2 }} />
            <div style={{ width: 0, height: 0, borderTop: '6px solid transparent', borderBottom: '6px solid transparent', borderLeft: '10px solid #1a73e8' }} />
          </div>
          {/* App icon */}
          <div style={{ animation: 'va-pop 0.5s 1.4s both', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: '#1a73e8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={damIcon} alt="" style={{ width: 24, height: 24, filter: 'brightness(0) invert(1)' }} />
            </div>
            <span style={{ fontSize: 8, fontWeight: 700, color: '#1a73e8' }}>WHAMO</span>
          </div>
        </div>
        <ALabel text="Matched by Label column" delay="2.2s" style={{ position: 'absolute', bottom: 8, animation: 'va-slide-u 0.5s 2.2s both' }} />
      </div>
    );

    // ── Excel Export ───────────────────────────────────────────────────────
    case 'v-excel-export': return (
      <div style={sceneStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* App icon */}
          <div style={{ animation: 'va-pop 0.5s 0s both', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: '#1a73e8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={damIcon} alt="" style={{ width: 24, height: 24, filter: 'brightness(0) invert(1)' }} />
            </div>
            <span style={{ fontSize: 8, fontWeight: 700, color: '#1a73e8' }}>WHAMO</span>
          </div>
          {/* Animated arrow */}
          <div style={{ display: 'flex', alignItems: 'center', animation: 'va-arrow 1s 0.6s infinite' }}>
            <div style={{ width: 36, height: 3, background: '#16a34a', borderRadius: 2 }} />
            <div style={{ width: 0, height: 0, borderTop: '6px solid transparent', borderBottom: '6px solid transparent', borderLeft: '10px solid #16a34a' }} />
          </div>
          {/* Excel */}
          <div style={{ animation: 'va-pop 0.5s 1.2s both', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <div style={{ width: 40, height: 48, background: '#16a34a', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 900, color: 'white' }}>X</span>
            </div>
            <span style={{ fontSize: 8, fontWeight: 700, color: '#16a34a' }}>network.xlsx</span>
          </div>
        </div>
        <ALabel text="9 sheets · validation dropdowns" delay="2s" style={{ position: 'absolute', bottom: 8, animation: 'va-slide-u 0.5s 2s both' }} />
      </div>
    );

    // ── Parameters ─────────────────────────────────────────────────────────
    case 'v-parameters': return (
      <div style={sceneStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, width: '80%', animation: 'va-pop 0.5s 0s both' }}>
          {[
            { label: 'DTCOMP', val: '0.01 s', color: '#1a73e8', delay: '0.3s' },
            { label: 'DTOUT',  val: '0.1 s',  color: '#7c3aed', delay: '0.7s' },
            { label: 'TMAX',   val: '30 s',   color: '#16a34a', delay: '1.1s' },
          ].map(({ label, val, color, delay }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, animation: `va-slide-l 0.4s ${delay} both` }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: '#64748b', width: 54 }}>{label}</span>
              <div style={{ flex: 1, height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: color, borderRadius: 3, animation: `va-prog 1.5s ${delay} both` }} />
              </div>
              <span style={{ fontSize: 9, fontWeight: 700, color, width: 36, textAlign: 'right' }}>{val}</span>
            </div>
          ))}
          <ALabel text="Courant condition satisfied ✓" color="#16a34a" delay="2.2s" style={{ alignSelf: 'center', animation: 'va-slide-u 0.5s 2.2s both' }} />
        </div>
      </div>
    );

    // ── Visualization ──────────────────────────────────────────────────────
    case 'v-visualization': return (
      <div style={sceneStyle}>
        <div style={{ animation: 'va-pop 0.5s 0s both', width: '88%', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#0891b2' }}>HGL Profile — Animated</div>
          <svg width="100%" height={80} style={{ background: 'white', borderRadius: 6, border: '1px solid #e2e8f0' }}>
            {/* Grid lines */}
            {[20, 40, 60].map(y => <line key={y} x1={10} y1={y} x2="98%" y2={y} stroke="#f1f5f9" strokeWidth={1} />)}
            {/* Max envelope */}
            <path d="M10,15 L50,10 L90,18 L130,8 L170,22 L210,12 L250,20"
              stroke="#ef4444" strokeWidth={1.5} fill="none" strokeDasharray="4,3" opacity={0.7} />
            {/* Min envelope */}
            <path d="M10,55 L50,60 L90,52 L130,65 L170,50 L210,62 L250,55"
              stroke="#3b82f6" strokeWidth={1.5} fill="none" strokeDasharray="4,3" opacity={0.7} />
            {/* Animated HGL line */}
            <path d="M10,35 L50,28 L90,38 L130,22 L170,42 L210,30 L250,36"
              stroke="#1a73e8" strokeWidth={2.5} fill="none"
              style={{ strokeDasharray: 320, animation: 'va-chart 2s 0.5s both' }} />
            <text x={12} y={76} fontSize={7} fill="#94a3b8">Pipe station →</text>
            <text x={215} y={12} fontSize={7} fill="#ef4444">Max HGL</text>
            <text x={215} y={62} fontSize={7} fill="#3b82f6">Min HGL</text>
          </svg>
          <div style={{ display: 'flex', gap: 8, animation: 'va-slide-u 0.4s 2.8s both' }}>
            <ALabel text="▶ Play animation" delay="2.8s" color="#1a73e8" />
            <ALabel text="History Graph" delay="3s" color="#0891b2" />
          </div>
        </div>
      </div>
    );

    // ── INP Generation ─────────────────────────────────────────────────────
    case 'v-inp': return (
      <div style={sceneStyle}>
        <div style={{ animation: 'va-pop 0.5s 0s both', width: '88%', background: '#1e293b', borderRadius: 8, padding: '8px 10px', fontFamily: 'monospace', fontSize: 9 }}>
          {[
            { text: 'RESERVOIRS', color: '#f59e0b', delay: '0.3s' },
            { text: '  RESRV ID R1 HW 120.0 FINISH', color: '#86efac', delay: '0.9s' },
            { text: 'CONDUITS', color: '#f59e0b', delay: '1.5s' },
            { text: '  PIPE ID C1 FROM R1 TO N1 L 250 ...', color: '#86efac', delay: '2.1s' },
          ].map(({ text, color, delay }) => (
            <div key={text} style={{ color, animation: `va-slide-l 0.4s ${delay} both`, overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {text}
            </div>
          ))}
          <span style={{ color: '#fff', animation: 'va-blink 1s 0.5s infinite' }}>█</span>
        </div>
      </div>
    );

    // ── OUT / Simulation ───────────────────────────────────────────────────
    case 'v-out': return (
      <div style={sceneStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          {/* Spinning gear */}
          <div style={{ position: 'relative', width: 52, height: 52 }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '4px solid #e2e8f0' }} />
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '4px solid transparent', borderTopColor: '#1a73e8', animation: 'va-spin 1s linear infinite' }} />
            <div style={{ position: 'absolute', inset: 8, borderRadius: '50%', background: '#1a73e8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 14 }}>⚙</span>
            </div>
          </div>
          {/* Progress bar */}
          <div style={{ width: '80%', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#475569', textAlign: 'center' }}>WHAMO.EXE running…</div>
            <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'linear-gradient(90deg,#1a73e8,#0ea5e9)', borderRadius: 4, animation: 'va-prog 3s 0.5s both' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <ALabel text=".INP sent" color="#16a34a" delay="0.5s" />
              <ALabel text=".OUT ready ✓" color="#16a34a" delay="3s" />
            </div>
          </div>
        </div>
      </div>
    );

    // ── Workflow ───────────────────────────────────────────────────────────
    case 'v-workflow': return (
      <div style={sceneStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '88%' }}>
          {[
            { step: 1, label: 'Design Network', color: '#1a73e8', delay: '0s' },
            { step: 2, label: 'Configure Properties', color: '#7c3aed', delay: '0.5s' },
            { step: 3, label: 'Generate .INP File', color: '#d97706', delay: '1s' },
            { step: 4, label: 'Run WHAMO Engine', color: '#0891b2', delay: '1.5s' },
            { step: 5, label: 'View Results & Charts', color: '#16a34a', delay: '2s' },
          ].map(({ step, label, color, delay }) => (
            <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 6, animation: `va-slide-l 0.4s ${delay} both` }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: color, color: 'white', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{step}</div>
              <div style={{ flex: 1, height: 4, background: color, borderRadius: 2, opacity: 0.8 }} />
              <span style={{ fontSize: 9, fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    );

    default: return (
      <div style={sceneStyle}>
        <Video className="w-8 h-8 text-slate-300" />
      </div>
    );
  }
}

function VideoThumbnail({ entry }: { entry: VideoEntry }) {
  return (
    <div className="w-full aspect-video rounded-lg relative overflow-hidden border border-slate-200">
      <VideoPlayer id={entry.id} />
    </div>
  );
}

function VideoCard({ entry }: { entry: VideoEntry }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
      <div className="p-3 pb-2">
        <VideoThumbnail entry={entry} />
      </div>
      <div className="px-3 pb-3 flex flex-col flex-1">
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded text-white ${entry.categoryColor}`}>
            {entry.categoryLabel}
          </span>
          <span className="text-[10px] text-slate-400 ml-auto">{entry.duration}</span>
        </div>
        <p className="text-[12px] font-semibold text-slate-800 leading-snug mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
          {entry.title}
        </p>
        <p className="text-[11px] text-slate-500 leading-relaxed flex-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
          {entry.description}
        </p>
        <button
          disabled
          title="Video not yet available"
          className="mt-2 flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg bg-slate-100 text-slate-400 text-[11px] font-semibold cursor-not-allowed border border-slate-200"
          style={{ fontFamily: 'Poppins, sans-serif' }}
        >
          <Download className="w-3 h-3" />
          Download
        </button>
      </div>
    </div>
  );
}

function DemoVideosSection() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = VIDEO_DATA.filter(v => {
    const matchCat = filter === 'all' || v.category === filter;
    const matchSearch = search === '' ||
      v.title.toLowerCase().includes(search.toLowerCase()) ||
      v.description.toLowerCase().includes(search.toLowerCase()) ||
      v.categoryLabel.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <>
      <VideoAnimStyles />
      <SectionTitle>Demo Videos</SectionTitle>
      <SectionLead>Video tutorials explaining software usage and element operations. Filter by element or feature, or search for a specific topic.</SectionLead>

      {/* Filter + Search bar */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide" style={{ fontFamily: 'Poppins, sans-serif' }}>Filter:</span>
        <div className="relative">
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="appearance-none pl-2.5 pr-7 py-1.5 text-[12px] font-medium bg-white border border-slate-200 rounded-lg text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/30 shadow-sm"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            {VIDEO_FILTER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
        </div>
        <div className="relative flex-1 min-w-[140px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search videos…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-7 pr-3 py-1.5 text-[12px] bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 shadow-sm"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          />
        </div>
        {(filter !== 'all' || search) && (
          <button
            onClick={() => { setFilter('all'); setSearch(''); }}
            className="text-[11px] text-blue-600 hover:underline font-medium"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            Clear
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="py-12 text-center text-slate-400" style={{ fontFamily: 'Poppins, sans-serif' }}>
          <Video className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-[13px]">No videos match your filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {filtered.map(v => <VideoCard key={v.id} entry={v} />)}
        </div>
      )}

      <Note>
        Tutorial videos are coming soon. The section structure, filters, and download buttons are ready — video files will be linked here once recorded.
      </Note>
    </>
  );
}

// ─── SECTION_CONTENT ──────────────────────────────────────────────────────────
const SECTION_CONTENT: Record<string, React.ReactNode> = {
  'getting-started':  <GettingStarted />,
  'elements':         <NetworkElements />,
  'all-properties':   <AllPropertiesSection />,
  'connections':      <Connections />,
  'demo-videos':      <DemoVideosSection />,
  'flex-table':       <FlexTableSection />,
  'excel':            <ExcelSection />,
  'simulation':       <SimulationSection />,
  'files':            <FilesSection />,
  'shortcuts':        <ShortcutsSection />,
  'troubleshooting':  <TroubleshootingSection />,
};

// ─── HelpModal ────────────────────────────────────────────────────────────────
export function HelpModal({ open, onClose }: HelpModalProps) {
  const [activeSection, setActiveSection] = useState('getting-started');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  if (!open) return null;

  const handleDownloadPdf = () => {
    setIsGeneratingPdf(true);
    setTimeout(() => {
      try {
        downloadPDF();
      } finally {
        setIsGeneratingPdf(false);
      }
    }, 50);
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex"
      data-testid="help-modal"
      style={{ fontFamily: 'Poppins, sans-serif' }}
    >
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative flex w-full h-full bg-white shadow-2xl overflow-hidden">

        {/* ── Left sidebar ── */}
        <aside className="w-[220px] flex-shrink-0 flex flex-col bg-slate-900 text-white">
          <div className="px-4 py-4 border-b border-slate-700 flex-shrink-0">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-400" />
              <span className="text-[13px] font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>User Guide</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">WHAMO Network Designer</p>
          </div>
          <nav className="flex-1 overflow-y-auto py-2">
            {SECTIONS.map(sec => (
              <button
                key={sec.id}
                data-testid={`help-nav-${sec.id}`}
                onClick={() => setActiveSection(sec.id)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition-colors text-[12px]',
                  activeSection === sec.id
                    ? 'bg-[#1a73e8] text-white font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white font-medium',
                )}
              >
                <span className="flex-shrink-0 opacity-75">{sec.icon}</span>
                {sec.label}
              </button>
            ))}
          </nav>
          <div className="px-4 py-3 border-t border-slate-700 flex-shrink-0">
            <p className="text-[10px] text-slate-500">v1.0 — WHAMO ND</p>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Header bar */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-white flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">{SECTIONS.find(s => s.id === activeSection)?.icon}</span>
              <span className="text-[13px] font-semibold text-slate-700">
                {SECTIONS.find(s => s.id === activeSection)?.label}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                data-testid="help-download-pdf"
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-semibold transition-colors',
                  isGeneratingPdf
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-[#1a73e8] text-white hover:bg-[#1557b0] active:bg-[#0f3f8c]',
                )}
                title="Download User Manual PDF"
              >
                <FileDown className="w-3.5 h-3.5" />
                {isGeneratingPdf ? 'Generating…' : 'Download PDF'}
              </button>
              <button
                onClick={onClose}
                data-testid="help-modal-close"
                className="p-1.5 rounded hover:bg-slate-100 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-8 py-6 bg-[#fafbfc]">
            <div className="w-full">
              {SECTION_CONTENT[activeSection]}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
