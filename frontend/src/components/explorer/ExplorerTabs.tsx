/**
 * [TR] Çoklu Sekme Bileşeni (ExplorerTabs): Tarayıcı ve dosya gezgini benzeri sekmeli gezinme çubuğu. Sekme ekleme, kapatma ve geçiş işlemlerini yönetir.
 * [EN] Multi-Tab Component (ExplorerTabs): Browser and file explorer style tabbed navigation bar. Manages tab creation, closing, and switching.
 */

'use client';

import React from 'react';
import { Tabs } from 'antd';
import { FolderOutlined } from '@ant-design/icons';
import { ExplorerTab } from '@/types/explorer';

interface ExplorerTabsProps {
  tabs: ExplorerTab[];
  activeKey: string;
  onChange: (key: string) => void;
  onEdit: (targetKey: any, action: 'add' | 'remove') => void;
}

export const ExplorerTabs: React.FC<ExplorerTabsProps> = ({
  tabs,
  activeKey,
  onChange,
  onEdit,
}) => {
  const items = tabs.map((tab) => ({
    key: tab.id,
    label: (
      <span
        id={`tab-item-label-${tab.id}`}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
      >
        <FolderOutlined style={{ color: '#1890ff' }} />
        <span
          id={`tab-item-title-${tab.id}`}
          style={{ fontWeight: tab.id === activeKey ? 600 : 400 }}
        >
          {tab.title}
        </span>
      </span>
    ),
    closable: tabs.length > 1,
  }));

  return (
    <nav
      id="explorer-tabs-wrapper"
      style={{
        background: '#fafafa',
        padding: '6px 12px 0 12px',
        borderBottom: '1px solid #e8e8e8',
      }}
    >
      <Tabs
        id="explorer-tabs-container"
        type="editable-card"
        size="small"
        activeKey={activeKey}
        onChange={onChange}
        onEdit={onEdit}
        items={items}
        style={{ marginBottom: -1 }}
      />
    </nav>
  );
};
