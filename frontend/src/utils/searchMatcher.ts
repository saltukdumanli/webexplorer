/**
 * [TR] Gelişmiş Arama Eşleştirici: C# Directory.GetFiles benzeri wildcard (*.*, *.cs), Regex ve yol (path) aramalarını istemci tarafında (UI) gerçekleştiren yardımcı modül.
 * [EN] Advanced Search Matcher: Client-side (UI) utility for wildcard (*.*, *.cs), Regex, and path searches similar to C# Directory.GetFiles.
 */

import { ExplorerItem } from '@/types/explorer';

export type SearchMode = 'auto' | 'wildcard' | 'regex' | 'text';

export interface MatchOptions {
  mode?: SearchMode;
  matchPath?: boolean;
  basePath?: string;
  caseSensitive?: boolean;
}

/**
 * [TR] Wildcard glob desenini (*, ?) güvenli bir RegExp nesnesine dönüştürür.
 * [EN] Converts wildcard glob pattern (*, ?) to a safe RegExp object.
 */
export function wildcardToRegex(pattern: string, caseSensitive = false): RegExp {
  const trimmed = pattern.trim();

  // *.* in Windows / .NET Directory.GetFiles matches any file
  if (trimmed === '*.*') {
    return new RegExp('^.+$', caseSensitive ? '' : 'i');
  }

  // Escape special regex characters except * and ?
  const escaped = trimmed
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');

  return new RegExp(`^${escaped}$`, caseSensitive ? '' : 'i');
}

/**
 * [TR] Sorgunun regex deseni olup olmadığını kontrol eder (/pattern/ veya /pattern/flags).
 * [EN] Checks if query is a regex literal (/pattern/ or /pattern/flags).
 */
export function parseRegexLiteral(query: string): RegExp | null {
  const trimmed = query.trim();
  const match = trimmed.match(/^\/(.+)\/([gimsuy]*)$/);
  if (match) {
    try {
      const flags = match[2].includes('i') ? match[2] : match[2] + 'i';
      return new RegExp(match[1], flags);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * [TR] Verilen dosya/klasör öğesinin arama sorgusu ile eşleşip eşleşmediğini kontrol eder.
 * Desteklenenler:
 * 1. Wildcard: *.*, *.cs, test_*, *.log, a?b.txt, çoklu desen (*.png;*.jpg)
 * 2. Regex: ^app.*\.tsx?$, /pattern/i
 * 3. Path Search: Alt klasör yollarında arama (örn: backend/src, controllers/)
 * 4. Metin: Büyük/küçük harf duyarsız alt dize araması
 *
 * [EN] Checks if an item matches the search query. Supports wildcard, regex, path search, and text.
 */
export function matchItem(
  item: ExplorerItem,
  query: string,
  options: MatchOptions = {}
): boolean {
  if (!query || !query.trim()) return true;

  const {
    mode = 'auto',
    matchPath = true,
    basePath = '',
    caseSensitive = false,
  } = options;

  const rawQuery = query.trim();
  const name = item.name || '';

  // Calculate relative path if basePath is provided
  let relPath = item.path || '';
  if (basePath && relPath.toLowerCase().startsWith(basePath.toLowerCase())) {
    relPath = relPath.slice(basePath.length).replace(/^[/\\]+/, '');
  }

  // 1. Regex Match (Explicit mode or /.../ format)
  const regexLiteral = parseRegexLiteral(rawQuery);
  if (mode === 'regex' || regexLiteral) {
    try {
      const rx =
        regexLiteral ||
        new RegExp(rawQuery, caseSensitive ? '' : 'i');

      if (rx.test(name)) return true;
      if (matchPath && rx.test(relPath)) return true;
      return false;
    } catch {
      // Incomplete regex while typing: fallback to substring
    }
  }

  // 2. Wildcard Match (Supports comma or semicolon separated patterns e.g. *.cs;*.ts;*.json)
  const isWildcardQuery =
    mode === 'wildcard' ||
    rawQuery.includes('*') ||
    rawQuery.includes('?');

  if (isWildcardQuery && mode !== 'text') {
    const patterns = rawQuery.split(/[;,]/).map((p) => p.trim()).filter(Boolean);

    for (const pat of patterns) {
      try {
        const rx = wildcardToRegex(pat, caseSensitive);
        if (rx.test(name)) return true;
        if (matchPath && rx.test(relPath)) return true;
      } catch {
        // Fallback
      }
    }

    // Also check extension directly if pattern is like *.ext
    if (rawQuery.startsWith('*.') && !rawQuery.includes('/') && !rawQuery.includes('\\')) {
      const expectedExt = rawQuery.slice(2).toLowerCase();
      if ((item.extension || '').toLowerCase() === expectedExt) {
        return true;
      }
    }
  }

  // 3. Substring / Path Search
  const searchNeedle = caseSensitive ? rawQuery : rawQuery.toLowerCase();
  const searchName = caseSensitive ? name : name.toLowerCase();
  const searchPath = caseSensitive ? relPath : relPath.toLowerCase();

  if (searchName.includes(searchNeedle)) return true;
  if (matchPath && searchPath.includes(searchNeedle)) return true;

  return false;
}

/**
 * [TR] Öğe listesini birincil arama (wildcard/regex/path) ve ikincil (gelen listede filtreleme) ile filtreler.
 * [EN] Filters item list using primary search (wildcard/regex/path) and secondary (filter in results).
 */
export function filterItems(
  items: ExplorerItem[],
  primaryQuery: string,
  secondaryFilter: string,
  options: MatchOptions = {}
): ExplorerItem[] {
  let result = items;

  // Primary search (supports wildcard, regex, path)
  if (primaryQuery && primaryQuery.trim()) {
    result = result.filter((it) => matchItem(it, primaryQuery, options));
  }

  // Secondary filter (quick instant filter on the returned results)
  if (secondaryFilter && secondaryFilter.trim()) {
    const filterNeedle = secondaryFilter.trim().toLowerCase();
    result = result.filter((it) => {
      const n = (it.name || '').toLowerCase();
      const p = (it.path || '').toLowerCase();
      const ext = (it.extension || '').toLowerCase();
      return n.includes(filterNeedle) || p.includes(filterNeedle) || ext.includes(filterNeedle);
    });
  }

  return result;
}
