import xss from 'xss';

export function sanitizeText(input: string | null | undefined): string | null | undefined {
  if (input === null || input === undefined) return input;
  return xss(input.trim());
}
