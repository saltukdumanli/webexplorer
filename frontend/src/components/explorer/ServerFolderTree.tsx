/**
 * [TR] Sunucu Seçim Paneli (ServerFolderTree): Sol panelde mevcut sunucuları listeleyen, sunucu bazında arama yapabilen ve kök sürücülere doğrudan geçiş sağlayan bileşen.
 * [EN] Server Selection Panel (ServerFolderTree): Left panel component that lists available servers, allows searching by server attributes, and enables direct navigation to root drives.
 */

'use client';

import React, { useState, useMemo } from 'react';
import { Typography, Empty, Spin, Badge, Input, Button } from 'antd';
import {
  CloudServerOutlined,
  CheckCircleFilled,
  HddOutlined,
  SearchOutlined,
  ClearOutlined,
} from '@ant-design/icons';
import { ServerNode } from '@/types/explorer';
import { useI18n } from '@/i18n/LanguageContext';

const { Text } = Typography;

interface ServerFolderTreeProps {
  servers: ServerNode[];
  activeServerCode: string;
  currentPath: string;
  allFolders?: any[];
  loading?: boolean;
  onSelectNode: (serverCode: string, path: string) => void;
}

export const ServerFolderTree: React.FC<ServerFolderTreeProps> = ({
  servers,
  activeServerCode,
  currentPath,
  loading = false,
  onSelectNode,
}) => {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter servers by name, host, or rootPath
  const filteredServers = useMemo(() => {
    if (!searchQuery.trim()) return servers;
    const q = searchQuery.toLowerCase().trim();

    return servers.filter((server) => {
      const matchName = (server.name || '').toLowerCase().includes(q);
      const matchHost = (server.host || '').toLowerCase().includes(q);
      const root = server.rootPath || '';
      const matchRoot = root.toLowerCase().includes(q);
      return matchName || matchHost || matchRoot;
    });
  }, [servers, searchQuery]);

  return (
    <aside
      id="server-panel-container"
      style={{
        width: 280,
        height: '100%',
        background: '#ffffff',
        borderRight: '1px solid #e8e8e8',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Sidebar Header */}
      <div
        id="server-panel-header"
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #f0f0f0',
          background: '#fafafa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text
          id="server-panel-title"
          strong
          style={{
            fontSize: 13,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            color: '#595959',
          }}
        >
          {t('serverSelection')}
        </Text>
        <Badge
          id="server-count-badge"
          count={filteredServers.length}
          overflowCount={99}
          style={{ backgroundColor: '#1890ff' }}
        />
      </div>

      {/* Server Search Input */}
      <div
        id="server-search-container"
        style={{
          padding: '10px 12px',
          borderBottom: '1px solid #f0f0f0',
          background: '#ffffff',
        }}
      >
        <Input
          id="input-search-servers"
          size="middle"
          placeholder={t('serverSearchPlaceholder')}
          prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
          allowClear
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ borderRadius: 6 }}
        />
      </div>

      {/* Server List */}
      <div
        id="server-list-container"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin tip={t('refresh')} />
          </div>
        ) : filteredServers.length === 0 ? (
          <div id="server-list-empty">
            <Empty
              description={
                searchQuery
                  ? t('serverNotFound')
                  : t('noRegisteredServers')
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              style={{ margin: '40px 0' }}
            >
              {searchQuery && (
                <Button
                  id="btn-clear-server-search"
                  size="small"
                  icon={<ClearOutlined />}
                  onClick={() => setSearchQuery('')}
                >
                  {t('clearSearch')}
                </Button>
              )}
            </Empty>
          </div>
        ) : (
          filteredServers.map((server) => {
            const code = server.serverCode || server.id || '';
            const isActive = code.toLowerCase() === (activeServerCode || '').toLowerCase();

            return (
              <div
                key={code}
                id={`server-card-${code}`}
                onClick={() => {
                  const defaultPath = server.rootPath || '/';
                  onSelectNode(code, defaultPath);
                }}
                style={{
                  padding: '12px 14px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  border: isActive
                    ? '1.5px solid #1890ff'
                    : '1px solid #e8e8e8',
                  background: isActive ? '#e6f7ff' : '#ffffff',
                  boxShadow: isActive
                    ? '0 2px 6px rgba(24, 144, 255, 0.12)'
                    : 'none',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                }}
              >
                {/* Header: Icon + Name + Host */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 6,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: isActive ? '#1890ff' : '#f0f0f0',
                        color: isActive ? '#ffffff' : '#595959',
                        fontSize: 16,
                      }}
                    >
                      <CloudServerOutlined />
                    </div>
                    <div>
                      <div
                        id={`server-name-${server.id}`}
                        style={{
                          fontWeight: 600,
                          fontSize: 14,
                          color: isActive ? '#096dd9' : '#262626',
                          lineHeight: 1.2,
                        }}
                      >
                        {server.name}
                      </div>
                      <div
                        id={`server-host-${server.id}`}
                        style={{
                          fontSize: 11,
                          color: '#8c8c8c',
                          fontFamily: 'monospace',
                        }}
                      >
                        {server.host}
                      </div>
                    </div>
                  </div>

                  {isActive && (
                    <CheckCircleFilled
                      id={`server-active-icon-${server.id}`}
                      style={{ color: '#1890ff', fontSize: 16 }}
                    />
                  )}
                </div>

                {/* Root Path */}
                <div
                  style={{
                    paddingTop: 8,
                    borderTop: '1px dashed #d9d9d9',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    flexWrap: 'wrap',
                  }}
                >
                  <Text type="secondary" style={{ fontSize: 11, marginRight: 2 }}>
                    {t('rootPrefix')}
                  </Text>
                  {(() => {
                    const rp = server.rootPath || '/';
                    const isCurrentRoot =
                      isActive &&
                      (currentPath === rp ||
                        currentPath.startsWith(rp.replace(/\/+$/, '')));

                    return (
                      <span
                        key={rp}
                        id={`server-root-${code}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectNode(code, rp);
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 11,
                          padding: '1px 6px',
                          borderRadius: 4,
                          background: isCurrentRoot ? '#bae7ff' : '#f5f5f5',
                          color: isCurrentRoot ? '#0050b3' : '#595959',
                          fontWeight: isCurrentRoot ? 600 : 400,
                          cursor: 'pointer',
                          border: isCurrentRoot
                            ? '1px solid #91d5ff'
                            : '1px solid #e8e8e8',
                        }}
                        title={`${rp} ${t('goToDirectory')}`}
                      >
                        <HddOutlined style={{ fontSize: 10 }} />
                        <span>{rp}</span>
                      </span>
                    );
                  })()}
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
