import { readFileSync } from "node:fs";
import path from "node:path";
import ts from "typescript";

export type PropRow = {
  name: string;
  type: string;
  required: boolean;
  default?: string;
  description: string;
};

/** A grouped prop such as `colors`, expanded into its keys. */
export type PropGroup = {
  prop: string;
  rows: PropRow[];
};

const collapse = (text: string, max = 70) => {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
};

const docOf = (node: ts.Node) =>
  ts
    .getJSDocCommentsAndTags(node)
    .filter(ts.isJSDoc)
    .map((doc) => ts.getTextOfJSDocComment(doc.comment) ?? "")
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

const memberName = (member: ts.TypeElement) => (member.name ? member.name.getText() : "");

function findTypeMembers(source: ts.SourceFile, typeName: string): ts.NodeArray<ts.TypeElement> | undefined {
  for (const stmt of source.statements) {
    if (ts.isTypeAliasDeclaration(stmt) && stmt.name.text === typeName && ts.isTypeLiteralNode(stmt.type)) return stmt.type.members;
    if (ts.isInterfaceDeclaration(stmt) && stmt.name.text === typeName) return stmt.members;
  }
}

/** Shows the value behind a top-level constant default (for example `ITEMS`) instead of its name. */
function resolveConst(source: ts.SourceFile, text: string): string {
  if (!/^[A-Z][A-Z0-9_]*$/.test(text)) return text;
  for (const stmt of source.statements) {
    if (!ts.isVariableStatement(stmt)) continue;
    for (const decl of stmt.declarationList.declarations) {
      if (decl.name.getText() === text && decl.initializer) return collapse(decl.initializer.getText());
    }
  }
  return text;
}

/** Reads `const X: TypeName = { ... }` and returns each property's source text. */
function findObjectDefaults(source: ts.SourceFile, typeName: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const stmt of source.statements) {
    if (!ts.isVariableStatement(stmt)) continue;
    for (const decl of stmt.declarationList.declarations) {
      if (decl.type?.getText() !== typeName || !decl.initializer || !ts.isObjectLiteralExpression(decl.initializer)) continue;
      for (const prop of decl.initializer.properties) {
        if (ts.isPropertyAssignment(prop)) out.set(prop.name.getText(), collapse(prop.initializer.getText()));
      }
    }
  }
  return out;
}

function toRows(members: ts.NodeArray<ts.TypeElement>, defaults: Map<string, string>): PropRow[] {
  return members.filter(ts.isPropertySignature).map((member) => ({
    name: memberName(member),
    type: collapse(member.type?.getText() ?? "unknown", 90),
    required: !member.questionToken,
    default: defaults.get(memberName(member)),
    description: docOf(member),
  }));
}

/**
 * Builds the props documentation for a component file from its source, so the docs never drift:
 * the exported `*Props` type gives names, types and comments, the function's destructuring gives defaults.
 */
export function extractProps(file: string): { props: PropRow[]; groups: PropGroup[] } {
  const text = readFileSync(path.join(/* turbopackIgnore: true */ process.cwd(), file), "utf8");
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

  const propsType = source.statements
    .filter((s): s is ts.TypeAliasDeclaration | ts.InterfaceDeclaration => ts.isTypeAliasDeclaration(s) || ts.isInterfaceDeclaration(s))
    .find((s) => s.name.text.endsWith("Props"));
  if (!propsType) return { props: [], groups: [] };

  const members = findTypeMembers(source, propsType.name.text);
  if (!members) return { props: [], groups: [] };

  const defaults = new Map<string, string>();
  for (const stmt of source.statements) {
    if (!ts.isFunctionDeclaration(stmt) || stmt.parameters[0]?.type?.getText() !== propsType.name.text) continue;
    const pattern = stmt.parameters[0].name;
    if (!ts.isObjectBindingPattern(pattern)) continue;
    for (const el of pattern.elements) {
      if (el.initializer) defaults.set((el.propertyName ?? el.name).getText(), resolveConst(source, collapse(el.initializer.getText())));
    }
  }

  const props = toRows(members, defaults);

  const groups: PropGroup[] = [];
  for (const member of members.filter(ts.isPropertySignature)) {
    const typeText = member.type?.getText() ?? "";
    const named = /^Partial<(\w+)>/.exec(typeText) ?? /keyof (\w+)\]/.exec(typeText);
    const groupMembers = named && findTypeMembers(source, named[1]);
    if (named && groupMembers) groups.push({ prop: memberName(member), rows: toRows(groupMembers, findObjectDefaults(source, named[1])).map((row) => ({ ...row, required: false })) });
  }

  return { props, groups };
}
