/**
 * Deterministische rel_code generator voor testdata.
 * Prefix TST maakt testdata herkenbaar voor cleanup.
 */
let counter = 0;

export function resetRelCodeCounter() {
  counter = 0;
}

export function nextRelCode(): string {
  counter++;
  return `TSTN${String(counter).padStart(3, "0")}`;
}

export function relCode(n: number): string {
  return `TSTN${String(n).padStart(3, "0")}`;
}
