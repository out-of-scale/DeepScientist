# Plugins and Marketplace

This document defines the smallest plugin model worth supporting in `DeepScientist Core`.

## 1. Why plugins exist

The core should stay focused on:

- quest session routing
- prompt assembly
- `memory`
- `artifact`
- runner adapters
- local UI
- a few first-party connectors

Plugins are the place to add:

- extra skill packs
- extra connectors
- external MCP servers
- domain-specific helpers
- richer platform bridges

## 2. Core invariants plugins must not break

Plugins may extend the system, but they must not replace the built-in contract:

- one quest = one Git repository
- default home = `~/DeepScientist`
- built-in MCP namespaces remain only:
  - `memory`
  - `artifact`
- Git remains internal to `artifact`
- the authoritative runtime remains the Python daemon
- plugin-provided connectors, relays, and skill packs should still register through the same tiny registry APIs as built-ins

## 3. Plugin kinds

Recommended plugin kinds:

- `skill_pack`
- `connector`
- `mcp_server`
- `relay`

`relay` exists mainly for platforms such as QQ that may need a public-facing bridge.

## 4. Install root

Default plugin install root:

```text
~/DeepScientist/plugins/
```

Planned commands:

```bash
ds plugins install <npm-package-or-git-url>
ds plugins list
ds plugins remove <name>
```

## 5. Minimal manifest

Recommended manifest shape:

```json
{
  "name": "deepscientist-qq-relay",
  "version": "0.1.0",
  "deepscientist": {
    "kind": "relay",
    "skills": ["skills/qq-collaboration"],
    "connectors": ["dist/qq.js"],
    "mcpServers": [],
    "relays": ["dist/qq-relay.js"]
  }
}
```

## 6. Skill sync for plugins

If a plugin ships skills, the runtime should treat them similarly to first-party skills:

- install into the plugin directory
- expose them through the same skill bundle discovery path
- sync the relevant subset into:
  - `~/.codex/skills/`
  - `~/.claude/agents/`
  - `<quest_root>/.codex/skills/`
  - `<quest_root>/.claude/agents/`

This keeps plugin skills visible to both runners.

## 7. OpenClaw compatibility

Compatibility with OpenClaw should be a manifest and packaging translation layer, not a runtime rewrite.

That means:

- accept compatible metadata when practical
- map OpenClaw-style packages into the DeepScientist plugin registry
- keep DeepScientist's quest/session/runtime model unchanged

## 8. QQ strategy

QQ should have two paths:

1. **first-party connector**
   - minimal, text-first
   - integrated with the daemon session model
2. **plugin or relay extension**
   - for richer QQ platform handling
   - useful when Tencent Cloud style public callbacks or relay deployment is required
   - compatible with the practical OpenClaw-style `qqbot` path when users need it

This keeps QQ support available without forcing cloud-specific logic into the core.

## 9. External MCP via plugins

Plugins may register external MCP servers.

But the core still only owns:

- `memory`
- `artifact`

External MCP should be:

- declared in plugin manifests
- registered in `~/DeepScientist/config/mcp_servers.yaml`
- exposed to runners as optional extensions

## 10. Reference Anchors

- plugin / ecosystem direction:
  - `/ssdwork/deepscientist/_references/openclaw`
- skill packaging and manifest examples:
  - `/home/air/DeepScientist_latest/DS_2027/cli/core/capabilities/skills/_manifest.md`
  - `/home/air/DeepScientist_latest/DS_2027/cli/backend/app/agent_kernel/template_manager.py`
- connector routing:
  - `/ssdwork/deepscientist/_references/nanoclaw/src/channels/registry.ts`
- QQ connector background:
  - `https://cloud.tencent.com.cn/developer/article/2635190`
  - `https://cloud.tencent.com.cn/developer/article/2626045`
  - `https://cloud.tencent.com.cn/developer/article/2628828`
