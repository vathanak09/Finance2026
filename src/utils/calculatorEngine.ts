/**
 * Safe mathematical expression evaluator and formatter for FloatingCalculator.
 * Avoids eval/Function and handles standard calculator precedence and % semantics.
 */

const OP_CHARS = new Set(['+', '-', '*', '/']);

export function isOperator(ch: string): boolean {
  return OP_CHARS.has(ch);
}

/**
 * Tokenizes a raw calculator expression (using +, -, *, /, %, digits, .).
 */
function tokenize(expr: string): string[] {
  const tokens: string[] = [];
  let i = 0;

  while (i < expr.length) {
    const ch = expr[i];
    if (ch === ' ') {
      i++;
      continue;
    }

    // Unary minus at start or after an operator
    if (
      ch === '-' &&
      (tokens.length === 0 || isOperator(tokens[tokens.length - 1]))
    ) {
      let num = '-';
      i++;
      while (i < expr.length && (/[0-9.]/.test(expr[i]))) {
        num += expr[i];
        i++;
      }
      if (num === '-') {
        tokens.push('-');
      } else {
        tokens.push(num);
      }
      continue;
    }

    if (/[0-9.]/.test(ch)) {
      let num = '';
      while (i < expr.length && /[0-9.]/.test(expr[i])) {
        num += expr[i];
        i++;
      }
      tokens.push(num);
      continue;
    }

    if (OP_CHARS.has(ch) || ch === '%') {
      tokens.push(ch);
      i++;
      continue;
    }

    i++;
  }

  return tokens;
}

/**
 * Evaluates a raw expression string. Returns null if incomplete or invalid (e.g. divide by zero).
 */
export function evaluateExpression(rawExpr: string): number | null {
  if (!rawExpr || !rawExpr.trim()) return null;

  // Strip trailing operator so live preview works smoothly while typing e.g. "1280+"
  let cleaned = rawExpr.trim();
  while (cleaned.length > 0 && isOperator(cleaned[cleaned.length - 1])) {
    cleaned = cleaned.slice(0, -1);
  }
  if (!cleaned) return null;

  const rawTokens = tokenize(cleaned);
  if (rawTokens.length === 0) return null;

  // Convert numbers and handle '%' tokens
  // Standard calculator rule:
  // - "A + B%" => A + (A * B / 100)
  // - "A - B%" => A - (A * B / 100)
  // - standalone "B%" or after * or / => B / 100
  const resolved: (number | string)[] = [];
  for (let i = 0; i < rawTokens.length; i++) {
    const tok = rawTokens[i];
    if (tok === '%') {
      const prev = resolved[resolved.length - 1];
      if (typeof prev !== 'number') return null;

      const opBefore = resolved.length >= 2 ? resolved[resolved.length - 2] : null;
      const numBefore = resolved.length >= 3 ? resolved[resolved.length - 3] : null;

      if ((opBefore === '+' || opBefore === '-') && typeof numBefore === 'number') {
        resolved[resolved.length - 1] = (numBefore * prev) / 100;
      } else {
        resolved[resolved.length - 1] = prev / 100;
      }
    } else if (isOperator(tok)) {
      resolved.push(tok);
    } else {
      const parsed = Number(tok);
      if (isNaN(parsed) || !isFinite(parsed)) return null;
      resolved.push(parsed);
    }
  }

  if (resolved.length === 0 || typeof resolved[0] !== 'number') return null;

  // Pass 1: * and /
  const pass1: (number | string)[] = [resolved[0]];
  for (let i = 1; i < resolved.length; i += 2) {
    const op = resolved[i];
    const rhs = resolved[i + 1];
    if (typeof op !== 'string' || typeof rhs !== 'number') return null;

    if (op === '*' || op === '/') {
      const lhs = pass1.pop() as number;
      if (op === '/') {
        if (rhs === 0) return null;
        pass1.push(lhs / rhs);
      } else {
        pass1.push(lhs * rhs);
      }
    } else {
      pass1.push(op, rhs);
    }
  }

  // Pass 2: + and -
  let result = pass1[0] as number;
  for (let i = 1; i < pass1.length; i += 2) {
    const op = pass1[i];
    const rhs = pass1[i + 1];
    if (typeof op !== 'string' || typeof rhs !== 'number') return null;
    if (op === '+') result += rhs;
    else if (op === '-') result -= rhs;
  }

  if (!isFinite(result) || isNaN(result)) return null;
  // Clean IEEE 754 precision artifacts (e.g. 0.1 + 0.2)
  return Number(result.toPrecision(12));
}

/**
 * Formats a numeric result cleanly with thousand separators and up to 8 decimal places.
 */
export function formatCalcNumber(num: number): string {
  if (!isFinite(num) || isNaN(num)) return '0';
  if (Math.abs(num) >= 1e15) {
    return num.toExponential(4);
  }
  const rounded = Number(num.toFixed(8));
  return rounded.toLocaleString('en-US', {
    maximumFractionDigits: 8,
  });
}

/**
 * Converts a raw expression like "1280+398*0.5" into "1,280+398×0.5" for display.
 */
export function formatExpressionForDisplay(rawExpr: string): string {
  if (!rawExpr) return '0';

  return rawExpr
    .replace(/\d+(\.\d*)?/g, (match) => {
      const [intPart, decPart] = match.split('.');
      const formattedInt = intPart ? Number(intPart).toLocaleString('en-US') : '0';
      return decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt;
    })
    .replace(/\*/g, '×')
    .replace(/\//g, '÷')
    .replace(/-/g, '−');
}
