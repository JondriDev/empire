import { readFileSync, writeFileSync } from 'fs';

// [file, [ [from, to, expectedCount] ... ]]
// Each `from` is an exact substring; replaced globally. expectedCount asserted.
const edits = [
  ['src/apps/calculator/Calculator.tsx', [
    ["fontSize: '11px'", "fontSize: 'var(--text-xs)'", 2],
    ["fontSize: '10px'", "fontSize: 'var(--text-xs)'", 4],
    ["fontSize: '9px'",  "fontSize: 'var(--text-xs)'", 1],
    ["fontSize: '12px'", "fontSize: 'var(--text-sm)'", 1],   // tie 11/13 -> up
    ["fontSize: '32px'", "fontSize: 'var(--text-3xl)'", 1],  // 30 nearest; on-device -2px
  ]],
  ['src/apps/artifacts/artifacts/ChartBuilder.tsx', [
    ["fontSize: 22", "fontSize: 'var(--text-2xl)'", 3],   // tie 20/24 -> up; on-device +2px (SVG)
    ["fontSize: 11", "fontSize: 'var(--text-xs)'", 3],
    ["fontSize: 12", "fontSize: 'var(--text-sm)'", 3],    // tie 11/13 -> up
  ]],
  ['src/components/CommandPalette.tsx', [
    ["fontSize: '10px'", "fontSize: 'var(--text-xs)'", 2],
    ["fontSize: '11px'", "fontSize: 'var(--text-xs)'", 1],
    ["fontSize: '9px'",  "fontSize: 'var(--text-xs)'", 1],
    ["fontSize: 14,",    "fontSize: 'var(--text-base)',", 1], // tie 13/15 -> up
  ]],
  ['src/apps/artifacts/artifacts/MarkdownStudio.tsx', [
    ["font-size: 2rem",    "font-size: var(--text-3xl)", 1], // 32px->30; on-device -2px
    ["font-size: 1.5rem",  "font-size: var(--text-2xl)", 1], // 24px exact
    ["font-size: 1.25rem", "font-size: var(--text-xl)", 1],  // 20px exact
    ["font-size: 0.85rem", "font-size: var(--text-sm)", 1],  // 13.6px->13
    // 0.85em on line 421 is relative -> intentionally left (not counted)
  ]],
  ['src/apps/notes/Notes.tsx', [
    ["fontSize: '11px'", "fontSize: 'var(--text-xs)'", 1],
    ["fontSize: '10px'", "fontSize: 'var(--text-xs)'", 2],
  ]],
  ['src/components/ErrorBoundary.tsx', [
    ["fontSize: '2.5rem'", "fontSize: 'var(--text-4xl)'", 1], // 40px->36; on-device -4px (deco emoji)
    ["fontSize: '0.8rem'",  "fontSize: 'var(--text-sm)'", 1], // 12.8px->13
    ["fontSize: '0.85rem'", "fontSize: 'var(--text-sm)'", 1], // 13.6px->13
  ]],
  ['src/components/ui/Utility.tsx', [
    ["fontSize: '10px'", "fontSize: 'var(--text-xs)'", 1],
    ["fontSize: '24px'", "fontSize: 'var(--text-2xl)'", 1],  // exact
    ["fontSize: '11px'", "fontSize: 'var(--text-xs)'", 1],
  ]],
  ['src/apps/cakra/components/ChatPanel.tsx', [
    ["font-size:12px", "font-size:var(--text-sm)", 1],       // tie 11/13 -> up (injected HTML)
  ]],
  ['src/apps/cakra/components/ConfirmModal.tsx', [
    ["fontSize: '11px'", "fontSize: 'var(--text-xs)'", 1],
  ]],
  ['src/components/Desktop.tsx', [
    ["fontSize: '10px'", "fontSize: 'var(--text-xs)'", 1],
  ]],
  ['src/components/ui/NodeActions.tsx', [
    ["fontSize: 10,", "fontSize: 'var(--text-xs)',", 1],
  ]],
  ['src/components/ui/SendResultMenu.tsx', [
    ["fontSize: 10,", "fontSize: 'var(--text-xs)',", 1],
  ]],
  ['src/components/ui/index.tsx', [
    ["fontSize: '10px'", "fontSize: 'var(--text-xs)'", 1],
  ]],
];

// Pass 1: validate all counts and compute new text. Pass 2: write only if all pass.
const pending = [];
let fail = false;
for (const [file, reps] of edits) {
  let text = readFileSync(file, 'utf8');
  for (const [from, to, expected] of reps) {
    const count = text.split(from).length - 1;
    if (count !== expected) {
      console.error(`MISMATCH ${file}: "${from}" found ${count}, expected ${expected}`);
      fail = true;
      continue;
    }
    text = text.split(from).join(to);
  }
  pending.push([file, text]);
}
if (fail) {
  console.error('ABORTED — no files written.');
  process.exit(1);
}
for (const [file, text] of pending) writeFileSync(file, text);
console.log('All replacements applied to', pending.length, 'files.');
