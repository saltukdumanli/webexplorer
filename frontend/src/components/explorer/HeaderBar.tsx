/**
 * [TR] Üst Başlık Çubuğu (HeaderBar): Logo, uygulama başlığı, aktif sunucu bilgisi, servis modu seçimi (Mock/API), dil seçici (TR/EN), işlem geçmişi ve yenileme kontrollerini barındırır.
 * [EN] Header Bar (HeaderBar): Contains logo, application title, active server info, service mode selector (Mock/API), language switcher (TR/EN), transaction history, and refresh controls.
 */

'use client';

import React from 'react';
import { Space, Typography, Tag, Segmented, Button, Tooltip } from 'antd';
import {
  FolderOpenOutlined,
  CloudServerOutlined,
  ReloadOutlined,
  HistoryOutlined,
  TranslationOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { ServerNode } from '@/types/explorer';
import { useI18n } from '@/i18n/LanguageContext';

const { Title, Text } = Typography;

export interface HeaderBarProps {
  activeServer?: ServerNode;
  onRefresh: () => void;
  onOpenTransactions: () => void;
  onClose?: () => void;
  showCloseButton?: boolean;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  activeServer,
  onRefresh,
  onOpenTransactions,
  onClose,
  showCloseButton = false,
}) => {
  const { language, setLanguage, t } = useI18n();


  return (
    <header
      id="header-bar-container"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 20px',
        background: '#ffffff',
        borderBottom: '1px solid #e8e8e8',
        boxShadow: '0 1px 4px rgba(0,21,41,0.05)',
      }}
    >
      {/* Left: Brand / Title */}
      <Space orientation="horizontal" size={12} align="center">
        <div
          id="header-logo"
          style={{
            width: 38,
            height: 38,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 20,
            boxShadow: '0 2px 8px rgba(24, 144, 255, 0.35)',
          }}
        >
          <FolderOpenOutlined />
        </div>
        <div>
          <Title id="header-title" level={4} style={{ margin: 0, lineHeight: 1.2, fontWeight: 700 }}>
            {t('appTitle')}
          </Title>
          <Text id="header-subtitle" type="secondary" style={{ fontSize: 12 }}>
            {t('appSubtitle')}
          </Text>
        </div>

        {activeServer && (
          <Space size={6} style={{ marginLeft: 16 }}>
            <Tag
              id="header-active-server-badge"
              icon={<CloudServerOutlined />}
              color="blue"
              style={{ padding: '2px 8px', fontSize: 12, borderRadius: 4 }}
            >
              {activeServer.name} ({activeServer.host})
            </Tag>
          </Space>
        )}
      </Space>

      {/* Right: Language Switcher + Mode Switch & Actions */}
      <Space orientation="horizontal" size={12}>
        {/* Language Switcher */}
        <div
          id="header-language-container"
          style={{
            display: 'flex',
            alignItems: 'center',
            background: '#f5f5f5',
            padding: '3px 6px',
            borderRadius: 6,
            border: '1px solid #d9d9d9',
          }}
        >
          <TranslationOutlined style={{ marginRight: 6, color: '#595959', fontSize: 13 }} />
          <Segmented
            id="select-language-toggle"
            size="small"
            value={language}
            onChange={(val) => setLanguage(val as 'tr' | 'en')}
            options={[
              { label: 'TR', value: 'tr' },
              { label: 'EN', value: 'en' },
            ]}
          />
        </div>

        <Button
          id="btn-header-transactions"
          icon={<HistoryOutlined />}
          onClick={onOpenTransactions}
          style={{ borderColor: '#1890ff', color: '#1890ff' }}
        >
          {t('transactionsHistory')}
        </Button>

        <Tooltip title={t('refresh')}>
          <Button id="btn-header-refresh" icon={<ReloadOutlined />} onClick={onRefresh}>
            {t('refresh')}
          </Button>
        </Tooltip>

        {showCloseButton && onClose && (
          <Button
            id="btn-header-close-modal"
            type="primary"
            danger
            icon={<CloseOutlined />}
            onClick={onClose}
          >
            {t('closeBtn')}
          </Button>
        )}
      </Space>
    </header>
  );
};
