import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Validates the deployable artifact at the repo root. It lives here because
// vitest only collects lib/**/*.test.ts.
//
// These rules can't be exercised without the Firebase emulator, and a bad file
// is only discovered when someone pastes it into a live console. So this checks
// the structural contract that the rules parser imposes — which is stricter
// than JSON, and easy to violate in ways that look fine:
//
//   * only `rules` may appear at the top level
//   * any key not starting with "." is a PATH NAME, so its value must be an
//     object — a string there (e.g. a "_comment") is a parse error
//   * only one $wildcard is allowed per level

const RULES_PATH = fileURLToPath(new URL('../database.rules.json', import.meta.url));

/** Strip `//` comments without touching `//` inside string literals. */
function stripComments(source: string): string {
  let out = '';
  let inString = false;
  let escaped = false;

  for (let i = 0; i < source.length; i++) {
    const char = source[i];

    if (inString) {
      out += char;
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') inString = false;
      continue;
    }

    if (char === '"') {
      inString = true;
      out += char;
      continue;
    }

    if (char === '/' && source[i + 1] === '/') {
      while (i < source.length && source[i] !== '\n') i++;
      out += '\n';
      continue;
    }

    out += char;
  }

  return out;
}

const RULE_KEYS = ['.read', '.write', '.validate', '.indexOn', '.priority'];

type Node = Record<string, unknown>;

function walk(node: Node, at: string, visit: (path: string, n: Node) => void) {
  visit(at, node);
  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith('.')) continue;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      walk(value as Node, `${at}/${key}`, visit);
    }
  }
}

describe('database.rules.json', () => {
  const raw = readFileSync(RULES_PATH, 'utf8');
  const parsed = JSON.parse(stripComments(raw)) as Node;

  it('parses once comments are stripped', () => {
    expect(parsed).toBeTypeOf('object');
  });

  it('has exactly one top-level key, "rules"', () => {
    // Anything beside it — including a "_comment" — is rejected outright.
    expect(Object.keys(parsed)).toEqual(['rules']);
  });

  const rules = parsed.rules as Node;

  it('never maps a path name to a non-object', () => {
    const offenders: string[] = [];
    walk(rules, '', (path, node) => {
      for (const [key, value] of Object.entries(node)) {
        if (key.startsWith('.')) continue;
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
          offenders.push(`${path}/${key} = ${JSON.stringify(value)}`);
        }
      }
    });
    expect(offenders).toEqual([]);
  });

  it('uses only recognised rule keys', () => {
    const offenders: string[] = [];
    walk(rules, '', (path, node) => {
      for (const key of Object.keys(node)) {
        if (key.startsWith('.') && !RULE_KEYS.includes(key)) {
          offenders.push(`${path}/${key}`);
        }
      }
    });
    expect(offenders).toEqual([]);
  });

  it('declares at most one wildcard per level', () => {
    const offenders: string[] = [];
    walk(rules, '', (path, node) => {
      const wildcards = Object.keys(node).filter((k) => k.startsWith('$'));
      if (wildcards.length > 1) offenders.push(`${path}: ${wildcards.join(', ')}`);
    });
    expect(offenders).toEqual([]);
  });

  it('closes the database at the root', () => {
    expect(rules['.read']).toBe(false);
    expect(rules['.write']).toBe(false);
  });

  it('leaves the other app’s nodes as open as they are today', () => {
    // Tightening these is that app's call, not ours — see README.
    for (const node of ['characters', 'itemPool']) {
      expect(rules[node]).toEqual({ '.read': true, '.write': true });
    }
  });

  it('allows a status re-submit but never a delete, rename or npc flip', () => {
    const entry = (
      (rules.final_event as Node).characters as Node
    ).$entry as Node;
    const write = entry['.write'] as string;

    // newData must exist, so an entry can never be removed from a browser.
    expect(write).toContain('newData.exists()');
    // Either it's new, or the identity fields are carried through unchanged.
    expect(write).toContain('!data.exists()');
    expect(write).toContain(
      "newData.child('name').val() == data.child('name').val()",
    );
    expect(write).toContain(
      "newData.child('isNpc').val() == data.child('isNpc').val()",
    );
  });

  it('keeps createdAt immutable across a re-submit', () => {
    const entry = (
      (rules.final_event as Node).characters as Node
    ).$entry as Node;
    // A plain `== now` here would reject every update, since a re-submit
    // leaves the original timestamp in place.
    expect((entry.createdAt as Node)['.validate']).toBe(
      'data.exists() ? newData.val() == data.val() : newData.val() == now',
    );
  });

  it('declares updatedAt, which $other would otherwise reject', () => {
    const entry = (
      (rules.final_event as Node).characters as Node
    ).$entry as Node;
    expect(entry.updatedAt).toBeDefined();
  });

  it('accepts all three player statuses and pins isNpc to false', () => {
    const entry = (
      (rules.final_event as Node).characters as Node
    ).$entry as Node;
    const status = (entry.status as Node)['.validate'] as string;
    for (const value of ['alive', 'dead', 'lost']) {
      expect(status).toContain(`'${value}'`);
    }
    // The public form can only ever create players, never NPCs.
    expect((entry.isNpc as Node)['.validate']).toContain('== false');
  });

  it('keeps the item pool read-only from the client', () => {
    expect((rules.final_event as Node).items).toEqual({
      '.read': true,
      '.write': false,
    });
  });
});
