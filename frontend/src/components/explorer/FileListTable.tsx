/**
 * [TR] Dosya Listesi ve Tablosu (FileListTable): Aktif dizindeki dosya ve klasörleri liste veya kart (grid) modunda gösteren, çift tıklama ile dizine girme veya önizleme, silme ve adlandırma işlemlerini sağlayan ana bileşen.
 * [EN] File List and Table (FileListTable): Main component displaying files and folders in active directory via list or grid cards, supporting double-click navigation/preview, deletion, and renaming.
 */

'use client';

import React from 'react';
import {
  Table,
  Space,
  Button,
  Popconfirm,
  Tag,
  Tooltip,
  Empty,
  Card,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  FolderFilled,
  FileTextOutlined,
  FilePdfOutlined,
  FileZipOutlined,
  FileImageOutlined,
  FileExcelOutlined,
  FileWordOutlined,
  CodeOutlined,
  FileOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CopyOutlined,
  FolderAddOutlined,
  FileAddOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { ExplorerItem } from '@/types/explorer';
import { filterItems, SearchMode } from '@/utils/searchMatcher';
import { useI18n } from '@/i18n/LanguageContext';

interface FileListTableProps {
  items: ExplorerItem[];
  loading?: boolean;
  searchQuery?: string;
  filterQuery?: string;
  searchRecursive?: boolean;
  searchMode?: SearchMode;
  matchPath?: boolean;
  basePath?: string;
  viewMode: 'table' | 'grid';
  selectedIds: string[];
  onSelectIds: (ids: string[]) => void;
  onOpenFolder: (path: string) => void;
  onOpenFilePreview: (item: ExplorerItem) => void;
  onRenameItem: (item: ExplorerItem) => void;
  onDeleteItem: (item: ExplorerItem) => void;
  onOpenCreateFolder: () => void;
  onOpenCreateFile: () => void;
  onClearSearch?: () => void;
}

export function formatBytes(bytes: number, decimals = 1) {
  if (bytes === 0) return '-';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function getFileIcon(item: ExplorerItem, size = 18) {
  if (item.isFolder) {
    return <FolderFilled style={{ color: '#ffc53d', fontSize: size }} />;
  }

  const ext = (item.extension || '').toLowerCase();
  if (['pdf'].includes(ext)) {
    return <FilePdfOutlined style={{ color: '#ff4d4f', fontSize: size }} />;
  }
  if (['zip', 'rar', 'tar', 'gz', '7z'].includes(ext)) {
    return <FileZipOutlined style={{ color: '#fa8c16', fontSize: size }} />;
  }
  if (['png', 'jpg', 'jpeg', 'svg', 'gif', 'webp'].includes(ext)) {
    return <FileImageOutlined style={{ color: '#13c2c2', fontSize: size }} />;
  }
  if (['xlsx', 'xls', 'csv'].includes(ext)) {
    return <FileExcelOutlined style={{ color: '#52c41a', fontSize: size }} />;
  }
  if (['docx', 'doc'].includes(ext)) {
    return <FileWordOutlined style={{ color: '#2f54eb', fontSize: size }} />;
  }
  if (['js', 'ts', 'tsx', 'jsx', 'json', 'html', 'css', 'cs', 'xml', 'sql', 'sh', 'py'].includes(ext)) {
    return <CodeOutlined style={{ color: '#722ed1', fontSize: size }} />;
  }
  if (['txt', 'log', 'md'].includes(ext)) {
    return <FileTextOutlined style={{ color: '#595959', fontSize: size }} />;
  }

  return <FileOutlined style={{ color: '#8c8c8c', fontSize: size }} />;
}

export const FileListTable: React.FC<FileListTableProps> = ({
  items,
  loading = false,
  searchQuery = '',
  filterQuery = '',
  searchRecursive = false,
  searchMode = 'auto',
  matchPath = true,
  basePath = '',
  viewMode,
  selectedIds,
  onSelectIds,
  onOpenFolder,
  onOpenFilePreview,
  onRenameItem,
  onDeleteItem,
  onOpenCreateFolder,
  onOpenCreateFile,
  onClearSearch,
}) => {
  const { t, language } = useI18n();

  // Filter items using wildcard (*.*), regex, path search and secondary in-results filter
  const filteredItems = React.useMemo(() => {
    return filterItems(items, searchQuery, filterQuery, {
      mode: searchMode,
      matchPath,
      basePath,
    });
  }, [items, searchQuery, filterQuery, searchMode, matchPath, basePath]);

  const handleCopyPath = (item: ExplorerItem) => {
    navigator.clipboard.writeText(item.path);
    message.success(t('pathCopied'));
  };

  const columns: ColumnsType<ExplorerItem> = [
    {
      title: t('colName'),
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => {
        if (a.isFolder === b.isFolder) {
          return a.name.localeCompare(b.name, language, { sensitivity: 'base' });
        }
        return a.isFolder ? -1 : 1;
      },
      render: (_, record) => (
        <div
          id={`file-item-name-${record.id}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
            userSelect: 'none',
          }}
          onClick={() => {
            if (record.isFolder) {
              onOpenFolder(record.path);
            } else {
              onOpenFilePreview(record);
            }
          }}
        >
          {getFileIcon(record, 20)}
          <span
            style={{
              fontWeight: record.isFolder ? 600 : 400,
              color: record.isFolder ? '#1890ff' : '#262626',
            }}
          >
            {record.name}
          </span>
        </div>
      ),
    },
    {
      title: t('colType'),
      dataIndex: 'extension',
      key: 'extension',
      width: 140,
      render: (_, record) =>
        record.isFolder ? (
          <Tag id={`tag-folder-${record.id}`} color="orange">
            {t('tagFolder')}
          </Tag>
        ) : (
          <Tag id={`tag-file-${record.id}`} color="default" style={{ textTransform: 'uppercase' }}>
            {record.extension || t('tagFile')}
          </Tag>
        ),
    },
    ...(searchRecursive
      ? [
          {
            title: t('colPath'),
            dataIndex: 'path',
            key: 'path',
            ellipsis: true,
            render: (p: string) => (
              <span
                style={{ fontSize: 12, color: '#8c8c8c', fontFamily: 'monospace' }}
                title={p}
              >
                {p}
              </span>
            ),
          },
        ]
      : []),
    {
      title: t('colSize'),
      dataIndex: 'size',
      key: 'size',
      width: 120,
      sorter: (a, b) => (a.isFolder ? 0 : a.size) - (b.isFolder ? 0 : b.size),
      render: (size, record) => (record.isFolder ? '-' : formatBytes(size)),
    },
    {
      title: t('colModifiedAt'),
      dataIndex: 'modifiedAt',
      key: 'modifiedAt',
      width: 180,
      sorter: (a, b) =>
        new Date(a.modifiedAt).getTime() - new Date(b.modifiedAt).getTime(),
      render: (date) => new Date(date).toLocaleString(language === 'en' ? 'en-US' : 'tr-TR'),
    },
    {
      title: t('colActions'),
      key: 'actions',
      width: 160,
      align: 'right',
      render: (_, record) => (
        <Space size={4} onClick={(e) => e.stopPropagation()}>
          {!record.isFolder && (
            <Tooltip title={t('actionPreview')}>
              <Button
                id={`btn-preview-${record.id}`}
                type="text"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => onOpenFilePreview(record)}
              />
            </Tooltip>
          )}

          <Tooltip title={t('actionCopyPath')}>
            <Button
              id={`btn-copy-path-${record.id}`}
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => handleCopyPath(record)}
            />
          </Tooltip>

          <Tooltip title={t('actionRename')}>
            <Button
              id={`btn-rename-${record.id}`}
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => onRenameItem(record)}
            />
          </Tooltip>

          <Popconfirm
            id={`popconfirm-delete-${record.id}`}
            title={t('deleteConfirmTitle')}
            description={
              record.isFolder
                ? `"${record.name}" ${t('deleteConfirmFolderDesc')}`
                : `"${record.name}" ${t('deleteConfirmFileDesc')}`
            }
            onConfirm={() => onDeleteItem(record)}
            okText={t('yesDelete')}
            cancelText={t('cancel')}
            okButtonProps={{ danger: true }}
          >
            <Tooltip title={t('actionDelete')}>
              <Button
                id={`btn-delete-${record.id}`}
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const searchActiveBanner = (searchQuery || filterQuery) && (
    <div
      id="search-active-banner"
      style={{
        padding: '8px 16px',
        background: '#e6f7ff',
        borderBottom: '1px solid #91d5ff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 8,
      }}
    >
      <Space size={8} wrap>
        <SearchOutlined style={{ color: '#1890ff' }} />
        {searchQuery && (
          <span>
            <strong>{t('searchActiveBanner')}:</strong> "{searchQuery}"
          </span>
        )}
        {filterQuery && (
          <Tag color="purple">
            {t('filterInResultsPlaceholder')}: "{filterQuery}"
          </Tag>
        )}
        {searchRecursive && (
          <Tag color="cyan">{t('searchIncludeSubfolders')}</Tag>
        )}
        <Tag color="blue">
          {filteredItems.length} {t('searchResultsCount')}
        </Tag>
      </Space>
      {onClearSearch && (
        <Button size="small" type="link" onClick={onClearSearch}>
          {t('clearSearch')}
        </Button>
      )}
    </div>
  );

  if (viewMode === 'grid') {
    return (
      <div id="file-grid-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        {searchActiveBanner}
        <div style={{ flex: 1, padding: 16, overflowY: 'auto' }}>
        {filteredItems.length === 0 ? (
          <div id="file-grid-empty">
            <Empty
            description={
              searchQuery
                ? t('emptySearchMatch')
                : t('emptyFolder')
            }
            style={{ marginTop: 60 }}
          >
            {!searchQuery && (
              <Space>
                <Button
                  id="btn-grid-empty-new-folder"
                  icon={<FolderAddOutlined />}
                  onClick={onOpenCreateFolder}
                >
                  {t('newFolder')}
                </Button>
                <Button
                  id="btn-grid-empty-new-file"
                  type="primary"
                  icon={<FileAddOutlined />}
                  onClick={onOpenCreateFile}
                >
                  {t('newFile')}
                </Button>
              </Space>
            )}
          </Empty>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
              gap: 12,
            }}
          >
            {filteredItems.map((item) => (
              <Card
                key={item.id}
                id={`file-card-${item.id}`}
                hoverable
                size="small"
                style={{
                  textAlign: 'center',
                  borderRadius: 8,
                  borderColor: selectedIds.includes(item.id) ? '#1890ff' : '#f0f0f0',
                  background: selectedIds.includes(item.id) ? '#e6f7ff' : '#ffffff',
                }}
                bodyStyle={{ padding: 12 }}
                onClick={() => {
                  if (item.isFolder) {
                    onOpenFolder(item.path);
                  } else {
                    onOpenFilePreview(item);
                  }
                }}
              >
                <div style={{ padding: '8px 0' }}>{getFileIcon(item, 40)}</div>
                <div
                  id={`file-card-name-${item.id}`}
                  style={{
                    fontWeight: item.isFolder ? 600 : 400,
                    fontSize: 13,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    marginTop: 4,
                  }}
                  title={item.name}
                >
                  {item.name}
                </div>
                <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 2 }}>
                  {item.isFolder ? t('tagFolder') : formatBytes(item.size)}
                </div>

                <div
                  style={{
                    marginTop: 8,
                    paddingTop: 6,
                    borderTop: '1px solid #f5f5f5',
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Tooltip title={t('actionRename')}>
                    <Button
                      id={`btn-card-rename-${item.id}`}
                      type="text"
                      size="small"
                      icon={<EditOutlined style={{ color: '#fa8c16' }} />}
                      onClick={() => onRenameItem(item)}
                    />
                  </Tooltip>
                  <Popconfirm
                    id={`popconfirm-card-delete-${item.id}`}
                    title={t('deleteConfirmTitle')}
                    onConfirm={() => onDeleteItem(item)}
                    okText={t('yes')}
                    cancelText={t('cancel')}
                    okButtonProps={{ danger: true }}
                  >
                    <Button
                      id={`btn-card-delete-${item.id}`}
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                    />
                  </Popconfirm>
                </div>
              </Card>
            ))}
          </div>
        )}
        </div>
      </div>
    );
  }

  return (
    <div id="file-list-main-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      {searchActiveBanner}
      <Table<ExplorerItem>
        id="file-table"
        rowKey="id"
        size="middle"
        loading={loading}
        columns={columns}
        dataSource={filteredItems}
        pagination={false}
        rowSelection={{
          selectedRowKeys: selectedIds,
          onChange: (keys) => onSelectIds(keys as string[]),
        }}
        onRow={(record) => ({
          id: `file-row-${record.id}`,
          onDoubleClick: () => {
            if (record.isFolder) {
              onOpenFolder(record.path);
            } else {
              onOpenFilePreview(record);
            }
          },
        })}
        locale={{
          emptyText: (
            <div id="file-table-empty">
              <Empty
                description={
                  searchQuery
                    ? t('emptySearchMatch')
                    : t('emptyFolder')
                }
                style={{ margin: '40px 0' }}
              >
                {!searchQuery && (
                  <Space>
                    <Button
                      id="btn-empty-create-folder"
                      icon={<FolderAddOutlined />}
                      onClick={onOpenCreateFolder}
                    >
                      {t('newFolder')}
                    </Button>
                    <Button
                      id="btn-empty-create-file"
                      type="primary"
                      icon={<FileAddOutlined />}
                      onClick={onOpenCreateFile}
                    >
                      {t('newFile')}
                    </Button>
                  </Space>
                )}
              </Empty>
            </div>
          ),
        }}
      />
    </div>
  );
};
