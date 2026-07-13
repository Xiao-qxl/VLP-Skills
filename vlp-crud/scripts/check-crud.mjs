import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

function printHelp() {
  console.log(`Check VLP CRUD source conventions.

Usage:
  node check-crud.mjs [target ...] [--workspace <path>] [--typecheck]

Arguments:
  target        file or directory relative to the workspace; may be repeated

Options:
  --workspace   VLP workspace root (default: discover upward from current directory)
  --typecheck   typecheck VLP-Web-Base and VConn-Web after static checks
  --help        show this message
`);
}

function parseArgs(argv) {
  const result = { targets: [], typecheck: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--typecheck') result.typecheck = true;
    else if (arg === '--help' || arg === '-h') result.help = true;
    else if (arg === '--workspace') {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) throw new Error('--workspace requires a path.');
      result.workspace = value;
      index += 1;
    } else if (arg.startsWith('--')) throw new Error(`Unknown option: ${arg}`);
    else result.targets.push(arg);
  }
  return result;
}

function isWorkspace(directory) {
  return ['VLP-Web-Base', 'VConn-Web'].every((name) =>
    fs.existsSync(path.join(directory, name)),
  );
}

function discoverWorkspace(start) {
  let current = path.resolve(start);
  while (true) {
    if (isWorkspace(current)) return current;
    const parent = path.dirname(current);
    if (parent === current) return undefined;
    current = parent;
  }
}

function walk(target) {
  if (!fs.existsSync(target)) return [];
  const stat = fs.statSync(target);
  if (stat.isFile()) return /\.(ts|vue)$/.test(target) ? [target] : [];
  const result = [];
  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    const file = path.join(target, entry.name);
    if (entry.isDirectory()) result.push(...walk(file));
    else if (/\.(ts|vue)$/.test(entry.name)) result.push(file);
  }
  return result;
}

const forbidden = [
  ['legacy input component', /component:\s*['"]JInput['"]/],
  ['legacy dictionary component', /component:\s*['"]JDictSelectTag['"]/],
  ['legacy validity component', /component:\s*['"]IsValidSwitch['"]/],
  ['legacy hidden field', /show:\s*false/],
  ['legacy grid props', /colProps\s*:/],
  ['legacy dynamic rules', /dynamicRules\s*:/],
  ['unsafe any cast', /\bas any\b/],
  ['direct data source mutation', /\.dataSource\.value\s*=\s*\[\]/],
  ['direct pagination mutation', /\.pagination\.total\s*=/],
  ['copied status helper', /const statusColumnKeys|function isStatusColumn/],
  ['direct Iconify component', /\bIconifyIcon\b/],
  ['legacy SVG icon component', /\bSvgIcon\b/],
  ['page-level Iconfont factory', /\bcreateFromIconfontCN\b/],
  ['direct Antdv icon import', /from\s*['"](?:@antdv-next\/icons|@ant-design\/icons-vue)['"]/],
  ['possible mojibake', /[閸欓弰閺堢拠閳ラ敍濡涵鎼寸€涜ぐ閺嘳]{3,}/],
];

function runTypechecks(workspace) {
  const executable = 'pnpm';
  const commands = [
    ['VLP-Web-Base', ['exec', 'vue-tsc', '--noEmit', '--skipLibCheck']],
    ['VConn-Web', ['run', 'typecheck']],
  ];
  for (const [directory, args] of commands) {
    const result = spawnSync(executable, args, {
      cwd: path.join(workspace, directory),
      encoding: 'utf8',
      shell: process.platform === 'win32',
      stdio: 'inherit',
    });
    if (result.error) {
      console.error(`Failed to run ${executable} in ${directory}: ${result.error.message}`);
      process.exitCode = 1;
    } else if (result.status !== 0) process.exitCode = result.status || 1;
  }
}

try {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    process.exit(0);
  }
  const workspace = options.workspace
    ? path.resolve(options.workspace)
    : discoverWorkspace(process.cwd());
  if (!workspace || !isWorkspace(workspace)) {
    throw new Error('VLP workspace not found. Run inside the workspace or pass --workspace <path>.');
  }
  const targets = options.targets.length
    ? options.targets
    : ['VConn-Web/src/views', 'VLP-Web-Base/src/views'];
  const scanRoots = targets.map((target) =>
    path.isAbsolute(target) ? target : path.resolve(workspace, target),
  );
  const findings = [];

  for (const root of scanRoots) {
    if (!fs.existsSync(root)) {
      findings.push(`${path.relative(workspace, root)}: target does not exist`);
      continue;
    }
    for (const file of walk(root)) {
      const source = fs.readFileSync(file, 'utf8');
      if (!/CrudPage|useCrudPage|CrudSchema|defineCrudSchema/.test(source)) continue;
      const lines = source.split(/\r?\n/);
      for (const [label, pattern] of forbidden) {
        lines.forEach((line, index) => {
          pattern.lastIndex = 0;
          if (pattern.test(line)) findings.push(`${path.relative(workspace, file)}:${index + 1} ${label}`);
        });
      }
    }
  }

  const requiredExports = [
    'createCrudApiAdapter',
    'createCrudDuplicateCheckRule',
    'createCrudUrls',
    'createRequestCrudApiAdapter',
    'defineCrudSchema',
    'useCrudPage',
  ];
  for (const relative of ['VLP-Web-Base/src/crud/index.ts', 'VLP-Web-Base/dist/crud/index.mjs']) {
    const file = path.join(workspace, relative);
    const source = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
    for (const symbol of requiredExports) {
      if (!source.includes(symbol)) findings.push(`${relative}: missing export ${symbol}`);
    }
  }

  const iconExports = [
    ['VLP-Web-Base/runtime/icons/src/index.ts', 'export { default as VlpIcon }'],
    ['VLP-Web-Base/runtime/icons/src/index.ts', "export * from './iconfont'"],
    ['VLP-Web-Base/runtime/icons/src/iconfont.ts', 'registerVlpIconfont'],
    ['VLP-Web-Base/runtime/icons/src/iconfont.ts', 'VlpIconfontOptions'],
  ];
  for (const [relative, symbol] of iconExports) {
    const file = path.join(workspace, relative);
    const source = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
    if (!source.includes(symbol)) findings.push(`${relative}: missing export ${symbol}`);
  }

  if (findings.length) {
    console.error(findings.join('\n'));
    process.exitCode = 1;
  } else {
    console.log(`CRUD checks passed for ${scanRoots.length} target(s).`);
  }
  if (options.typecheck) runTypechecks(workspace);
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exitCode = 2;
}
