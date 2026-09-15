/**
 * [TR] İşlem Geçmişi Çekmecesi (TransactionsDrawer): Backend veya mock ortamında gerçekleştirilen dosya manipülasyon işlemlerini (ekleme, silme, adlandırma, yükleme) listeleyen ve filtreleme imkanı sunan denetim (audit) paneli.
 * [EN] Transaction History Drawer (TransactionsDrawer): Audit panel listing and filtering file manipulation transactions (create, delete, rename, upload) performed in backend or mock environment.
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Table,
  Tag,
  Button,
  Select,
  Typography,
  Empty,
  Badge,
  Input,
  Tooltip,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  HistoryOutlined,
  ReloadOutlined,
  FolderAddOutlined,
  FileAddOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  CheckCircleOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { FileTransaction, ServerNode } from '@/types/explorer';
import { explorerService } from '@/services/explorerService';
import { useI18n } from '@/i18n/LanguageContext';

const { Text } = Typography;

interface TransactionsDrawerProps {
  open: boolean;
  onClose: () => void;
  servers: ServerNode[];
  activeServerCode?: string;
}

export const TransactionsDrawer: React.FC<TransactionsDrawerProps> = ({
  open,
  onClose,
  servers,
}) => {
  const { t, language } = useI18n();
  const [transactions, setTransactions] = useState<FileTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedServer, setSelectedServer] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadTransactions = async (queryText?: string) => {
    setLoading(true);
    try {
      const serverFilter = selectedServer === 'all' ? undefined : selectedServer;
      const q = queryText !== undefined ? queryText : searchQuery;
      const data = await explorerService.getTransactions(serverFilter, q, 1000);
      setTransactions(data);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      loadTransactions(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [open, selectedServer, searchQuery]);

  const filteredData = transactions.filter((tItem) => {
    if (typeFilter !== 'all' && tItem.transactionType !== typeFilter) {
      return false;
    }
    return true;
  });

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case 'CreateFolder':
        return (
          <Tag icon={<FolderAddOutlined />} color="green">
            {t('txTypeCreateFolder')}
          </Tag>
        );
      case 'CreateFile':
        return (
          <Tag icon={<FileAddOutlined />} color="cyan">
            {t('txTypeCreateFile')}
          </Tag>
        );
      case 'Rename':
        return (
          <Tag icon={<EditOutlined />} color="orange">
            {t('txTypeRename')}
          </Tag>
        );
      case 'Delete':
        return (
          <Tag icon={<DeleteOutlined />} color="red">
            {t('txTypeDelete')}
          </Tag>
        );
      case 'Upload':
        return (
          <Tag icon={<UploadOutlined />} color="blue">
            {t('txTypeUpload')}
          </Tag>
        );
      default:
        return <Tag color="default">{type}</Tag>;
    }
  };

  const columns: ColumnsType<FileTransaction> = [
    {
      title: t('txTime'),
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 150,
      render: (val) => (
        <span style={{ fontSize: 12, color: '#595959' }}>
          {new Date(val).toLocaleTimeString(language === 'en' ? 'en-US' : 'tr-TR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
          <div style={{ fontSize: 10, color: '#8c8c8c' }}>
            {new Date(val).toLocaleDateString(language === 'en' ? 'en-US' : 'tr-TR')}
          </div>
        </span>
      ),
    },
    {
      title: t('txType'),
      dataIndex: 'transactionType',
      key: 'transactionType',
      width: 170,
      render: (type) => getTransactionBadge(type),
    },
    {
      title: t('txServer'),
      dataIndex: 'serverCode',
      key: 'serverCode',
      width: 140,
      render: (srvCode) => {
        const srv = servers.find(
          (s) =>
            (s.serverCode || s.id || '').toLowerCase() ===
            (srvCode || '').toLowerCase()
        );
        return (
          <Tag style={{ margin: 0, fontWeight: 500 }}>
            {srv ? srv.name : srvCode}
          </Tag>
        );
      },
    },
    {
      title: t('txDetails'),
      key: 'details',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, color: '#262626' }}>
            {record.itemName}
          </div>
          <div
            style={{
              fontSize: 11,
              color: '#8c8c8c',
              fontFamily: 'monospace',
              wordBreak: 'break-all',
            }}
          >
            {record.path}
          </div>
          <div style={{ fontSize: 12, color: '#595959', marginTop: 2 }}>
            {record.details}
          </div>
        </div>
      ),
    },
    {
      title: t('txStatus'),
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status) => (
        <Tag icon={<CheckCircleOutlined />} color="success">
          {status === 'Committed' ? t('txCommitted') : status}
        </Tag>
      ),
    },
  ];

  return (
    <Drawer
      id="drawer-transactions"
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <HistoryOutlined style={{ color: '#1890ff', fontSize: 18 }} />
          <span>{t('drawerTransactionsTitle')}</span>
          <Badge
            id="badge-transactions-count"
            count={transactions.length}
            style={{ backgroundColor: '#52c41a' }}
          />
        </div>
      }
      placement="right"
      width={780}
      onClose={onClose}
      open={open}
      extra={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Tooltip title={t('maxRecordsNotice')}>
            <Tag color="blue" style={{ fontSize: 11, margin: 0 }}>
              Max: 1000
            </Tag>
          </Tooltip>
          <Button
            id="btn-refresh-transactions"
            icon={<ReloadOutlined />}
            size="small"
            onClick={() => loadTransactions(searchQuery)}
            loading={loading}
          >
            {t('refresh')}
          </Button>
        </div>
      }
    >
      {/* Filter Bar */}
      <div
        id="transactions-filter-bar"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 16,
          padding: '10px 14px',
          background: '#fafafa',
          borderRadius: 6,
          border: '1px solid #f0f0f0',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: 1, minWidth: 200 }}>
          <Input
            id="input-tx-search"
            size="small"
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            placeholder={t('searchTransactionsPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear
          />
        </div>

        <div>
          <Text type="secondary" style={{ fontSize: 12, marginRight: 6 }}>
            {t('filterServerLabel')}
          </Text>
          <Select
            id="select-tx-server"
            value={selectedServer}
            onChange={(v) => setSelectedServer(v)}
            style={{ width: 160 }}
            size="small"
          >
            <Select.Option value="all">{t('allServers')}</Select.Option>
            {servers.map((s) => {
              const code = s.serverCode || s.id || '';
              return (
                <Select.Option key={code} value={code}>
                  {s.name}
                </Select.Option>
              );
            })}
          </Select>
        </div>

        <div>
          <Text type="secondary" style={{ fontSize: 12, marginRight: 6 }}>
            {t('filterTypeLabel')}
          </Text>
          <Select
            id="select-tx-type"
            value={typeFilter}
            onChange={(v) => setTypeFilter(v)}
            style={{ width: 150 }}
            size="small"
          >
            <Select.Option value="all">{t('allOperations')}</Select.Option>
            <Select.Option value="CreateFolder">{t('newFolder')}</Select.Option>
            <Select.Option value="CreateFile">{t('newFile')}</Select.Option>
            <Select.Option value="Rename">{t('actionRename')}</Select.Option>
            <Select.Option value="Delete">{t('actionDelete')}</Select.Option>
            <Select.Option value="Upload">{t('uploadFile')}</Select.Option>
          </Select>
        </div>
      </div>

      {/* Transaction Table */}
      <Table<FileTransaction>
        id="table-transactions"
        rowKey="id"
        size="small"
        columns={columns}
        dataSource={filteredData}
        loading={loading}
        pagination={{ pageSize: 15, showSizeChanger: false }}
        locale={{
          emptyText: (
            <div id="transactions-empty">
              <Empty
                description={t('noTransactions')}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                style={{ margin: '40px 0' }}
              />
            </div>
          ),
        }}
      />
    </Drawer>
  );
};
