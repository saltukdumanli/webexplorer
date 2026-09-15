/**
 * [TR] Dosya Gezgini Tip Tanımları: Sunucu, klasör, dosya, sekme ve transaction modellerinin TypeScript arayüz tanımlarını içerir.
 * [EN] File Explorer Type Definitions: Contains TypeScript interface definitions for servers, folders, files, tabs, and transaction models.
 */

/**
 * [TR] Sunucu Düğüm Arayüzü
 * [EN] Server Node Interface
 */
export interface ServerNode {
  serverCode: string;
  id?: string;
  name: string;
  host: string;
  osType?: string;
  status: 'Online' | 'Offline';
  rootPath: string;
}

/**
 * [TR] Dosya / Klasör Gezgin Öğesi Arayüzü
 * [EN] File / Folder Explorer Item Interface
 */
export interface ExplorerItem {
  id: string;
  serverCode: string;
  name: string;
  path: string;
  parentPath: string;
  isFolder: boolean;
  extension: string;
  size: number;
  modifiedAt: string;
  createdAt: string;
  content?: string;
}

/**
 * [TR] Ekmek Kırıntısı (Breadcrumb) Düğüm Arayüzü
 * [EN] Breadcrumb Node Interface
 */
export interface BreadcrumbItem {
  name: string;
  path: string;
}

/**
 * [TR] Dizin Tarama Yanıt Modeli
 * [EN] Directory Browse Result Model
 */
export interface BrowseResult {
  serverCode: string;
  serverName: string;
  currentPath: string;
  parentPath: string | null;
  breadcrumbs: BreadcrumbItem[];
  items: ExplorerItem[];
  totalFolders: number;
  totalFiles: number;
  totalSize: number;
}

/**
 * [TR] Gezgin Sekmesi Durum Modeli
 * [EN] Explorer Tab State Model
 */
export interface ExplorerTab {
  id: string;
  title: string;
  serverCode: string;
  currentPath: string;
  history: string[];
  historyIndex: number;
  viewMode: 'table' | 'grid';
  searchQuery: string;
  filterQuery?: string;
  searchRecursive?: boolean;
  searchMode?: 'auto' | 'wildcard' | 'regex' | 'text';
  matchPath?: boolean;
  selectedIds: string[];
}

/**
 * [TR] Yeni Öğe Oluşturma İstek Yükü
 * [EN] Create Item Request Payload
 */
export interface CreateItemPayload {
  serverCode: string;
  path: string;
  name: string;
  isFolder: boolean;
  initialContent?: string;
}

/**
 * [TR] Yeniden Adlandırma İstek Yükü
 * [EN] Rename Item Request Payload
 */
export interface RenameItemPayload {
  serverCode: string;
  path: string;
  newName: string;
}

/**
 * [TR] Öğe Silme İstek Yükü
 * [EN] Delete Item Request Payload
 */
export interface DeleteItemPayload {
  serverCode: string;
  path: string;
}

/**
 * [TR] Dosya Manipülasyon Transaction Modeli
 * [EN] File Manipulation Transaction Model
 */
export interface FileTransaction {
  id: string;
  serverCode: string;
  transactionType: 'CreateFile' | 'CreateFolder' | 'Rename' | 'Delete' | 'Upload';
  path: string;
  oldPath?: string;
  newPath?: string;
  itemName: string;
  isFolder: boolean;
  size: number;
  status: 'Committed' | 'Failed' | 'RolledBack';
  timestamp: string;
  details: string;
  previousContent?: string;
}
