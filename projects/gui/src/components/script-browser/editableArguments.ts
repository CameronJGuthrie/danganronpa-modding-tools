import {
  Arithmetic,
  Bool,
  Chapter,
  Character,
  CharacterSprite,
  comparisonOperators,
  FlagGroup,
  LogicalJoin,
  SpriteSheet,
  Student,
  UiVisibility,
  UserInterface,
  Variable,
  VoiceCharacter,
} from "linscript-definitions";

/** A numeric enum object whose member names may stand in for an argument. */
export type NamedValues = Readonly<Record<string, string | number>>;

/** A name table chosen by the value of a nearby argument (`argument` is relative, -1 is the previous one). */
export type DependentValues = { argument: number; tables: Readonly<Record<number, NamedValues>> };

export type ArgumentSource = NamedValues | DependentValues | undefined;

/** Per-position sources; `tail` repeats after `head` for instructions with a variable argument count. */
export type EditableArguments = { head: readonly ArgumentSource[]; tail?: readonly ArgumentSource[] };

/** After a character flag group the offset is a character id; after other groups it is a plain number. */
const characterOffset: DependentValues = {
  argument: -1,
  tables: { [FlagGroup.CharacterInvestigated]: Character, [FlagGroup.CharacterDead]: Character },
};

/**
 * Instructions whose arguments can be picked from a dropdown. Mirrors the named parameters the
 * compiler knows about.
 */
export const editableArguments: Readonly<Record<string, EditableArguments>> = {
  Speaker: { head: [Character] },
  // Only the sixteen students (ids 0-15) have a report card, so the wider Character table is not offered
  StudentTitleEntry: { head: [Student, Arithmetic, undefined] },
  // Only the characters that have bust-up sprites
  Sprite: { head: [undefined, CharacterSprite] },
  LoadSprite: { head: [undefined, SpriteSheet] },
  Voice: { head: [VoiceCharacter, Chapter] },
  SetVariable: { head: [Variable, Arithmetic, undefined] },
  SetUI: { head: [UserInterface, UiVisibility] },
  SetFlag: { head: [FlagGroup, characterOffset, Bool] },
  IfFlag: {
    head: [FlagGroup, characterOffset, comparisonOperators, Bool],
    tail: [LogicalJoin, FlagGroup, characterOffset, comparisonOperators, Bool],
  },
  // The first operand is a variable; the value it is compared with is a plain number
  If: {
    head: [Variable, comparisonOperators, undefined],
    tail: [LogicalJoin, Variable, comparisonOperators, undefined],
  },
  IfFreeTimeEvent: { head: [undefined, comparisonOperators, undefined] },
  IfRelationship: { head: [undefined, comparisonOperators, undefined] },
};

export function isDependent(source: ArgumentSource): source is DependentValues {
  return source !== undefined && "tables" in source;
}

/** The source for argument `index`, repeating the tail pattern for variable-length instructions. */
export function sourceAt(spec: EditableArguments, index: number): ArgumentSource {
  if (index < spec.head.length) {
    return spec.head[index];
  }
  const tail = spec.tail ?? [];
  return tail.length === 0 ? undefined : tail[(index - spec.head.length) % tail.length];
}

/** The concrete name table for argument `index`, following one level of dependency. */
export function tableAt(spec: EditableArguments, args: readonly string[], index: number): NamedValues | undefined {
  const source = sourceAt(spec, index);
  if (!isDependent(source)) {
    return source;
  }
  const controllingIndex = index + source.argument;
  const controllingTable = sourceAt(spec, controllingIndex);
  const controlling = numericValue(
    args[controllingIndex] ?? "",
    isDependent(controllingTable) ? undefined : controllingTable,
  );
  return controlling === undefined ? undefined : source.tables[controlling];
}

/** Canonical member names of a table, in declaration order; reverse-mapping keys and aliases are skipped. */
export function enumNames(values: NamedValues): string[] {
  return Object.keys(values).filter((key) => Number.isNaN(Number(key)) && values[values[key] as number] === key);
}

/** The numeric value of a source argument that is either a number or a name in `values`. */
export function numericValue(arg: string, values: NamedValues | undefined): number | undefined {
  if (values !== undefined && typeof values[arg] === "number") {
    return values[arg] as number;
  }
  const n = Number(arg);
  return arg.trim() !== "" && !Number.isNaN(n) ? n : undefined;
}

/** The enum member name for a source argument, which may already be a name or still a number. */
export function resolveName(values: NamedValues, arg: string): string | undefined {
  if (Number.isNaN(Number(arg))) {
    return typeof values[arg] === "number" ? arg : undefined;
  }
  const name = values[Number(arg)];
  return typeof name === "string" ? name : undefined;
}
