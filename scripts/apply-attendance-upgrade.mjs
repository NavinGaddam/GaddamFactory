import { readFileSync, writeFileSync } from 'node:fs';

const pagePath = 'app/page.tsx';
const componentPath = 'scripts/attendance-component.txt';
const page = readFileSync(pagePath, 'utf8');
if (page.includes("'Simple attendance'")) process.exit(0);
const start = page.indexOf('function Attendance(');
const end = page.indexOf('function Inward(', start);
if (start < 0 || end < 0) throw new Error('Attendance/Inward component boundary not found');
const replacement = readFileSync(componentPath, 'utf8').trimEnd() + '\n';
writeFileSync(pagePath, page.slice(0, start) + replacement + page.slice(end));
console.log('Attendance upgrade applied.');
