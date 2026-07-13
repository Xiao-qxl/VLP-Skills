# VLP Skills

`VLP-Skills` 是 VLP-Web/VConn-Web 的 Agent Skills 源仓库。技能正文遵循开放的 [Agent Skills 规范](https://agentskills.io/specification)，同一份 `SKILL.md` 可供 Codex、Claude Code、Cursor 和 GitHub Copilot 使用。

平台专用文件只用于界面或安装适配。例如 `agents/openai.yaml` 是 Codex/OpenAI 的可选元数据，不影响其他 Agent 读取技能。

## 目录结构

```text
VLP-Skills/
  skills-manifest.json
  scripts/
    install-skills.mjs
    validate-skills.mjs
  vlp-crud/
    SKILL.md
    agents/
      openai.yaml
    references/
      crud-patterns.md
    scripts/
      check-crud.mjs
```

`VLP-Skills` 是唯一维护源。项目或个人技能目录中的内容由安装器复制生成，不要直接修改生成副本。

## 安装

### 从 GitHub 下载

在业务仓库根目录克隆技能仓库：

```text
git clone https://github.com/Xiao-qxl/VLP-Skills.git VLP-Skills
```

然后执行项目级安装：

```text
node VLP-Skills/scripts/install-skills.mjs --agent all --scope project
```

项目级安装统一写入 `.agents/skills`，四类 Agent 共享一份副本。也可以安装到个人目录：

```text
node VLP-Skills/scripts/install-skills.mjs --agent codex --scope user
node VLP-Skills/scripts/install-skills.mjs --agent claude,cursor,copilot --scope user
```

更新已安装技能时增加 `--force`。使用 `--skill vlp-crud` 可只安装指定技能，使用 `--workspace <path>` 可明确指定项目根目录。

默认个人目录如下：

| Agent | 个人技能目录 |
| --- | --- |
| Codex | `$CODEX_HOME/skills`，未设置时为 `~/.codex/skills` |
| Claude Code | `~/.claude/skills` |
| Cursor | `~/.cursor/skills` |
| GitHub Copilot | `~/.copilot/skills` |

安装后新开 Agent 会话；部分客户端需要重新加载窗口才能刷新技能列表。

也可以使用支持 Agent Skills 的标准工具从 Git 仓库安装，例如 `npx skills add <repository>` 或 `gh skill install <repository> <skill>`。团队默认仍使用仓库内 Node 安装器，以保证私有仓库和离线环境下行为一致。

例如使用标准 Skills CLI：

```text
npx skills add Xiao-qxl/VLP-Skills --skill vlp-crud
```

## 使用

技能可由 Agent 根据 `description` 自动选择，也可以按客户端支持的方式显式调用：

```text
使用 vlp-crud，基于 /fleet/station 新建站点管理 CRUD 页面。
```

`vlp-crud` 会先读取项目实体、API 和相邻页面，再按 `useCrudPage + CrudPage + typed schema + API adapter` 生成或重构页面。

## 判断 Skill 是否触发

不同 Agent 的界面提示不同，没有一个跨客户端统一的触发标记。可通过以下方式确认：

1. 新开会话后，在 Agent 的 Skills 列表或斜杠命令列表中确认存在 `vlp-crud`。
2. 显式调用 `vlp-crud` 是最确定的方式；Codex 可使用 `$vlp-crud`，支持斜杠技能的客户端可使用 `/vlp-crud`。
3. 自动触发测试时，使用下面的提示词，并要求 Agent 先报告采用的 Skill：

```text
请先说明本任务将使用的 skill 名称，再审查当前 CRUD 页面是否符合项目规范，不要修改代码。
```

4. 检查执行行为：触发后 Agent 应读取 `references/crud-patterns.md`，检查实体/API/相邻页面，并建议或运行 `scripts/check-crud.mjs`。只给出通用 Vue CRUD 建议通常表示技能没有加载。

技能的 `description` 是自动触发依据。修改或新安装技能后，应新开会话或重新加载客户端再测试。

## 验证

验证所有技能的结构、引用、可移植性和脚本语法：

```text
node VLP-Skills/scripts/validate-skills.mjs
```

检查 CRUD 页面：

```text
node VLP-Skills/vlp-crud/scripts/check-crud.mjs --workspace . <target>
node VLP-Skills/vlp-crud/scripts/check-crud.mjs --workspace . <target> --typecheck
```

省略 `--workspace` 时，检查器从当前目录向上查找 `VLP-Web-Base` 和 `VConn-Web`。运行 `--help` 可查看完整参数。

## 维护约定

- 任务型工作流、生成步骤和按需参考资料放在 Skill 中。
- 项目长期约束、架构说明和协作进度放在根目录 `AGENTS.md`、`HANDOFF.md` 或 `docs` 中。
- `SKILL.md` 保持精简，详细示例进入 `references`，确定性检查进入 `scripts`。
- 核心正文不得依赖某个 Agent 的专用工具、绝对路径或安装目录结构。
- 更新技能后运行统一验证器，再用 `--force` 刷新项目级副本。
