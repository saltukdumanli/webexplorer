/**
 * [TR] Ana Dosya Gezgini Sayfası (FileExplorerPage): Sekmeler, sunucu paneli, adres çubuğu, dosya tablosu, durum çubuğu ve tüm operasyonel modalların durumunu yöneten merkezi sayfa bileşeni.
 * [EN] Main File Explorer Page (FileExplorerPage): Central page component managing state for tabs, server panel, address bar, file table, status bar, and all operational modals.
 */

'use client';

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import { message } from 'antd';
import { ServerNode, ExplorerItem, BrowseResult, ExplorerTab } from '@/types/explorer';
import { SearchMode } from '@/utils/searchMatcher';
import {
  explorerService,
  canonicalizePath,
  isPathWithinRoot,
} from '@/services/explorerService';
import { useI18n } from '@/i18n/LanguageContext';
import { HeaderBar } from '@/components/explorer/HeaderBar';
import { ExplorerTabs } from '@/components/explorer/ExplorerTabs';
import { AddressBar } from '@/components/explorer/AddressBar';
import { ServerFolderTree } from '@/components/explorer/ServerFolderTree';
import { FileListTable } from '@/components/explorer/FileListTable';
import { StatusBar } from '@/components/explorer/StatusBar';
import { CreateModal } from '@/components/explorer/Modals/CreateModal';
import { RenameModal } from '@/components/explorer/Modals/RenameModal';
import { PreviewModal } from '@/components/explorer/Modals/PreviewModal';
import { UploadModal } from '@/components/explorer/Modals/UploadModal';
import { TransactionsDrawer } from '@/components/explorer/Modals/TransactionsDrawer';

export default function FileExplorerPage() {
  const { t } = useI18n();
  const [isPending, startTransition] = useTransition();

  // State
  const [servers, setServers] = useState<ServerNode[]>([]);
  const [allFolders, setAllFolders] = useState<ExplorerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [treeLoading, setTreeLoading] = useState(false);

  // Tabs
  const [tabs, setTabs] = useState<ExplorerTab[]>([
    {
      id: 'tab-1',
      title: 'PROD-APP-01 (C:/app)',
      serverCode: 'srv-prod-01',
      currentPath: 'C:/app',
      history: ['C:/app'],
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
    if (!activeTab) return;
    if (activeTab.searchRecursive && activeTab.searchQuery) {
      explorerService.getAllServerItems(activeTab.serverCode).then((items) => {
        setAllServerItems(items);
      });
    }
  }, [activeTab?.serverCode, activeTab?.searchRecursive, activeTab?.searchQuery]);

  // Displayed items: recursive descendants under currentPath or direct folder items
  const displayedItems = React.useMemo(() => {
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
    } catch (err: any) {
      message.error(err.message || String(err));
    } finally {
      setTreeLoading(false);
    }
  }, []);

  useEffect(() => {
    loadServersAndFolders();
  }, [loadServersAndFolders]);

  // Browse active tab directory
  const loadDirectory = useCallback(
    async (serverCode?: string, path?: string) => {
      const safeServerCode =
        serverCode ||
        activeTab?.serverCode ||
        (activeTab as any)?.serverId ||
        servers[0]?.serverCode ||
        'srv-prod-01';
      const safePath = path ?? activeTab?.currentPath ?? '';

      setLoading(true);
      try {
        const result = await explorerService.browse(safeServerCode, safePath);
        setBrowseResult(result);

        // Update tab title
        const srv = servers.find(
          (s) =>
            (s.serverCode || s.id || '').toLowerCase() ===
            (safeServerCode || '').toLowerCase()
        );
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
    [activeTabId, activeTab?.serverCode, activeTab?.currentPath, servers]
  );

  useEffect(() => {
    if (activeTab) {
      const code =
        activeTab.serverCode ||
        (activeTab as any).serverId ||
        servers[0]?.serverCode ||
        'srv-prod-01';
      loadDirectory(code, activeTab.currentPath);
    }
  }, [activeTabId, activeTab?.currentPath, activeTab?.serverCode, loadDirectory, servers]);

  // Handle Tab Switch
  const handleTabChange = (key: string) => {
    setActiveTabId(key);
  };

  // Handle Tab Add / Remove
  const handleTabEdit = (targetKey: any, action: 'add' | 'remove') => {
    if (action === 'add') {
      const newId = `tab-${Date.now()}`;
      const defaultServer = servers[0] || {
        serverCode: 'srv-prod-01',
        id: 'srv-prod-01',
        name: 'PROD-APP-01',
        rootPath: 'C:/app',
      };
      const rootPath = defaultServer.rootPath || 'C:/app';
      const code = defaultServer.serverCode || defaultServer.id || 'srv-prod-01';
      const newTab: ExplorerTab = {
        id: newId,
        title: `${defaultServer.name} (${rootPath})`,
        serverCode: code,
        currentPath: rootPath,
        history: [rootPath],
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
    } else if (action === 'remove') {
      if (tabs.length <= 1) return;
      const targetIndex = tabs.findIndex((tItem) => tItem.id === targetKey);
      const newTabs = tabs.filter((tItem) => tItem.id !== targetKey);
      setTabs(newTabs);
      if (activeTabId === targetKey) {
        const nextActive =
          newTabs[targetIndex] || newTabs[targetIndex - 1] || newTabs[0];
        setActiveTabId(nextActive.id);
      }
    }
  };

  // Navigate to path within active tab
  const handleNavigate = (path: string, pushHistory = true) => {
    if (!activeTab) return;
    const currentCode =
      activeTab.serverCode || (activeTab as any).serverId || '';
    const srv =
      servers.find(
        (s) =>
          (s.serverCode || s.id || '').toLowerCase() ===
          (currentCode || '').toLowerCase()
      ) || servers[0];

    const serverRoot = canonicalizePath(
      srv?.rootPath || '/'
    );

    let targetPath = canonicalizePath(path || serverRoot);

    // Path manipulation / Traversal prevention: Must strictly reside within serverRoot
    if (!isPathWithinRoot(serverRoot, targetPath)) {
      message.warning(t('pathManipulationForbidden'));
      targetPath = serverRoot;
    }

    setTabs((prev) =>
      prev.map((tItem) => {
        if (tItem.id !== activeTab.id) return tItem;
        let newHistory = [...tItem.history];
        let newIndex = tItem.historyIndex;
        if (pushHistory && targetPath !== tItem.currentPath) {
          newHistory = newHistory.slice(0, newIndex + 1);
          newHistory.push(targetPath);
          newIndex = newHistory.length - 1;
        }
        return {
          ...tItem,
          currentPath: targetPath,
          history: newHistory,
          historyIndex: newIndex,
          searchQuery: '',
          selectedIds: [],
        };
      })
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
              history: [...tItem.history.slice(0, tItem.historyIndex + 1), path],
              historyIndex: tItem.historyIndex + 1,
              searchQuery: '',
              selectedIds: [],
            }
          : tItem
      )
    );
  };

  // Search Query change in active tab
  const handleSearchChange = (query: string) => {
    setTabs((prev) =>
      prev.map((tItem) =>
        tItem.id === activeTabId ? { ...tItem, searchQuery: query } : tItem
      )
    );
  };

  // Filter Query (secondary in-results filter)
  const handleFilterChange = (query: string) => {
    setTabs((prev) =>
      prev.map((tItem) =>
        tItem.id === activeTabId ? { ...tItem, filterQuery: query } : tItem
      )
    );
  };

  // Search Recursive (subfolder search)
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
    <main
      id="app-main-viewport"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        background: '#ffffff',
        overflow: 'hidden',
      }}
    >
      {/* Header Bar */}
      <HeaderBar
        activeServer={activeServer}
        onRefresh={handleRefresh}
        onOpenTransactions={() => setTransactionsDrawerOpen(true)}
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
            basePath={browseResult?.currentPath || activeTab.currentPath}
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
        </div>
      </div>

      {/* Bottom Status Bar */}
      <StatusBar
        serverName={browseResult?.serverName || activeServer?.name || 'Server'}
        totalFolders={browseResult?.totalFolders || 0}
        totalFiles={browseResult?.totalFiles || 0}
        totalSize={browseResult?.totalSize || 0}
        selectedCount={activeTab.selectedIds.length}
        currentPath={browseResult?.currentPath || activeTab.currentPath}
      />

      {/* Modals */}
      <CreateModal
        open={createModalOpen}
        initialType={createModalType}
        currentPath={browseResult?.currentPath || activeTab.currentPath}
        onCancel={() => setCreateModalOpen(false)}
        onSubmit={handleCreateSubmit}
        confirmLoading={modalLoading}
      />

      <RenameModal
        open={renameModalOpen}
        item={itemToRename}
        onCancel={() => {
          setRenameModalOpen(false);
          setItemToRename(null);
        }}
        onSubmit={handleRenameSubmit}
        confirmLoading={modalLoading}
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
        activeServerCode={activeTab?.serverCode}
      />
    </main>
  );
}
