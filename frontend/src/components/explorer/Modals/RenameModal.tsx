/**
 * [TR] Yeniden Adlandırma Modalı (RenameModal): Seçili dosya veya klasörün adını güncellemek için kullanılan diyalog penceresi.
 * [EN] Rename Modal (RenameModal): Dialog modal used to update the name of a selected file or folder.
 */

'use client';

import React, { useEffect } from 'react';
import { Modal, Form, Input } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { ExplorerItem } from '@/types/explorer';
import { useI18n } from '@/i18n/LanguageContext';

interface RenameModalProps {
  open: boolean;
  item: ExplorerItem | null;
  onCancel: () => void;
  onSubmit: (newName: string) => void;
  confirmLoading?: boolean;
}

export const RenameModal: React.FC<RenameModalProps> = ({
  open,
  item,
  onCancel,
  onSubmit,
  confirmLoading = false,
}) => {
  const { t } = useI18n();
  const [form] = Form.useForm();

  useEffect(() => {
    if (open && item) {
      form.setFieldsValue({
        newName: item.name,
      });
    }
  }, [open, item, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      onSubmit(values.newName);
    } catch {
      // form validation error
    }
  };

  return (
    <Modal
      title={
        <span id="modal-rename-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <EditOutlined style={{ color: '#fa8c16' }} />
          <span>
            {t('modalRenameTitle')} {item?.name}
          </span>
        </span>
      }
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={confirmLoading}
      okText={t('saveBtn')}
      cancelText={t('cancel')}
      okButtonProps={{ id: 'btn-rename-modal-ok' }}
      cancelButtonProps={{ id: 'btn-rename-modal-cancel' }}
      destroyOnClose
    >
      <div id="rename-modal-location" style={{ marginBottom: 16, color: '#8c8c8c', fontSize: 13 }}>
        {t('locationLabel')}{' '}
        <strong id="rename-modal-parent-path" style={{ color: '#262626' }}>
          {item?.parentPath}
        </strong>
      </div>

      <Form id="form-rename-item" form={form} layout="vertical">
        <Form.Item
          name="newName"
          label={t('newNameLabel')}
          rules={[
            { required: true, message: t('nameRequired') },
            {
              pattern: /^[^<>:"/\\|?*]+$/,
              message: t('nameInvalidChars'),
            },
          ]}
        >
          <Input id="input-rename-name" placeholder={t('newNamePlaceholder')} autoFocus />
        </Form.Item>
      </Form>
    </Modal>
  );
};
