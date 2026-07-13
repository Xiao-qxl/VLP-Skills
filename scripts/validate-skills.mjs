import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const skillsRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const manifestFile = path.join(skillsRoot, 'skills-manifest.json');
const findings = [];

function add(file, message) {
  findings.push(`${path.relative(skillsRoot, file) || path.basename(file)}: ${message}`);
}

function parseFrontmatter(file, source) {
  const match = source.match(/^---\s*\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) {
    add(file, 'missing YAML frontmatter');
    return {};
  }
  const metadata = {};
  for (const line of match[1].split(/\r?\n/)) {
    const entry = line.match(/^([a-zA-Z][\w-]*):\s*(.+)$/);
    if (entry) metadata[entry[1]] = entry[2].trim().replace(/^['"]|['"]$/g, '');
  }
  return metadata;
}

function validateReferences(skillDirectory, file, source) {
  if (/\.md$/i.test(file)) {
    for (const match of source.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      const reference = match[1].trim().replace(/^<|>$/g, '').split('#')[0];
      if (!reference || /^(?:https?:|mailto:)/i.test(reference)) continue;
      if (!fs.existsSync(path.resolve(path.dirname(file), reference))) {
        add(file, `missing referenced file: ${reference}`);
      }
    }
  }
  if (/\b[A-Za-z]:[\\/]/.test(source)) add(file, 'contains an absolute Windows path');
  if (/VLP-Skills[\\/]vlp-crud[\\/]scripts/.test(source)) {
    add(file, 'contains an installation-location-dependent script path');
  }
  if (/[杩欎釜鐩綍鏄粈涔堢殑鎻愮ず]{4,}/.test(source)) add(file, 'contains possible mojibake');
  if (file.endsWith('SKILL.md') && /\b(?:Codex|Claude|Cursor|Copilot)\b/i.test(source)) {
    add(file, 'core instructions contain an agent-specific product name');
  }
  if (!path.resolve(file).startsWith(path.resolve(skillDirectory))) add(file, 'reference escaped skill directory');
}

if (!fs.existsSync(manifestFile)) {
  console.error('skills-manifest.json is missing.');
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
const names = new Set();
for (const skill of manifest.skills || []) {
  const skillDirectory = path.resolve(skillsRoot, skill.source || '');
  const skillFile = path.join(skillDirectory, 'SKILL.md');
  if (names.has(skill.name)) add(manifestFile, `duplicate skill name: ${skill.name}`);
  names.add(skill.name);
  if (!fs.existsSync(skillFile)) {
    add(manifestFile, `missing SKILL.md for ${skill.name}`);
    continue;
  }
  const source = fs.readFileSync(skillFile, 'utf8');
  const metadata = parseFrontmatter(skillFile, source);
  if (metadata.name !== skill.name) add(skillFile, `name must equal manifest name ${skill.name}`);
  if (path.basename(skillDirectory) !== skill.name) add(skillFile, 'directory name must equal skill name');
  if (!/^[a-z0-9-]{1,64}$/.test(metadata.name || '')) add(skillFile, 'invalid skill name');
  if (!metadata.description || metadata.description.length > 1024) add(skillFile, 'description is missing or too long');
  if (source.split(/\r?\n/).length > 500) add(skillFile, 'SKILL.md exceeds 500 lines');
  validateReferences(skillDirectory, skillFile, source);

  for (const relative of skill.entryScripts || []) {
    const script = path.join(skillDirectory, relative);
    if (!fs.existsSync(script)) {
      add(manifestFile, `missing entry script for ${skill.name}: ${relative}`);
      continue;
    }
    const syntax = spawnSync(process.execPath, ['--check', script], { encoding: 'utf8' });
    if (syntax.status !== 0) add(script, syntax.stderr.trim() || 'script syntax check failed');
    validateReferences(skillDirectory, script, fs.readFileSync(script, 'utf8'));
  }

  const referenceDirectory = path.join(skillDirectory, 'references');
  if (fs.existsSync(referenceDirectory)) {
    for (const name of fs.readdirSync(referenceDirectory)) {
      const file = path.join(referenceDirectory, name);
      if (fs.statSync(file).isFile()) validateReferences(skillDirectory, file, fs.readFileSync(file, 'utf8'));
    }
  }
}

if (findings.length) {
  console.error(findings.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Validated ${manifest.skills.length} skill(s).`);
}
