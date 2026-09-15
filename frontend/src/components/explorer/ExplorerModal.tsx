/**
 * [TR] Tam Ekran Dosya Gezgini Modalı (ExplorerModal): Herhangi bir sayfadan bir butonla tetiklenebilen, ekranı 100vw/100vh kaplayan ve defaultServerCode parametresiyle istenen sunucuyu açan modal bileşeni.
 * [EN] Fullscreen File Explorer Modal (ExplorerModal): Can be triggered from any page with a button, fills 100vw/100vh screen, and opens target server via defaultServerCode parameter.
 */

'use client';

import React from 'react';
import { Modal } from 'antd';
import { ExplorerView } from './ExplorerView';

export interface ExplorerModalProps {
  /**
   * [TR] Modalın açık/kapalı olma durumu
   * [EN] Visibility state of the modal
   */
  open: boolean;

  /**
   * [TR] Modal kapatıldığında çalışacak fonksiyon
   * [EN] Callback invoked when the modal is closed
   */
  onClose: () => void;

  /**
   * [TR] Varsayılan seçili gelecek sunucu kodu (örn: 'srv-prod-01', 'srv-db-01')
   * [EN] Default selected server code (e.g. 'srv-prod-01', 'srv-db-01')
   */
  defaultServerCode?: string;

  /**
   * [TR] Başlangıçta açılacak dizin yolu (opsiyonel)
   * [EN] Initial directory path (optional)
   */
  defaultPath?: string;

  /**
   * [TR] Modal kapatıldığında iç durumu sıfırlamak için (varsayılan: true)
   * [EN] Destroy modal children on close to reset state (default: true)
   */
  destroyOnClose?: boolean;

  /**
   * [TR] Modal z-index değeri (varsayılan: 1000)
   * [EN] Modal z-index value (default: 1000)
   */
  zIndex?: number;
}

export const ExplorerModal: React.FC<ExplorerModalProps> = ({
  open,
  onClose,
  defaultServerCode,
  defaultPath,
  destroyOnClose = true,
  zIndex = 1000,
}) => {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      closable={false}
      destroyOnClose={destroyOnClose}
      zIndex={zIndex}
      width="100vw"
      rootClassName="explorer-fullscreen-modal-root"
      wrapClassName="explorer-fullscreen-modal-wrap"
      style={{
        top: 0,
        left: 0,
        margin: 0,
        padding: 0,
        paddingBottom: 0,
        maxWidth: '100vw',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
      }}
      styles={{
        wrapper: {
          overflow: 'hidden',
          padding: 0,
          margin: 0,
        },
        container: {
          padding: 0,
          margin: 0,
          borderRadius: 0,
          height: '100vh',
          maxHeight: '100vh',
          width: '100vw',
          overflow: 'hidden',
        },
        body: {
          padding: 0,
          margin: 0,
          height: '100vh',
          maxHeight: '100vh',
          width: '100vw',
          overflow: 'hidden',
        },
      }}
    >
      <ExplorerView
        defaultServerCode={defaultServerCode}
        defaultPath={defaultPath}
        onClose={onClose}
        showCloseButton={true}
        height="100vh"
      />
    </Modal>
  );
};
