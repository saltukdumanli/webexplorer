# Web Explorer - Modern Dosya Gezgini

React, Next.js (App Router), Ant Design (antd) ve C# ASP.NET Core Web API (.NET 10) ile geliştirilmiş tam özellikli çoklu sunucu ve dosya yöneticisi arayüzü.

---

## Özellikler

- **Çoklu Sekmeli Gezinme (Multi-Tab)**:
  - Windows 11 Dosya Gezgini ve modern tarayıcılar gibi sekmeli yapı.
  - Her sekme kendi bağımsız sunucusunu, aktif yolunu, gezinme geçmişini (Geri / İleri) ve seçimlerini korur.
  - Yeni sekme açma (`+`) ve sekmeleri kapatma (`x`).
- **Sunucu Seçimi (Sol Panel)**:
  - Sol panelde sadece **Sunucu Seçimi** listesi yer alır.
  - Sunucu adı, IP/Host, durum rozeti (`Online`), işletim sistemi etiketi (`Windows`/`Linux`) ve kök sürücüler (`C:/`, `D:/` veya `/var/data`, `/opt/backups`).
  - Bir sunucuya veya sürücüsüne tıklandığında aktif sekme o sunucuya geçiş yapar.
  - Klasörler ve dosya gezinimi ana çalışma alanındaki sekmeler, adres çubuğu, breadcrumb ve dosya listesi üzerinden yönetilir.
- **Dosya Yolu & Adres Çubuğu**:
  - Geri, İleri, Üst Klasöre Çık ve Yenile butonları.
  - Tıklanabilir Breadcrumb yol gezinimi.
  - Adres çubuğuna tıklayarak doğrudan dosya yolu yazabilme (örn: `C:/inetpub/wwwroot` veya `/var/data/uploads`).
  - Anlık dosya arama & filtreleme.
- **Dosya & Klasör Yönetimi (CRUD)**:
  - **Yeni Klasör Ekleme**: İsim doğrulama ile anında oluşturma.
  - **Yeni Dosya Ekleme**: Uzantı ve isteğe bağlı başlangıç içeriği ile dosya oluşturma.
  - **Yeniden Adlandırma (Rename)**: Klasör ve dosya isimlerini güncelleme (klasör adı değiştiğinde alt dosyaların yolları otomatik güncellenir).
  - **Silme (Delete)**: Güvenlik onaylı (Popconfirm) silme işlemi (klasör silindiğinde tüm alt hiyerarşi temizlenir).
  - **Önizleme & İndirme**: Kod, JSON, XML, HTML, LOG, MD gibi metin dosyalarının içeriklerini önizleme ve indirme.
- **Görünüm Seçenekleri**:
  - Tablo (Liste) ve Kart (Grid) görünümleri arasında geçiş.
- **Çift Katmanlı Servis Mimarisi**:
  - **Mock Servis**: Herhangi bir backend kurulumu olmadan tarayıcıda `localStorage` üzerinde stateful çalışan tam yetenekli mock motoru.
  - **C# .NET Web API**: ASP.NET Core REST API katmanı (`/api/explorer`).
  - Arayüzün sağ üst köşesindeki **"Servis Kaynağı"** düğmesinden tek tıkla `Mock Servis` ve `C# .NET API` modları arasında geçiş yapılabilir.

---

## Kurulum ve Çalıştırma

### 1. Frontend (Next.js + Ant Design)

```bash
cd frontend
npm run dev
```

Uygulama varsayılan olarak **http://localhost:3000** adresinde açılır.

### 2. Backend (C# .NET Web API)

```bash
cd backend/WebExplorer.Api
dotnet run
```

API varsayılan olarak **http://localhost:5000** adresinde çalışır ve Swagger/OpenAPI endpointleri mevcuttur.

---

## Dizin Yapısı

```
c:\app\webexplorer\
├── frontend/                     # Next.js 16 + React 19 + Ant Design 6
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx        # AntdRegistry & Türkçe yerelleştirme
│   │   │   ├── page.tsx          # Ana dosya gezgini sayfası ve durum yönetimi
│   │   │   └── globals.css       # Özel kaydırma çubukları ve genel stiller
│   │   ├── components/
│   │   │   ├── HeaderBar.tsx     # Üst bar, servis modu seçici (Mock/API)
│   │   │   ├── ExplorerTabs.tsx  # Çoklu sekme çubuğu
│   │   │   ├── AddressBar.tsx    # Adres çubuğu, breadcrumb, arama, butonlar
│   │   │   ├── ServerFolderTree.tsx # Sol panel: Server & hiyerarşik klasör ağacı
│   │   │   ├── FileListTable.tsx # Tablo ve Grid dosya listesi & eylemler
│   │   │   ├── StatusBar.tsx     # Alt durum çubuğu
│   │   │   └── Modals/
│   │   │       ├── CreateModal.tsx  # Yeni klasör/dosya modalı
│   │   │       ├── RenameModal.tsx  # Yeniden adlandırma modalı
│   │   │       └── PreviewModal.tsx # Dosya önizleme ve indirme modalı
│   │   ├── services/
│   │   │   ├── explorerService.ts   # Mock ve API dinamik servis adaptörü
│   │   │   └── mockData.ts          # Zengin başlangıç sunucu ve dosya verileri
│   │   └── types/
│   │       └── explorer.ts          # Tip tanımları
├── backend/
│   └── WebExplorer.Api/          # ASP.NET Core Web API (.NET 10)
│       ├── Controllers/
│       │   └── ExplorerController.cs # REST API Controller
│       ├── Models/
│       │   └── ExplorerModels.cs    # Sunucu ve öğe DTO sınıfları
│       ├── Services/
│       │   ├── IExplorerService.cs
│       │   └── InMemoryExplorerService.cs # C# dosya yöneticisi motoru
│       └── Program.cs               # CORS, DI ve OpenAPI yapılandırması
└── README.md
```
