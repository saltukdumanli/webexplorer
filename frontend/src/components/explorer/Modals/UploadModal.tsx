/**
 * [TR] Dosya Yükleme Modalı (UploadModal): Aktif klasöre sürükle-bırak veya dosya seçici ile tekli/çoklu dosya yükleme imkanı sunan modal.
 * [EN] File Upload Modal (UploadModal): Modal enabling single or multiple file uploads to the active folder via drag-and-drop or file browser.
 */

'use client';

import React, { useState } from 'react';
import { Modal, Upload, Button, Typography, message } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import { InboxOutlined, UploadOutlined } from '@ant-design/icons';
import { formatBytes } from '../FileListTable';
import { useI18n } from '@/i18n/LanguageContext';

const { Dragger } = Upload;
const { Text } = Typography;

interface UploadModalProps {
  open: boolean;
  currentPath: string;
  onCancel: () => void;
  onUpload: (files: File[]) => Promise<void>;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  open,
  currentPath,
  onCancel,
  onUpload,
}) => {
  const { t } = useI18n();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleBeforeUpload = (file: File) => {
    setFileList((prev) => [...prev, file as unknown as UploadFile]);
    return false;
  };

  const handleRemove = (file: UploadFile) => {
    setFileList((prev) => prev.filter((item) => item.uid !== file.uid));
  };

  const handleStartUpload = async () => {
    if (fileList.length === 0) {
      message.warning(t('selectAtLeastOneFile'));
      return;
    }

    setUploading(true);
    try {
      const rawFiles = fileList.map((f) => (f as any) as File);
      await onUpload(rawFiles);
      setFileList([]);
      onCancel();
    } catch (err: any) {
      message.error(`${t('uploadFailed')}: ${err.message || err}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      title={
        <span id="upload-modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <UploadOutlined style={{ color: '#1890ff' }} />
          <span>{t('modalUploadTitle')}</span>
        </span>
      }
      open={open}
      onCancel={() => {
        if (!uploading) {
          setFileList([]);
          onCancel();
        }
      }}
      width={560}
      footer={[
        <Button id="btn-upload-cancel" key="cancel" disabled={uploading} onClick={onCancel}>
          {t('cancel')}
        </Button>,
        <Button
          id="btn-upload-start"
          key="upload"
          type="primary"
          icon={<UploadOutlined />}
          loading={uploading}
          disabled={fileList.length === 0}
          onClick={handleStartUpload}
        >
          {uploading
            ? t('uploadingBtn')
            : `${t('uploadBtn')} (${fileList.length})`}
        </Button>,
      ]}
      destroyOnClose
    >
      <div style={{ marginBottom: 16, fontSize: 13, color: '#595959' }}>
        {t('targetFolderLabel')}{' '}
        <Text id="upload-target-path" strong code>
          {currentPath}
        </Text>
      </div>

      <Dragger
        id="dragger-upload-files"
        multiple
        fileList={fileList}
        beforeUpload={handleBeforeUpload}
        onRemove={handleRemove}
        showUploadList={{
          showRemoveIcon: !uploading,
        }}
        style={{ padding: 20 }}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined style={{ color: '#1890ff', fontSize: 48 }} />
        </p>
        <p className="ant-upload-text" style={{ fontSize: 16, fontWeight: 500 }}>
          {t('draggerText')}
        </p>
        <p className="ant-upload-hint" style={{ color: '#8c8c8c', fontSize: 12 }}>
          {t('draggerHint')}
        </p>
      </Dragger>

      {fileList.length > 0 && (
        <div
          id="upload-files-summary"
          style={{ marginTop: 12, textAlign: 'right', fontSize: 12, color: '#8c8c8c' }}
        >
          {t('totalUploadFiles')} {fileList.length} (
          {formatBytes(
            fileList.reduce((sum, f) => sum + (f.size || 0), 0)
          )}
          )
        </div>
      )}
    </Modal>
  );
};
