/**
 * [TR] Ana Sayfa (FileExplorerPage): ExplorerView bileşenini doğrudan render eder ve herhangi bir sayfadan modal olarak nasıl çağrılabileceğini gösteren tam ekran modal tetikleyici butonlarını barındırır.
 * [EN] Main Page (FileExplorerPage): Directly renders the ExplorerView component and provides fullscreen modal trigger buttons demonstrating how to call ExplorerModal from any page.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Space, Button, Typography, Tag } from 'antd';
import { FullscreenOutlined, CloudServerOutlined } from '@ant-design/icons';
import { ExplorerView, ExplorerModal } from '@/components/explorer';
import { explorerService } from '@/services/explorerService';
import { ServerNode } from '@/types/explorer';
import { useI18n } from '@/i18n/LanguageContext';

const { Text } = Typography;

export default function FileExplorerPage() {
  const { t } = useI18n();

  // Servers for demo buttons
  const [demoServers, setDemoServers] = useState<ServerNode[]>([]);

  // Fullscreen Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [targetServerCode, setTargetServerCode] = useState<string>('srv-prod-01');

  useEffect(() => {
    explorerService
      .getServers()
      .then((list: ServerNode[]) => setDemoServers(list))
      .catch(() => {});
  }, []);

  const handleOpenModal = (serverCode: string) => {
    setTargetServerCode(serverCode);
    setModalOpen(true);
  };

  const buttonServers =
    demoServers.length > 0
      ? demoServers
      : [
          { serverCode: 'srv-prod-01', name: 'PROD-APP-01' },
          { serverCode: 'srv-db-01', name: 'PROD-DB-01' },
          { serverCode: 'srv-dev-01', name: 'DEV-STAGE-01' },
          { serverCode: 'srv-storage-02', name: 'STORAGE-NAS-02' },
        ];

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
          flexWrap: 'wrap',
          gap: 8,
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

        <Space size={8} wrap>
          {buttonServers.map((s) => (
            <Button
              key={s.serverCode}
              id={`btn-open-modal-${s.serverCode}`}
              size="small"
              type="primary"
              ghost
              icon={<FullscreenOutlined />}
              onClick={() => handleOpenModal(s.serverCode)}
            >
              {s.name} ({s.serverCode})
            </Button>
          ))}
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
