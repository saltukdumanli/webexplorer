/**
 * [TR] Kök Yerleşim (RootLayout): Uygulamanın genel tema (Ant Design), stil (globals.css), AntdRegistry ve Çoklu Dil (LanguageProvider) sağlayıcılarını barındırır.
 * [EN] Root Layout (RootLayout): Houses the application's overall theme (Ant Design), styles (globals.css), AntdRegistry, and Multi-language (LanguageProvider) providers.
 */

import React from 'react';
import type { Metadata } from 'next';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider } from 'antd';
import { LanguageProvider } from '@/i18n/LanguageContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'Web Explorer - Multi-Server File Manager',
  description: 'Modern multi-server and folder file explorer interface',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body id="app-root-body" style={{ margin: 0, padding: 0, overflow: 'hidden' }}>
        <AntdRegistry>
          <LanguageProvider>
            <ConfigProvider
              theme={{
                token: {
                  colorPrimary: '#1890ff',
                  borderRadius: 6,
                  fontFamily:
                    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
                },
              }}
            >
              {children}
            </ConfigProvider>
          </LanguageProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
