/**
 * [TR] Dosya Gezgini Servisi: C# .NET Web API ile doğrudan iletişim kurarak dosya/klasör CRUD, listeleme, arama ve transaction işlemlerini yönetir.
 * [EN] File Explorer Service: Directly communicates with C# .NET Web API to handle file/folder CRUD, browsing, searching, and transaction operations.
 */

import {
  ServerNode,
  ExplorerItem,
  BrowseResult,
  CreateItemPayload,
  RenameItemPayload,
  DeleteItemPayload,
  FileTransaction,
} from '@/types/explorer';

/**
 * [TR] Bir yolu standart hale getirir, ters slash'leri düzeltir, .. ve . segmentlerini güvenle çözer.
 * [EN] Canonicalizes a path, fixes backslashes, and safely resolves .. and . segments.
 */
export function canonicalizePath(path: string): string {
  if (!path) return '/';
  let p = path.replace(/\\/g, '/').trim();
  p = p.replace(/\/+/g, '/');

  let drive = '';
  if (/^[a-zA-Z]:/.test(p)) {
    drive = p.substring(0, 2);
    p = p.substring(2);
  }

  const isAbsolute = p.startsWith('/');
  const segments = p.split('/').filter(Boolean);
  const stack: string[] = [];

  for (const seg of segments) {
    if (seg === '.') continue;
    if (seg === '..') {
      if (stack.length > 0) {
        stack.pop();
      }
    } else {
      stack.push(seg);
    }
  }

  const resolved = stack.join('/');
  if (drive) {
    return resolved ? `${drive}/${resolved}` : `${drive}/`;
  }
  if (isAbsolute) {
    return `/${resolved}`;
  }
  return resolved || '/';
}

/**
 * [TR] targetPath'in rootPath içerisinde kalıp kalmadığını sıkı bir şekilde denetler.
 * [EN] Strictly checks whether targetPath resides within rootPath.
 */
export function isPathWithinRoot(rootPath: string, targetPath: string): boolean {
  if (!rootPath || !targetPath) return false;
  const cRoot = canonicalizePath(rootPath).toLowerCase();
  const cTarget = canonicalizePath(targetPath).toLowerCase();

  if (cTarget === cRoot) return true;

  const prefix = cRoot.endsWith('/') ? cRoot : `${cRoot}/`;
  return cTarget.startsWith(prefix);
}

// Backend C# .NET API Client Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/explorer';

export const explorerService = {
  /**
   * [TR] Kayıtlı sunucu listesini backend'den getirir.
   * [EN] Retrieves list of registered servers from backend.
   */
  async getServers(): Promise<ServerNode[]> {
    const res = await fetch(`${API_BASE_URL}/servers`);
    if (!res.ok) {
      throw new Error(`Failed to fetch servers (${res.status} ${res.statusText})`);
    }
    const json = await res.json();
    if (json.success && json.data) return json.data;
    throw new Error(json.message || 'Sunucu listesi alınamadı.');
  },

  /**
   * [TR] Belirtilen sunucu ve yoldaki dosya ve klasörleri listeler.
   * [EN] Lists files and folders in specified server and path.
   */
  async browse(serverCode: string, path: string): Promise<BrowseResult> {
    const query = new URLSearchParams({ serverCode, path });
    const res = await fetch(`${API_BASE_URL}/browse?${query.toString()}`);
    if (!res.ok) {
      throw new Error(`Failed to browse directory (${res.status} ${res.statusText})`);
    }
    const json = await res.json();
    if (json.success && json.data) return json.data;
    throw new Error(json.message || 'Dizin listelenemedi.');
  },

  /**
   * [TR] Sunucudaki tüm öğeleri recursive olarak backend arama endpoint'i üzerinden çeker.
   * [EN] Recursively fetches all items in a server via backend search endpoint.
   */
  async getAllServerItems(serverCode: string): Promise<ExplorerItem[]> {
    const query = new URLSearchParams({
      serverCode,
      recursive: 'true',
      query: '',
    });
    const res = await fetch(`${API_BASE_URL}/search?${query.toString()}`);
    if (!res.ok) {
      return [];
    }
    const json = await res.json();
    if (json.success && json.data && json.data.items) {
      return json.data.items;
    }
    return [];
  },

  /**
   * [TR] Yeni klasör veya dosya oluşturur.
   * [EN] Creates a new folder or file.
   */
  async createItem(payload: CreateItemPayload): Promise<ExplorerItem> {
    const res = await fetch(`${API_BASE_URL}/item`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (json.success && json.data) return json.data;
    throw new Error(json.message || 'Öğe oluşturulamadı.');
  },

  /**
   * [TR] Mevcut bir dosya veya klasörü yeniden adlandırır.
   * [EN] Renames an existing file or folder.
   */
  async renameItem(payload: RenameItemPayload): Promise<ExplorerItem> {
    const res = await fetch(`${API_BASE_URL}/rename`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (json.success && json.data) return json.data;
    throw new Error(json.message || 'Yeniden adlandırılamadı.');
  },

  /**
   * [TR] Bir dosya veya klasörü siler.
   * [EN] Deletes a file or folder.
   */
  async deleteItem(payload: DeleteItemPayload): Promise<boolean> {
    const query = new URLSearchParams({
      serverCode: payload.serverCode,
      path: payload.path,
    });
    const res = await fetch(`${API_BASE_URL}/item?${query.toString()}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    if (json.success) return true;
    throw new Error(json.message || 'Silinemedi.');
  },

  /**
   * [TR] Hedef dizine bir veya daha fazla dosya yükler.
   * [EN] Uploads one or more files to the target directory.
   */
  async uploadFiles(
    serverCode: string,
    path: string,
    files: File[]
  ): Promise<ExplorerItem[]> {
    const formData = new FormData();
    formData.append('serverCode', serverCode);
    formData.append('path', path);
    for (const file of files) {
      formData.append('files', file);
    }
    const res = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });
    const json = await res.json();
    if (json.success && json.data) return json.data;
    throw new Error(json.message || 'Yükleme başarısız.');
  },

  /**
   * [TR] Dosya manipülasyon işlem geçmişini (transaction logs) filtre ve arama kriterleriyle en fazla 1000 kayıt olacak şekilde getirir.
   * [EN] Retrieves file manipulation transaction logs with optional server filter, search query, and max 1000 limit.
   */
  async getTransactions(
    serverCode?: string,
    search?: string,
    limit: number = 1000
  ): Promise<FileTransaction[]> {
    const params = new URLSearchParams();
    if (serverCode && serverCode !== 'all') {
      params.append('serverCode', serverCode);
    }
    if (search && search.trim()) {
      params.append('search', search.trim());
    }
    params.append('limit', String(limit));

    const res = await fetch(`${API_BASE_URL}/transactions?${params.toString()}`);
    if (!res.ok) {
      return [];
    }
    const json = await res.json();
    if (json.success && json.data) return json.data;
    return [];
  },

  /**
   * [TR] Belirli bir sunucudaki tüm klasör listesini ağaç görünümü için çeker.
   * [EN] Fetches all folders of a specific server for the tree view.
   */
  async getAllFoldersForServer(serverCode: string): Promise<ExplorerItem[]> {
    const items = await this.getAllServerItems(serverCode);
    return items.filter((i) => i.isFolder);
  },
};
