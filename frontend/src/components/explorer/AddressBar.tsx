/**
 * [TR] Adres Çubuğu Bileşeni (AddressBar): Klasör yolu gezinimi (tıklanabilir breadcrumb veya elle düzenleme), geçmiş kontrolleri (Geri/İleri/Üst), anlık arama, görünüm modu seçici ve CRUD eylem butonlarını içerir.
 * [EN] Address Bar Component (AddressBar): Contains directory navigation (clickable breadcrumbs or manual path editing), history controls (Back/Forward/Up), instant search, view mode toggle, and CRUD action buttons.
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Space,
  Button,
  Input,
  Breadcrumb,
  Tooltip,
  Radio,
  Popover,
  Switch,
  Tag,
} from 'antd';
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  ArrowUpOutlined,
  ReloadOutlined,
  FolderAddOutlined,
  FileAddOutlined,
  AppstoreOutlined,
  BarsOutlined,
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
  SearchOutlined,
  HomeOutlined,
  UploadOutlined,
  FilterOutlined,
  ControlOutlined,
} from '@ant-design/icons';
import { BreadcrumbItem } from '@/types/explorer';
import { SearchMode } from '@/utils/searchMatcher';
import { useI18n } from '@/i18n/LanguageContext';

interface AddressBarProps {
  currentPath: string;
  breadcrumbs: BreadcrumbItem[];
  canGoBack: boolean;
  canGoForward: boolean;
  canGoUp: boolean;
  searchQuery: string;
  filterQuery?: string;
  searchRecursive?: boolean;
  searchMode?: SearchMode;
  matchPath?: boolean;
  viewMode: 'table' | 'grid';
  onGoBack: () => void;
  onGoForward: () => void;
  onGoUp: () => void;
  onRefresh: () => void;
  onNavigate: (path: string) => void;
  onSearchChange: (query: string) => void;
  onFilterChange: (query: string) => void;
  onSearchRecursiveChange: (recursive: boolean) => void;
  onSearchModeChange: (mode: SearchMode) => void;
  onMatchPathChange: (matchPath: boolean) => void;
  onViewModeChange: (mode: 'table' | 'grid') => void;
  onOpenCreateFolder: () => void;
  onOpenCreateFile: () => void;
  onOpenUpload: () => void;
}

export const AddressBar: React.FC<AddressBarProps> = ({
  currentPath,
  breadcrumbs,
  canGoBack,
  canGoForward,
  canGoUp,
  searchQuery,
  filterQuery = '',
  searchRecursive = false,
  searchMode = 'auto',
  matchPath = true,
  viewMode,
  onGoBack,
  onGoForward,
  onGoUp,
  onRefresh,
  onNavigate,
  onSearchChange,
  onFilterChange,
  onSearchRecursiveChange,
  onSearchModeChange,
  onMatchPathChange,
  onViewModeChange,
  onOpenCreateFolder,
  onOpenCreateFile,
  onOpenUpload,
}) => {
  const { t } = useI18n();
  const [isEditingPath, setIsEditingPath] = useState(false);
  const [typedPath, setTypedPath] = useState(currentPath);

  useEffect(() => {
    setTypedPath(currentPath);
    setIsEditingPath(false);
  }, [currentPath]);

  const handlePathSubmit = () => {
    if (typedPath.trim()) {
      onNavigate(typedPath.trim());
      setIsEditingPath(false);
    }
  };

  return (
    <div
      id="address-bar-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: '10px 16px',
        background: '#ffffff',
        borderBottom: '1px solid #e8e8e8',
      }}
    >
      {/* Row 1: Navigation + Address Bar + Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
        {/* Navigation Buttons */}
        <Space size={4}>
          <Tooltip title={t('navBack')}>
            <Button
              id="nav-btn-back"
              size="middle"
              icon={<ArrowLeftOutlined />}
              disabled={!canGoBack}
              onClick={onGoBack}
            />
          </Tooltip>
          <Tooltip title={t('navForward')}>
            <Button
              id="nav-btn-forward"
              size="middle"
              icon={<ArrowRightOutlined />}
              disabled={!canGoForward}
              onClick={onGoForward}
            />
          </Tooltip>
          <Tooltip title={t('navUp')}>
            <Button
              id="nav-btn-up"
              size="middle"
              icon={<ArrowUpOutlined />}
              disabled={!canGoUp}
              onClick={onGoUp}
            />
          </Tooltip>
          <Tooltip title={t('navRefresh')}>
            <Button
              id="nav-btn-refresh"
              size="middle"
              icon={<ReloadOutlined />}
              onClick={onRefresh}
            />
          </Tooltip>
        </Space>

        {/* Address Path Bar */}
        <div
          id="address-path-wrapper"
          style={{
            flex: 1,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            background: '#fafafa',
            border: '1px solid #d9d9d9',
            borderRadius: 6,
            height: 36,
            padding: '0 8px',
            overflow: 'hidden',
          }}
        >
          {isEditingPath ? (
            <div style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
              <Input
                id="address-path-input"
                size="small"
                variant="borderless"
                value={typedPath}
                onChange={(e) => setTypedPath(e.target.value)}
                onPressEnter={handlePathSubmit}
                autoFocus
                placeholder={t('editPathPrompt')}
                style={{ flex: 1, padding: 0 }}
              />
              <Button
                id="btn-confirm-path"
                type="text"
                size="small"
                icon={<CheckOutlined style={{ color: '#52c41a' }} />}
                onClick={handlePathSubmit}
              />
              <Button
                id="btn-cancel-path"
                type="text"
                size="small"
                icon={<CloseOutlined />}
                onClick={() => {
                  setTypedPath(currentPath);
                  setIsEditingPath(false);
                }}
              />
            </div>
          ) : (
            <div
              id="address-breadcrumb-container"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                cursor: 'pointer',
              }}
              onClick={() => setIsEditingPath(true)}
            >
              <div style={{ display: 'flex', alignItems: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <HomeOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                <Breadcrumb
                  items={breadcrumbs.map((b, idx) => ({
                    title: (
                      <span
                        key={b.path}
                        id={`breadcrumb-item-${idx}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigate(b.path);
                        }}
                        style={{
                          cursor: 'pointer',
                          fontWeight: idx === breadcrumbs.length - 1 ? 600 : 400,
                          color: idx === breadcrumbs.length - 1 ? '#000' : '#1890ff',
                        }}
                      >
                        {b.name}
                      </span>
                    ),
                  }))}
                />
              </div>
              <Tooltip title={t('editPathTooltip')}>
                <Button
                  id="btn-edit-path"
                  type="text"
                  size="small"
                  icon={<EditOutlined style={{ color: '#8c8c8c' }} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditingPath(true);
                  }}
                />
              </Tooltip>
            </div>
          )}
        </div>

        {/* Advanced Search Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Input
            id="input-search-folder"
            prefix={<SearchOutlined style={{ color: searchQuery ? '#1890ff' : '#bfbfbf' }} />}
            placeholder={t('searchInFolderPlaceholder')}
            allowClear
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{ width: 270, height: 36 }}
            suffix={
              <Popover
                trigger="click"
                placement="bottomRight"
                title={
                  <span style={{ fontSize: 13, fontWeight: 600 }}>
                    {t('searchOptionsTooltip')}
                  </span>
                }
                content={
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 270, paddingTop: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12 }}>{t('searchIncludeSubfolders')}</span>
                      <Switch
                        id="switch-search-recursive"
                        size="small"
                        checked={searchRecursive}
                        onChange={onSearchRecursiveChange}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12 }}>{t('searchMatchPath')}</span>
                      <Switch
                        id="switch-search-match-path"
                        size="small"
                        checked={matchPath}
                        onChange={onMatchPathChange}
                      />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>
                        Arama Modu / Mode:
                      </div>
                      <Radio.Group
                        size="small"
                        value={searchMode}
                        onChange={(e) => onSearchModeChange(e.target.value)}
                      >
                        <Space direction="vertical" size={2}>
                          <Radio value="auto">{t('searchModeAuto')}</Radio>
                          <Radio value="wildcard">{t('searchModeWildcard')}</Radio>
                          <Radio value="regex">{t('searchModeRegex')}</Radio>
                          <Radio value="text">{t('searchModeText')}</Radio>
                        </Space>
                      </Radio.Group>
                    </div>
                    <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 8 }}>
                      <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 6 }}>
                        Hızlı Örnekler / Presets:
                      </div>
                      <Space size={[4, 6]} wrap>
                        {['*.*', '*.cs', '*.json', '*.log', '*.txt', '*.png'].map((preset) => (
                          <Tag
                            key={preset}
                            style={{ cursor: 'pointer', margin: 0, fontSize: 11 }}
                            color={searchQuery === preset ? 'blue' : 'default'}
                            onClick={() => onSearchChange(preset)}
                          >
                            {preset}
                          </Tag>
                        ))}
                      </Space>
                    </div>
                  </div>
                }
              >
                <Tooltip title={t('searchOptionsTooltip')}>
                  <Button
                    id="btn-search-options"
                    type="text"
                    size="small"
                    icon={
                      <ControlOutlined
                        style={{
                          color: searchRecursive || searchMode !== 'auto' ? '#1890ff' : '#8c8c8c',
                          fontSize: 14,
                        }}
                      />
                    }
                  />
                </Tooltip>
              </Popover>
            }
          />
        </div>
      </div>

      {/* Row 2: Quick Actions (New Folder, New File, Upload, View Mode & Secondary Filter) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 2,
        }}
      >
        <Space size={8}>
          <Button
            id="btn-new-folder"
            type="primary"
            icon={<FolderAddOutlined />}
            onClick={onOpenCreateFolder}
            style={{ background: '#52c41a', borderColor: '#52c41a' }}
          >
            {t('newFolder')}
          </Button>
          <Button
            id="btn-new-file"
            type="primary"
            icon={<FileAddOutlined />}
            onClick={onOpenCreateFile}
          >
            {t('newFile')}
          </Button>
          <Button
            id="btn-upload-file"
            icon={<UploadOutlined />}
            onClick={onOpenUpload}
          >
            {t('uploadFile')}
          </Button>
        </Space>

        <Space size={12}>
          {/* Secondary Filter: Gelen Listede Ara */}
          <Input
            id="input-filter-in-results"
            prefix={<FilterOutlined style={{ color: filterQuery ? '#1890ff' : '#bfbfbf', fontSize: 12 }} />}
            placeholder={t('filterInResultsPlaceholder')}
            allowClear
            size="middle"
            value={filterQuery}
            onChange={(e) => onFilterChange(e.target.value)}
            style={{ width: 210, height: 32 }}
          />

          <Radio.Group
            id="radiogroup-view-mode"
            value={viewMode}
            onChange={(e) => onViewModeChange(e.target.value)}
            size="small"
            buttonStyle="solid"
          >
            <Radio.Button id="radio-view-table" value="table">
              <BarsOutlined style={{ marginRight: 4 }} />
              {t('viewTable')}
            </Radio.Button>
            <Radio.Button id="radio-view-grid" value="grid">
              <AppstoreOutlined style={{ marginRight: 4 }} />
              {t('viewGrid')}
            </Radio.Button>
          </Radio.Group>
        </Space>
      </div>
    </div>
  );
};
