/**
 * [TR] Dosya Önizleme Modalı (PreviewModal): Seçilen dosyanın meta verilerini (yol, boyut, uzantı, tarihler), metin içeriği önizlemesini ve indirme/kopyalama butonlarını gösterir.
 * [EN] File Preview Modal (PreviewModal): Displays selected file metadata (path, size, extension, dates), text content preview, and download/copy buttons.
 */

'use client';

import React from 'react';
import { Modal, Descriptions, Tag, Button, Typography, message } from 'antd';
import {
  FileTextOutlined,
  CopyOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { ExplorerItem } from '@/types/explorer';
import { useI18n } from '@/i18n/LanguageContext';

const { Text } = Typography;

interface PreviewModalProps {
  open: boolean;
  item: ExplorerItem | null;
  onClose: () => void;
}

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  open,
  item,
  onClose,
}) => {
  const { t, language } = useI18n();

  if (!item) return null;

  const handleCopyContent = () => {
    if (item.content) {
      navigator.clipboard.writeText(item.content);
      message.success(t('contentCopied'));
    }
  };

  const handleDownload = () => {
    const blob = new Blob([item.content || ''], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = item.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    message.success(`${item.name} ${t('downloadSuccess')}`);
  };

  return (
    <Modal
      title={
        <span id="preview-file-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileTextOutlined style={{ color: '#1890ff' }} />
          <span>{item.name}</span>
          {item.extension && (
            <Tag color="blue" style={{ textTransform: 'uppercase' }}>
              {item.extension}
            </Tag>
          )}
        </span>
      }
      open={open}
      onCancel={onClose}
      width={700}
      footer={[
        <Button id="btn-preview-close" key="close" onClick={onClose}>
          {t('closeBtn')}
        </Button>,
        item.content && (
          <Button
            id="btn-preview-copy"
            key="copy"
            icon={<CopyOutlined />}
            onClick={handleCopyContent}
          >
            {t('copyContentBtn')}
          </Button>
        ),
        <Button
          id="btn-preview-download"
          key="download"
          type="primary"
          icon={<DownloadOutlined />}
          onClick={handleDownload}
        >
          {t('downloadBtn')}
        </Button>,
      ].filter(Boolean)}
    >
      <Descriptions id="descriptions-file-info" size="small" bordered column={2} style={{ marginBottom: 16 }}>
        <Descriptions.Item label={t('infoFullPath')} span={2}>
          <Text id="preview-file-path" code>{item.path}</Text>
        </Descriptions.Item>
        <Descriptions.Item label={t('infoSize')}>
          <span id="preview-file-size">{formatBytes(item.size)}</span>
        </Descriptions.Item>
        <Descriptions.Item label={t('infoExtension')}>
          <span id="preview-file-ext">{item.extension || '-'}</span>
        </Descriptions.Item>
        <Descriptions.Item label={t('infoModifiedAt')}>
          <span id="preview-file-modified">
            {new Date(item.modifiedAt).toLocaleString(language === 'en' ? 'en-US' : 'tr-TR')}
          </span>
        </Descriptions.Item>
        <Descriptions.Item label={t('infoCreatedAt')}>
          <span id="preview-file-created">
            {new Date(item.createdAt).toLocaleString(language === 'en' ? 'en-US' : 'tr-TR')}
          </span>
        </Descriptions.Item>
      </Descriptions>

      {item.content ? (
        <div>
          <div style={{ marginBottom: 6, fontWeight: 600, color: '#595959' }}>
            {t('contentPreviewHeader')}
          </div>
          <pre
            id="preview-content-box"
            style={{
              background: '#282c34',
              color: '#abb2bf',
              padding: 12,
              borderRadius: 6,
              maxHeight: 280,
              overflowY: 'auto',
              fontSize: 12,
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {item.content}
          </pre>
        </div>
      ) : (
        <div
          id="preview-no-content"
          style={{
            textAlign: 'center',
            padding: '30px 0',
            background: '#fafafa',
            borderRadius: 6,
            color: '#8c8c8c',
          }}
        >
          {t('noTextPreview')} ({formatBytes(item.size)}).
        </div>
      )}
    </Modal>
  );
};
