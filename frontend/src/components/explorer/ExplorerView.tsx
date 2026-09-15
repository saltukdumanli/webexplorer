/**
 * [TR] Bağımsız Dosya Gezgini Görünümü (ExplorerView): Herhangi bir sayfada veya modal içerisinde çalışabilen, varsayılan sunucu kodu (defaultServerCode) ve başlangıç yolu destekleyen merkezi gezgin bileşeni.
 * [EN] Standalone File Explorer View (ExplorerView): Central explorer component capable of rendering on any page or inside a modal, supporting defaultServerCode and initial path.
 */

'use client';

import React, { useState, useEffect, useCallback, useTransition, useMemo, useRef } from 'react';
import { message } from 'antd';
import { ServerNode, ExplorerItem, BrowseResult, ExplorerTab } from '@/types/explorer';
import { SearchMode } from '@/utils/searchMatcher';
import {
  explorerService,
  canonicalizePath,
  isPathWithinRoot,
} from '@/services/explorerService';
import { useI18n } from '@/i18n/LanguageContext';
import { HeaderBar } from './HeaderBar';
import { ExplorerTabs } from './ExplorerTabs';
import { AddressBar } from './AddressBar';
import { ServerFolderTree } from './ServerFolderTree';
import { FileListTable } from './FileListTable';
import { StatusBar } from './StatusBar';
import { CreateModal } from './Modals/CreateModal';
import { RenameModal } from './Modals/RenameModal';
import { PreviewModal } from './Modals/PreviewModal';
import { UploadModal } from './Modals/UploadModal';
import { TransactionsDrawer } from './Modals/TransactionsDrawer';

export interface ExplorerViewProps {
  /**
   * [TR] Başlangıçta seçili gelecek sunucu kodu (örn: 'srv-prod-01', 'srv-db-01')
   * [EN] Default selected server code (e.g. 'srv-prod-01', 'srv-db-01')
   */
  defaultServerCode?: string;

  /**
   * [TR] Başlangıçta açılacak dizin yolu (opsiyonel; belirtilmezse sunucunun rootPath'i kullanılır)
   * [EN] Initial directory path (optional; defaults to server's rootPath if not specified)
   */
  defaultPath?: string;

  /**
   * [TR] Modal veya tam ekran kullanımında kapatma butonu tıklandığında çalışacak fonksiyon
   * [EN] Callback when close button is clicked in modal or fullscreen mode
   */
  onClose?: () => void;

  /**
   * [TR] Üst başlık çubuğunda (HeaderBar) kapatma butonunun gösterilip gösterilmeyeceği
   * [EN] Whether to display the close button in HeaderBar
   */
  showCloseButton?: boolean;

  /**
   * [TR] Bileşen konteyner yüksekliği (varsayılan: '100%')
   * [EN] Component container height (default: '100%')
   */
  height?: string | number;

  /**
   * [TR] İlave CSS stilleri
   * [EN] Additional container CSS styles
   */
  style?: React.CSSProperties;
}

export const ExplorerView: React.FC<ExplorerViewProps> = ({
  defaultServerCode,
  defaultPath,
  onClose,
  showCloseButton = false,
  height = '100%',
  style,
}) => {
  const { t } = useI18n();
  const [isPending, startTransition] = useTransition();

  // State
  const [servers, setServers] = useState<ServerNode[]>([]);
  const [allFolders, setAllFolders] = useState<ExplorerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [treeLoading, setTreeLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Tabs
  const [tabs, setTabs] = useState<ExplorerTab[]>([
    {
      id: 'tab-1',
      title: 'Explorer',
      serverCode: defaultServerCode || '',
      currentPath: defaultPath || '',
      history: defaultPath ? [defaultPath] : [],
      historyIndex: 0,
      viewMode: 'table',
      searchQuery: '',
      filterQuery: '',
      searchRecursive: false,
      searchMode: 'auto',
      matchPath: true,
      selectedIds: [],
    },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('tab-1');

  // Active tab helper
  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  // Browse result for active tab
  const [browseResult, setBrowseResult] = useState<BrowseResult | null>(null);
  const [allServerItems, setAllServerItems] = useState<ExplorerItem[]>([]);

  // When searchRecursive is active, fetch all server items on UI side
  useEffect(() => {
    if (!activeTab || !activeTab.serverCode) return;
    if (activeTab.searchRecursive && activeTab.searchQuery) {
      explorerService.getAllServerItems(activeTab.serverCode).then((items) => {
        setAllServerItems(items);
      });
    }
  }, [activeTab?.serverCode, activeTab?.searchRecursive, activeTab?.searchQuery]);

  // Displayed items: recursive descendants under currentPath or direct folder items
  const displayedItems = useMemo(() => {
    if (!browseResult) return [];

    if (activeTab.searchRecursive && activeTab.searchQuery) {
      const curPath = activeTab.currentPath;
      return allServerItems.filter((item) => {
        return (
          isPathWithinRoot(curPath, item.path) &&
          item.path.toLowerCase() !== curPath.toLowerCase()
        );
      });
    }

    return browseResult.items;
  }, [browseResult, activeTab?.searchRecursive, activeTab?.searchQuery, activeTab?.currentPath, allServerItems]);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createModalType, setCreateModalType] = useState<'folder' | 'file'>('folder');
  const [modalLoading, setModalLoading] = useState(false);

  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [itemToRename, setItemToRename] = useState<ExplorerItem | null>(null);

  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [itemToPreview, setItemToPreview] = useState<ExplorerItem | null>(null);

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [transactionsDrawerOpen, setTransactionsDrawerOpen] = useState(false);

  // Load servers initially
  const loadServersAndFolders = useCallback(async () => {
    try {
      setTreeLoading(true);
      const serverList = await explorerService.getServers();
      setServers(serverList);

      // Collect folders for all servers
      const folderList: ExplorerItem[] = [];
      for (const srv of serverList) {
        const code = srv.serverCode || srv.id || '';
        const f = await explorerService.getAllFoldersForServer(code);
        folderList.push(...f);
      }
      setAllFolders(folderList);

      // Resolve initial server
      let matched = serverList[0];
      if (defaultServerCode) {
        const found = serverList.find(
          (s) =>
            (s.serverCode || s.id || '').toLowerCase() === defaultServerCode.toLowerCase()
        );
        if (found) matched = found;
      }

      if (matched) {
        const targetPath = defaultPath || matched.rootPath;
        setTabs([
          {
            id: 'tab-1',
            title: `${matched.name} (${targetPath})`,
            serverCode: matched.serverCode || matched.id || '',
            currentPath: targetPath,
            history: [targetPath],
            historyIndex: 0,
            viewMode: 'table',
            searchQuery: '',
            filterQuery: '',
            searchRecursive: false,
            searchMode: 'auto',
            matchPath: true,
            selectedIds: [],
          },
        ]);
        setActiveTabId('tab-1');
        setIsInitialized(true);
      }
    } catch (err: any) {
      message.error(err.message || String(err));
    } finally {
      setTreeLoading(false);
    }
  }, [defaultServerCode, defaultPath]);

  useEffect(() => {
    loadServersAndFolders();
  }, [loadServersAndFolders]);

  // Browse active tab directory
  const loadDirectory = useCallback(
    async (serverCode?: string, path?: string) => {
      const safeServerCode =
        serverCode ||
        activeTab?.serverCode ||
        defaultServerCode ||
        servers[0]?.serverCode;

      if (!safeServerCode) return;

      const srv = servers.find(
        (s) =>
          (s.serverCode || s.id || '').toLowerCase() ===
          safeServerCode.toLowerCase()
      );

      const safePath = path || activeTab?.currentPath || srv?.rootPath || '';
      if (!safePath) return;

      setLoading(true);
      try {
        const result = await explorerService.browse(safeServerCode, safePath);
        setBrowseResult(result);

        // Update tab title
        const folderName =
          result.breadcrumbs.length > 0
            ? result.breadcrumbs[result.breadcrumbs.length - 1].name
            : result.currentPath;
        const newTitle = srv ? `${srv.name} (${folderName})` : folderName;

        setTabs((prev) =>
          prev.map((tItem) =>
            tItem.id === activeTabId
              ? {
                  ...tItem,
                  title: newTitle,
                  currentPath: result.currentPath,
                  serverCode: result.serverCode,
                }
              : tItem
          )
        );
      } catch (err: any) {
        message.error(err.message || String(err));
      } finally {
        setLoading(false);
      }
    },
    [activeTabId, activeTab?.serverCode, activeTab?.currentPath, defaultServerCode, servers]
  );

  // Trigger loadDirectory once initialized
  useEffect(() => {
    if (!isInitialized) return;
    if (activeTab && activeTab.serverCode && activeTab.currentPath) {
      loadDirectory(activeTab.serverCode, activeTab.currentPath);
    }
  }, [isInitialized, activeTabId, activeTab?.serverCode, activeTab?.currentPath, loadDirectory]);

  // Track previous defaultServerCode prop so we only react when the prop itself changes from outside
  const prevDefaultServerRef = useRef(defaultServerCode);

  useEffect(() => {
    if (!isInitialized || servers.length === 0) return;
    if (prevDefaultServerRef.current === defaultServerCode) return;

    prevDefaultServerRef.current = defaultServerCode;
    if (!defaultServerCode) return;

    const found = servers.find(
      (s) =>
        (s.serverCode || s.id || '').toLowerCase() === defaultServerCode.toLowerCase()
    );

    if (found) {
      const targetPath = defaultPath || found.rootPath;
      setTabs((prev) =>
        prev.map((tItem) =>
          tItem.id === activeTabId
            ? {
                ...tItem,
                title: `${found.name} (${targetPath})`,
                serverCode: found.serverCode || found.id || '',
                currentPath: targetPath,
                history: [targetPath],
                historyIndex: 0,
                searchQuery: '',
                filterQuery: '',
              }
            : tItem
        )
      );
    }
  }, [defaultServerCode, defaultPath, isInitialized, servers, activeTabId]);

  // Tab Handlers
  const handleTabChange = (key: string) => {
    setActiveTabId(key);
  };

  const handleTabEdit = (
    targetKey: React.MouseEvent | React.KeyboardEvent | string,
    action: 'add' | 'remove'
  ) => {
    if (action === 'add') {
      const newId = `tab-${Date.now()}`;
      const defaultServer =
        servers.find(
          (s) =>
            (s.serverCode || s.id || '').toLowerCase() ===
            (defaultServerCode || '').toLowerCase()
        ) || servers[0] || {
          serverCode: 'srv-prod-01',
          name: 'PROD-APP-01',
          rootPath: 'C:/app',
        };
      const rootP = defaultServer.rootPath || 'C:/app';

      const newTab: ExplorerTab = {
        id: newId,
        title: `${defaultServer.name} (${rootP})`,
        serverCode: defaultServer.serverCode || (defaultServer as any).id || 'srv-prod-01',
        currentPath: rootP,
        history: [rootP],
        historyIndex: 0,
        viewMode: 'table',
        searchQuery: '',
        filterQuery: '',
        searchRecursive: false,
        searchMode: 'auto',
        matchPath: true,
        selectedIds: [],
      };
      setTabs((prev) => [...prev, newTab]);
      setActiveTabId(newId);
    } else if (action === 'remove' && typeof targetKey === 'string') {
      if (tabs.length === 1) {
        message.warning(t('lastTabWarning'));
        return;
      }
      const newTabs = tabs.filter((tItem) => tItem.id !== targetKey);
      setTabs(newTabs);
      if (activeTabId === targetKey) {
        setActiveTabId(newTabs[newTabs.length - 1].id);
      }
    }
  };

  // Navigation: Navigate to arbitrary path
  const handleNavigate = (rawPath: string) => {
    if (!activeTab) return;
    const targetPath = canonicalizePath(rawPath);

    const srv = servers.find(
      (s) =>
        (s.serverCode || s.id || '').toLowerCase() ===
        (activeTab.serverCode || '').toLowerCase()
    );

    if (srv && srv.rootPath) {
      if (!isPathWithinRoot(srv.rootPath, targetPath)) {
        message.warning(t('pathManipulationForbidden'));
        return;
      }
    }

    if (targetPath.toLowerCase() === activeTab.currentPath.toLowerCase()) return;

    const newHistory = activeTab.history.slice(0, activeTab.historyIndex + 1);
    newHistory.push(targetPath);

    setTabs((prev) =>
      prev.map((tItem) =>
        tItem.id === activeTab.id
          ? {
              ...tItem,
              currentPath: targetPath,
              history: newHistory,
              historyIndex: newHistory.length - 1,
              searchQuery: '',
              filterQuery: '',
            }
          : tItem
      )
    );
  };

  // Go Back
  const handleGoBack = () => {
    if (!activeTab || activeTab.historyIndex <= 0) return;
    const newIndex = activeTab.historyIndex - 1;
    const targetPath = activeTab.history[newIndex];
    setTabs((prev) =>
      prev.map((tItem) =>
        tItem.id === activeTab.id
          ? { ...tItem, currentPath: targetPath, historyIndex: newIndex }
          : tItem
      )
    );
  };

  // Go Forward
  const handleGoForward = () => {
    if (!activeTab || activeTab.historyIndex >= activeTab.history.length - 1) return;
    const newIndex = activeTab.historyIndex + 1;
    const targetPath = activeTab.history[newIndex];
    setTabs((prev) =>
      prev.map((tItem) =>
        tItem.id === activeTab.id
          ? { ...tItem, currentPath: targetPath, historyIndex: newIndex }
          : tItem
      )
    );
  };

  // Go Up Level
  const handleGoUp = () => {
    if (browseResult && browseResult.parentPath) {
      handleNavigate(browseResult.parentPath);
    }
  };

  // Refresh current directory and folder tree
  const handleRefresh = async () => {
    if (activeTab) {
      await loadDirectory(activeTab.serverCode, activeTab.currentPath);
    }
    await loadServersAndFolders();
    message.success(t('refreshed'));
  };

  // Select node from Server panel
  const handleSelectTreeNode = (serverCode: string, path: string) => {
    if (!activeTab) return;
    setTabs((prev) =>
      prev.map((tItem) =>
        tItem.id === activeTab.id
          ? {
              ...tItem,
              serverCode,
              currentPath: path,
              history: [path],
              historyIndex: 0,
              searchQuery: '',
              filterQuery: '',
            }
          : tItem
      )
    );
  };

  // Search input change in active tab
  const handleSearchChange = (query: string) => {
    startTransition(() => {
      setTabs((prev) =>
        prev.map((tItem) =>
          tItem.id === activeTabId ? { ...tItem, searchQuery: query } : tItem
        )
      );
    });
  };

  // Filter input change (secondary search inside results)
  const handleFilterChange = (filter: string) => {
    startTransition(() => {
      setTabs((prev) =>
        prev.map((tItem) =>
          tItem.id === activeTabId ? { ...tItem, filterQuery: filter } : tItem
        )
      );
    });
  };

  // Search Recursive toggle
  const handleSearchRecursiveChange = (recursive: boolean) => {
    setTabs((prev) =>
      prev.map((tItem) =>
        tItem.id === activeTabId ? { ...tItem, searchRecursive: recursive } : tItem
      )
    );
  };

  // Search Mode
  const handleSearchModeChange = (mode: SearchMode) => {
    setTabs((prev) =>
      prev.map((tItem) =>
        tItem.id === activeTabId ? { ...tItem, searchMode: mode } : tItem
      )
    );
  };

  // Match Path
  const handleMatchPathChange = (matchPath: boolean) => {
    setTabs((prev) =>
      prev.map((tItem) =>
        tItem.id === activeTabId ? { ...tItem, matchPath } : tItem
      )
    );
  };

  // Clear Search
  const handleClearSearch = () => {
    setTabs((prev) =>
      prev.map((tItem) =>
        tItem.id === activeTabId
          ? { ...tItem, searchQuery: '', filterQuery: '' }
          : tItem
      )
    );
  };

  // View Mode change in active tab
  const handleViewModeChange = (mode: 'table' | 'grid') => {
    setTabs((prev) =>
      prev.map((tItem) =>
        tItem.id === activeTabId ? { ...tItem, viewMode: mode } : tItem
      )
    );
  };

  // Selection change
  const handleSelectIds = (ids: string[]) => {
    setTabs((prev) =>
      prev.map((tItem) =>
        tItem.id === activeTabId ? { ...tItem, selectedIds: ids } : tItem
      )
    );
  };

  // Item CRUD Handlers
  const handleOpenItem = (item: ExplorerItem) => {
    if (item.isFolder) {
      handleNavigate(item.path);
    } else {
      setItemToPreview(item);
      setPreviewModalOpen(true);
    }
  };

  const handleItemAction = (action: string, item: ExplorerItem) => {
    switch (action) {
      case 'open':
        handleOpenItem(item);
        break;
      case 'rename':
        setItemToRename(item);
        setRenameModalOpen(true);
        break;
      case 'delete':
        handleDeleteItem(item);
        break;
      case 'download':
        if (item.content) {
          const blob = new Blob([item.content], { type: 'text/plain;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = item.name;
          a.click();
          URL.revokeObjectURL(url);
          message.success(`"${item.name}" ${t('downloadSuccess')}`);
        } else {
          message.info(`${item.name} (${t('infoSize')}: ${item.size} bytes)`);
        }
        break;
      default:
        break;
    }
  };

  const handleCreateSubmit = async (values: {
    name: string;
    isFolder: boolean;
    initialContent?: string;
  }) => {
    if (!activeTab || !browseResult) return;
    setModalLoading(true);
    try {
      await explorerService.createItem({
        serverCode: activeTab.serverCode,
        path: browseResult.currentPath,
        name: values.name,
        isFolder: values.isFolder,
        initialContent: values.initialContent,
      });
      message.success(
        values.isFolder ? t('createSuccessFolder') : t('createSuccessFile')
      );
      setCreateModalOpen(false);
      await loadDirectory(activeTab.serverCode, browseResult.currentPath);
      await loadServersAndFolders();
    } catch (err: any) {
      message.error(err.message || 'Error');
    } finally {
      setModalLoading(false);
    }
  };

  const handleRenameSubmit = async (newName: string) => {
    if (!activeTab || !itemToRename || !browseResult) return;
    setModalLoading(true);
    try {
      await explorerService.renameItem({
        serverCode: activeTab.serverCode,
        path: itemToRename.path,
        newName,
      });
      message.success(t('renameSuccess'));
      setRenameModalOpen(false);
      setItemToRename(null);
      await loadDirectory(activeTab.serverCode, browseResult.currentPath);
      await loadServersAndFolders();
    } catch (err: any) {
      message.error(err.message || 'Error');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteItem = async (item: ExplorerItem) => {
    if (!activeTab || !browseResult) return;
    try {
      await explorerService.deleteItem({
        serverCode: activeTab.serverCode,
        path: item.path,
      });
      message.success(`"${item.name}" ${t('itemDeleted')}`);
      await loadDirectory(activeTab.serverCode, browseResult.currentPath);
      await loadServersAndFolders();
    } catch (err: any) {
      message.error(err.message || t('itemDeleteFailed'));
    }
  };

  const handleUploadFiles = async (files: File[]) => {
    if (!activeTab || !browseResult) return;
    try {
      const uploaded = await explorerService.uploadFiles(
        activeTab.serverCode,
        browseResult.currentPath,
        files
      );
      message.success(`${uploaded.length} ${t('uploadSuccess')}`);
      await loadDirectory(activeTab.serverCode, browseResult.currentPath);
      await loadServersAndFolders();
    } catch (err: any) {
      message.error(err.message || t('uploadFailed'));
    }
  };

  const activeServer = servers.find(
    (s) =>
      (s.serverCode || s.id || '').toLowerCase() ===
      (activeTab?.serverCode || '').toLowerCase()
  );

  return (
    <div
      id="explorer-view-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height,
        width: '100%',
        background: '#ffffff',
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* Header Bar */}
      <HeaderBar
        activeServer={activeServer}
        onRefresh={handleRefresh}
        onOpenTransactions={() => setTransactionsDrawerOpen(true)}
        onClose={onClose}
        showCloseButton={showCloseButton}
      />

      {/* Explorer Tabs */}
      <ExplorerTabs
        tabs={tabs}
        activeKey={activeTabId}
        onChange={handleTabChange}
        onEdit={handleTabEdit}
      />

      {/* Address Bar & Search */}
      <AddressBar
        currentPath={browseResult?.currentPath || activeTab.currentPath}
        breadcrumbs={browseResult?.breadcrumbs || []}
        canGoBack={activeTab.historyIndex > 0}
        canGoForward={activeTab.historyIndex < activeTab.history.length - 1}
        canGoUp={Boolean(browseResult?.parentPath)}
        searchQuery={activeTab.searchQuery}
        filterQuery={activeTab.filterQuery || ''}
        searchRecursive={activeTab.searchRecursive ?? false}
        searchMode={activeTab.searchMode || 'auto'}
        matchPath={activeTab.matchPath ?? true}
        viewMode={activeTab.viewMode}
        onGoBack={handleGoBack}
        onGoForward={handleGoForward}
        onGoUp={handleGoUp}
        onRefresh={handleRefresh}
        onNavigate={(path) => handleNavigate(path)}
        onSearchChange={handleSearchChange}
        onFilterChange={handleFilterChange}
        onSearchRecursiveChange={handleSearchRecursiveChange}
        onSearchModeChange={handleSearchModeChange}
        onMatchPathChange={handleMatchPathChange}
        onViewModeChange={handleViewModeChange}
        onOpenCreateFolder={() => {
          setCreateModalType('folder');
          setCreateModalOpen(true);
        }}
        onOpenCreateFile={() => {
          setCreateModalType('file');
          setCreateModalOpen(true);
        }}
        onOpenUpload={() => {
          setUploadModalOpen(true);
        }}
      />

      {/* Main Content Area: Left Sidebar (Server Panel) + Right Content (Files) */}
      <div id="app-content-body" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left: Server Selection Panel */}
        <ServerFolderTree
          servers={servers}
          activeServerCode={activeTab.serverCode}
          currentPath={activeTab.currentPath}
          allFolders={allFolders}
          loading={treeLoading}
          onSelectNode={handleSelectTreeNode}
        />

        {/* Right: File List / Grid View */}
        <div
          id="app-files-panel"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            background: '#ffffff',
          }}
        >
          <FileListTable
            items={displayedItems}
            loading={loading}
            searchQuery={activeTab.searchQuery}
            filterQuery={activeTab.filterQuery || ''}
            searchRecursive={activeTab.searchRecursive ?? false}
            searchMode={activeTab.searchMode || 'auto'}
            matchPath={activeTab.matchPath ?? true}
            viewMode={activeTab.viewMode}
            selectedIds={activeTab.selectedIds}
            onSelectIds={handleSelectIds}
            onOpenFolder={(path) => handleNavigate(path)}
            onOpenFilePreview={(item) => {
              setItemToPreview(item);
              setPreviewModalOpen(true);
            }}
            onRenameItem={(item) => {
              setItemToRename(item);
              setRenameModalOpen(true);
            }}
            onDeleteItem={handleDeleteItem}
            onOpenCreateFolder={() => {
              setCreateModalType('folder');
              setCreateModalOpen(true);
            }}
            onOpenCreateFile={() => {
              setCreateModalType('file');
              setCreateModalOpen(true);
            }}
            onClearSearch={handleClearSearch}
          />

          {/* Status Bar */}
          <StatusBar
            serverName={activeServer?.name || activeTab.serverCode}
            totalFolders={browseResult?.totalFolders ?? 0}
            totalFiles={browseResult?.totalFiles ?? 0}
            totalSize={browseResult?.totalSize ?? 0}
            selectedCount={activeTab.selectedIds.length}
            currentPath={browseResult?.currentPath || activeTab.currentPath}
          />
        </div>
      </div>

      {/* Modals & Drawers */}
      <CreateModal
        open={createModalOpen}
        initialType={createModalType}
        currentPath={browseResult?.currentPath || activeTab.currentPath}
        confirmLoading={modalLoading}
        onCancel={() => setCreateModalOpen(false)}
        onSubmit={handleCreateSubmit}
      />

      <RenameModal
        open={renameModalOpen}
        item={itemToRename}
        confirmLoading={modalLoading}
        onCancel={() => {
          setRenameModalOpen(false);
          setItemToRename(null);
        }}
        onSubmit={handleRenameSubmit}
      />

      <PreviewModal
        open={previewModalOpen}
        item={itemToPreview}
        onClose={() => {
          setPreviewModalOpen(false);
          setItemToPreview(null);
        }}
      />

      <UploadModal
        open={uploadModalOpen}
        currentPath={browseResult?.currentPath || activeTab.currentPath}
        onCancel={() => setUploadModalOpen(false)}
        onUpload={handleUploadFiles}
      />

      <TransactionsDrawer
        open={transactionsDrawerOpen}
        onClose={() => setTransactionsDrawerOpen(false)}
        servers={servers}
        activeServerCode={activeTab.serverCode}
      />
    </div>
  );
};
