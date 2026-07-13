import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const skillsRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const manifest = JSON.parse(
  fs.readFileSync(path.join(skillsRoot, 'skills-manifest.json'), 'utf8'),
);
const supportedAgents = ['codex', 'claude', 'cursor', 'copilot'];

function printHelp() {
  console.log(`Install VLP Agent Skills.

Usage:
  node install-skills.mjs --agent <agent[,agent]|all> --scope <project|user> [options]

Options:
  --agent       codex, claude, cursor, copilot, comma-separated values, or all
  --scope       project or user
  --skill       skill name or comma-separated names (default: all)
  --workspace   project root for project installs (default: current directory)
  --force       replace an existing valid skill installation
  --help        show this message
`);
}

function parseArgs(argv) {
  const result = { force: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--force') result.force = true;
    else if (arg === '--help' || arg === '-h') result.help = true;
    else if (['--agent', '--scope', '--skill', '--workspace'].includes(arg)) {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) throw new Error(`${arg} requires a value.`);
      result[arg.slice(2)] = value;
      index += 1;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  return result;
}

function splitValues(value) {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function resolveAgents(value) {
  if (!value) throw new Error('--agent is required.');
  const agents = splitValues(value);
  const resolved = agents.includes('all') ? supportedAgents : [...new Set(agents)];
  const invalid = resolved.filter((agent) => !supportedAgents.includes(agent));
  if (invalid.length) throw new Error(`Unsupported agent(s): ${invalid.join(', ')}`);
  return resolved;
}

function userSkillsDirectory(agent) {
  const home = os.homedir();
  const directories = {
    claude: path.join(home, '.claude', 'skills'),
    codex: process.env.CODEX_HOME
      ? path.join(process.env.CODEX_HOME, 'skills')
      : path.join(home, '.codex', 'skills'),
    copilot: path.join(home, '.copilot', 'skills'),
    cursor: path.join(home, '.cursor', 'skills'),
  };
  return directories[agent];
}

function readInstalledSkillName(directory) {
  const skillFile = path.join(directory, 'SKILL.md');
  if (!fs.existsSync(skillFile)) return undefined;
  const source = fs.readFileSync(skillFile, 'utf8');
  return source.match(/^---\s*[\r\n]+[\s\S]*?^name:\s*([^\r\n]+)$/m)?.[1]?.trim();
}

function installSkill(skill, destinationRoot, force) {
  const source = path.join(skillsRoot, skill.source);
  const destination = path.join(destinationRoot, skill.name);
  if (!fs.existsSync(path.join(source, 'SKILL.md'))) {
    throw new Error(`Skill source is invalid: ${source}`);
  }
  if (fs.existsSync(destination)) {
    const installedName = readInstalledSkillName(destination);
    if (installedName !== skill.name) {
      throw new Error(`Refusing to replace non-skill or different skill directory: ${destination}`);
    }
    if (!force) throw new Error(`Skill already exists: ${destination}. Use --force to update it.`);
    fs.rmSync(destination, { recursive: true, force: true });
  }
  fs.mkdirSync(destinationRoot, { recursive: true });
  fs.cpSync(source, destination, { recursive: true });
  console.log(`Installed ${skill.name} -> ${destination}`);
}

try {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    process.exit(0);
  }
  const agents = resolveAgents(options.agent);
  if (!['project', 'user'].includes(options.scope)) {
    throw new Error('--scope must be project or user.');
  }
  const requestedSkills = options.skill ? splitValues(options.skill) : manifest.skills.map(({ name }) => name);
  const selectedSkills = manifest.skills.filter(({ name }) => requestedSkills.includes(name));
  const missingSkills = requestedSkills.filter((name) => !selectedSkills.some((skill) => skill.name === name));
  if (missingSkills.length) throw new Error(`Unknown skill(s): ${missingSkills.join(', ')}`);

  if (options.scope === 'project') {
    const workspace = path.resolve(options.workspace || process.cwd());
    const destination = path.join(workspace, '.agents', 'skills');
    for (const skill of selectedSkills) installSkill(skill, destination, options.force);
    console.log(`Project installation is shared by: ${agents.join(', ')}.`);
  } else {
    for (const agent of agents) {
      for (const skill of selectedSkills) {
        if (!skill.agents.includes(agent)) continue;
        installSkill(skill, userSkillsDirectory(agent), options.force);
      }
    }
  }
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
}
