/**
 * [TR] Durum Çubuğu Bileşeni (StatusBar): Sayfa altında toplam dosya/klasör sayısı, toplam boyut, seçili öğe adedi ve aktif sunucu durumunu gösterir.
 * [EN] Status Bar Component (StatusBar): Displays total folder/file count, total size, selected item count, and active server status at the bottom of the page.
 */

'use client';

import React from 'react';
import { Space, Typography, Tag } from 'antd';
import { CloudServerOutlined, CheckCircleFilled } from '@ant-design/icons';
import { formatBytes } from './FileListTable';
import { useI18n } from '@/i18n/LanguageContext';

const { Text } = Typography;

interface StatusBarProps {
  serverName: string;
  totalFolders: number;
  totalFiles: number;
  totalSize: number;
  selectedCount: number;
  currentPath: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  serverName,
  totalFolders,
  totalFiles,
  totalSize,
  selectedCount,
}) => {
  const { t } = useI18n();

  return (
    <footer
      id="status-bar-container"
      style={{
        height: 30,
        background: '#f5f5f5',
        borderTop: '1px solid #e8e8e8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        fontSize: 12,
        color: '#595959',
      }}
    >
      <Space size={16}>
        <span id="status-counts">
          <strong id="status-folders-count" style={{ color: '#262626' }}>
            {totalFolders}
          </strong>{' '}
          {t('statusFolders')},{' '}
          <strong id="status-files-count" style={{ color: '#262626' }}>
            {totalFiles}
          </strong>{' '}
          {t('statusFiles')}
        </span>
        <span id="status-size-wrapper">
          {t('statusTotalSize')}{' '}
          <strong id="status-total-size" style={{ color: '#262626' }}>
            {formatBytes(totalSize)}
          </strong>
        </span>
        {selectedCount > 0 && (
          <Tag id="status-selected-badge" color="blue" style={{ margin: 0, fontSize: 11 }}>
            {selectedCount} {t('statusSelected')}
          </Tag>
        )}
      </Space>

      <Space size={12}>
        <span
          id="status-server-name-wrapper"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <CloudServerOutlined />
          <span id="status-server-name">{serverName}</span>
        </span>
        <span
          id="status-indicator"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#52c41a' }}
        >
          <CheckCircleFilled />
          <span>{t('statusReady')}</span>
        </span>
      </Space>
    </footer>
  );
};
