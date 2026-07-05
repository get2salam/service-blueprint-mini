const MAX_C0_CONTROL_CODE = 0x1f;
const DEL_CODE = 0x7f;

function isControlCodePoint(code) {
  return code <= MAX_C0_CONTROL_CODE || code === DEL_CODE;
}

/**
 * Strips ASCII control characters (including ESC, CR, LF, and DEL) from a
 * value before it is written to a terminal. Blueprint backups are untrusted
 * input — a crafted `title`/`owner`/`handoff` could otherwise smuggle ANSI
 * escape sequences (to rewrite terminal output) or newlines (to fabricate
 * extra report lines) into the CLI's stdout.
 */
export function sanitizeForDisplay(value) {
  const text = String(value ?? '');
  let result = '';
  let previousWasControl = false;
  for (const char of text) {
    if (isControlCodePoint(char.codePointAt(0))) {
      if (!previousWasControl) result += ' ';
      previousWasControl = true;
    } else {
      result += char;
      previousWasControl = false;
    }
  }
  return result.trim();
}
