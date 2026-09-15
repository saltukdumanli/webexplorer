/**
 * [TR] Ana Sayfa (FileExplorerPage): ExplorerView bileşenini doğrudan render eder ve herhangi bir sayfadan modal olarak nasıl çağrılabileceğini gösteren tam ekran modal tetikleyici butonlarını barındırır.
 * [EN] Main Page (FileExplorerPage): Directly renders the ExplorerView component and provides fullscreen modal trigger buttons demonstrating how to call ExplorerModal from any page.
 */

'use client';

import React, { useState } from 'react';
import { Space, Button, Typography, Tag } from 'antd';
import { FullscreenOutlined, CloudServerOutlined } from '@ant-design/icons';
import { ExplorerView, ExplorerModal } from '@/components/explorer';
import { useI18n } from '@/i18n/LanguageContext';

const { Text } = Typography;

export default function FileExplorerPage() {
  const { t } = useI18n();

  // Fullscreen Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [targetServerCode, setTargetServerCode] = useState<string>('srv-prod-01');

  const handleOpenModal = (serverCode: string) => {
    setTargetServerCode(serverCode);
    setModalOpen(true);
  };

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
      {/* Quick Test / Showcase Bar for Fullscreen Modal Integration */}
      <div
        id="modal-integration-demo-bar"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 16px',
          background: '#001529',
          color: '#ffffff',
          fontSize: 12,
          borderBottom: '1px solid #002140',
          zIndex: 10,
        }}
      >
        <Space size={8} align="center">
          <Tag color="cyan" style={{ margin: 0, fontWeight: 600 }}>
            {t('openModalDemo')}
          </Tag>
          <Text style={{ color: '#8c8c8c', fontSize: 11 }}>
            {t('openModalFor')}
          </Text>
        </Space>

        <Space size={8}>
          <Button
            id="btn-open-modal-prod-app"
            size="small"
            type="primary"
            ghost
            icon={<FullscreenOutlined />}
            onClick={() => handleOpenModal('srv-prod-01')}
          >
            PROD-APP-01 (srv-prod-01)
          </Button>

          <Button
            id="btn-open-modal-prod-db"
            size="small"
            type="primary"
            ghost
            icon={<FullscreenOutlined />}
            onClick={() => handleOpenModal('srv-db-01')}
          >
            PROD-DB-01 (srv-db-01)
          </Button>

          <Button
            id="btn-open-modal-stage"
            size="small"
            type="primary"
            ghost
            icon={<FullscreenOutlined />}
            onClick={() => handleOpenModal('srv-dev-01')}
          >
            DEV-STAGE-01 (srv-dev-01)
          </Button>
        </Space>
      </div>

      {/* Main Standalone View */}
      <div style={{ flex: 1, overflow: 'hidden', height: 'calc(100vh - 36px)' }}>
        <ExplorerView height="100%" defaultServerCode="srv-prod-01" />
      </div>

      {/* Fullscreen Explorer Modal Component (Embeddable anywhere in any page) */}
      <ExplorerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultServerCode={targetServerCode}
      />
    </main>
  );
}
