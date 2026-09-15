/**
 * [TR] Yeni Öğe Oluşturma Modalı (CreateModal): Aktif dizinde yeni bir klasör veya uzantısıyla birlikte yeni bir dosya oluşturmak için kullanılan diyalog penceresi.
 * [EN] Create Item Modal (CreateModal): Dialog modal used to create a new folder or new file with extension and optional initial content in the active directory.
 */

'use client';

import React, { useEffect } from 'react';
import { Modal, Form, Input, Radio } from 'antd';
import { FolderAddOutlined, FileAddOutlined } from '@ant-design/icons';
import { useI18n } from '@/i18n/LanguageContext';

interface CreateModalProps {
  open: boolean;
  initialType?: 'folder' | 'file';
  currentPath: string;
  onCancel: () => void;
  onSubmit: (values: { name: string; isFolder: boolean; initialContent?: string }) => void;
  confirmLoading?: boolean;
}

export const CreateModal: React.FC<CreateModalProps> = ({
  open,
  initialType = 'folder',
  currentPath,
  onCancel,
  onSubmit,
  confirmLoading = false,
}) => {
  const { t } = useI18n();
  const [form] = Form.useForm();
  const isFolder = Form.useWatch('isFolder', form);

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        isFolder: initialType === 'folder',
        name: '',
        initialContent: '',
      });
    }
  }, [open, initialType, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      onSubmit(values);
    } catch {
      // form validation failed
    }
  };

  return (
    <Modal
      title={
        <span id="modal-create-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isFolder ? (
            <FolderAddOutlined style={{ color: '#52c41a' }} />
          ) : (
            <FileAddOutlined style={{ color: '#1890ff' }} />
          )}
          <span>{isFolder ? t('modalCreateTitleFolder') : t('modalCreateTitleFile')}</span>
        </span>
      }
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={confirmLoading}
      okText={t('createBtn')}
      cancelText={t('cancel')}
      okButtonProps={{ id: 'btn-create-modal-ok' }}
      cancelButtonProps={{ id: 'btn-create-modal-cancel' }}
      destroyOnClose
    >
      <div id="create-modal-location" style={{ marginBottom: 16, color: '#8c8c8c', fontSize: 13 }}>
        {t('locationLabel')}{' '}
        <strong id="create-modal-current-path" style={{ color: '#262626' }}>
          {currentPath}
        </strong>
      </div>

      <Form
        id="form-create-item"
        form={form}
        layout="vertical"
        initialValues={{ isFolder: initialType === 'folder' }}
      >
        <Form.Item name="isFolder" label={t('typeLabel')}>
          <Radio.Group id="radiogroup-create-type" buttonStyle="solid">
            <Radio.Button id="radio-type-folder" value={true}>
              {t('tagFolder')}
            </Radio.Button>
            <Radio.Button id="radio-type-file" value={false}>
              {t('tagFile')}
            </Radio.Button>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          name="name"
          label={isFolder ? t('folderNameLabel') : t('fileNameLabel')}
          rules={[
            { required: true, message: t('nameRequired') },
            {
              pattern: /^[^<>:"/\\|?*]+$/,
              message: t('nameInvalidChars'),
            },
          ]}
        >
          <Input
            id="input-create-name"
            placeholder={isFolder ? t('folderPlaceholder') : t('filePlaceholder')}
            autoFocus
          />
        </Form.Item>

        {!isFolder && (
          <Form.Item name="initialContent" label={t('initialContentLabel')}>
            <Input.TextArea
              id="input-create-initial-content"
              rows={5}
              placeholder={t('initialContentPlaceholder')}
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
};
