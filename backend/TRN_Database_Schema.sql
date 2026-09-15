-- ======================================================================================
-- [TR] WebExplorer Veritabanı Şeması & Tablo Tanımları (MSSQL)
-- [EN] WebExplorer Database Schema & Table Definitions (MSSQL)
-- Şema: TRN
-- Tablolar: TRN.Servers, TRN.ExplorerItems, TRN.FileTransactions
-- ======================================================================================

-- 1. TRN Şeması Oluşturma / Create TRN Schema
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'TRN')
BEGIN
    EXEC('CREATE SCHEMA TRN AUTHORIZATION dbo;');
    PRINT 'TRN şeması başarıyla oluşturuldu.';
END
GO

-- ======================================================================================
-- 2. TRN.Servers Tablosu (Sunucu Tanımları)
-- ======================================================================================
IF OBJECT_ID('TRN.Servers', 'U') IS NOT NULL
    DROP TABLE TRN.Servers;
GO

CREATE TABLE TRN.Servers
(
    ServerCode      NVARCHAR(50)    NOT NULL,
    Name            NVARCHAR(150)   NOT NULL,
    Host            NVARCHAR(100)   NOT NULL,
    Status          NVARCHAR(50)    NOT NULL CONSTRAINT DF_Servers_Status DEFAULT 'Online',
    RootPath        NVARCHAR(500)   NOT NULL,
    CreatedAt       DATETIME2(7)    NOT NULL CONSTRAINT DF_Servers_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt       DATETIME2(7)    NULL,

    CONSTRAINT PK_TRN_Servers PRIMARY KEY CLUSTERED (ServerCode)
);
GO

-- ======================================================================================
-- 3. TRN.ExplorerItems Tablosu (Dosya ve Klasör Hiyerarşisi)
-- ======================================================================================
IF OBJECT_ID('TRN.ExplorerItems', 'U') IS NOT NULL
    DROP TABLE TRN.ExplorerItems;
GO

CREATE TABLE TRN.ExplorerItems
(
    Id              NVARCHAR(100)   NOT NULL,
    ServerCode      NVARCHAR(50)    NOT NULL,
    Name            NVARCHAR(260)   NOT NULL,
    Path            NVARCHAR(1000)  NOT NULL,
    ParentPath      NVARCHAR(1000)  NOT NULL,
    IsFolder        BIT             NOT NULL CONSTRAINT DF_ExplorerItems_IsFolder DEFAULT 0,
    Extension       NVARCHAR(50)    NOT NULL CONSTRAINT DF_ExplorerItems_Extension DEFAULT '',
    Size            BIGINT          NOT NULL CONSTRAINT DF_ExplorerItems_Size DEFAULT 0,
    Content         NVARCHAR(MAX)   NULL,
    ModifiedAt      DATETIME2(7)    NOT NULL CONSTRAINT DF_ExplorerItems_ModifiedAt DEFAULT SYSUTCDATETIME(),
    CreatedAt       DATETIME2(7)    NOT NULL CONSTRAINT DF_ExplorerItems_CreatedAt DEFAULT SYSUTCDATETIME(),

    CONSTRAINT PK_TRN_ExplorerItems PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT FK_TRN_ExplorerItems_Servers FOREIGN KEY (ServerCode)
        REFERENCES TRN.Servers (ServerCode)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);
GO

-- Performans İndeksleri
CREATE NONCLUSTERED INDEX IX_TRN_ExplorerItems_Server_ParentPath
    ON TRN.ExplorerItems (ServerCode, ParentPath)
    INCLUDE (Name, IsFolder, Size, Extension, ModifiedAt);
GO

CREATE NONCLUSTERED INDEX IX_TRN_ExplorerItems_Server_Path
    ON TRN.ExplorerItems (ServerCode, Path);
GO

-- ======================================================================================
-- 4. TRN.FileTransactions Tablosu (İşlem & Denetim Günlüğü)
-- ======================================================================================
IF OBJECT_ID('TRN.FileTransactions', 'U') IS NOT NULL
    DROP TABLE TRN.FileTransactions;
GO

CREATE TABLE TRN.FileTransactions
(
    Id                  NVARCHAR(100)   NOT NULL,
    ServerCode          NVARCHAR(50)    NOT NULL,
    TransactionType     NVARCHAR(50)    NOT NULL, -- CreateFolder, CreateFile, Rename, Delete, Upload
    Path                NVARCHAR(1000)  NOT NULL,
    ItemName            NVARCHAR(260)   NOT NULL,
    IsFolder            BIT             NOT NULL CONSTRAINT DF_FileTransactions_IsFolder DEFAULT 0,
    Size                BIGINT          NOT NULL CONSTRAINT DF_FileTransactions_Size DEFAULT 0,
    Timestamp           DATETIME2(7)    NOT NULL CONSTRAINT DF_FileTransactions_Timestamp DEFAULT SYSUTCDATETIME(),
    Status              NVARCHAR(50)    NOT NULL CONSTRAINT DF_FileTransactions_Status DEFAULT 'Committed',
    Details             NVARCHAR(2000)  NULL,
    PreviousContent     NVARCHAR(MAX)   NULL,
    NewContent          NVARCHAR(MAX)   NULL,

    CONSTRAINT PK_TRN_FileTransactions PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT FK_TRN_FileTransactions_Servers FOREIGN KEY (ServerCode)
        REFERENCES TRN.Servers (ServerCode)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);
GO

-- Performans İndeksleri
CREATE NONCLUSTERED INDEX IX_TRN_FileTransactions_Server_Timestamp
    ON TRN.FileTransactions (ServerCode, Timestamp DESC);
GO

CREATE NONCLUSTERED INDEX IX_TRN_FileTransactions_ItemName_Path
    ON TRN.FileTransactions (ItemName, Path);
GO

-- ======================================================================================
-- 5. Başlangıç Tohum Verileri (Seed Data)
-- ======================================================================================

-- Sunucular
INSERT INTO TRN.Servers (ServerCode, Name, Host, Status, RootPath)
VALUES
    ('srv-prod-01', 'PROD-APP-01', '192.168.1.10', 'Online', 'C:/app'),
    ('srv-storage-02', 'STORAGE-NAS-02', '192.168.1.20', 'Online', '/var/data'),
    ('srv-backup-03', 'BACKUP-VAULT-03', '192.168.1.30', 'Online', '/backup/archives'),
    ('srv-share-04', 'SHARED-STORAGE-04', '192.168.1.40', 'Online', 'D:/Shared');
GO

-- srv-prod-01 Örnek Klasör ve Dosyaları
INSERT INTO TRN.ExplorerItems (Id, ServerCode, Name, Path, ParentPath, IsFolder, Extension, Size, Content)
VALUES
    ('1', 'srv-prod-01', 'backend', 'C:/app/backend', 'C:/app', 1, '', 0, NULL),
    ('2', 'srv-prod-01', 'frontend', 'C:/app/frontend', 'C:/app', 1, '', 0, NULL),
    ('3', 'srv-prod-01', 'README.md', 'C:/app/README.md', 'C:/app', 0, 'md', 1024, '# WebExplorer Project\nProduction Application Server 01.'),
    ('4', 'srv-prod-01', 'appsettings.json', 'C:/app/appsettings.json', 'C:/app', 0, 'json', 512, '{\n  "Logging": {\n    "LogLevel": {\n      "Default": "Information"\n    }\n  }\n}'),
    ('5', 'srv-prod-01', 'Controllers', 'C:/app/backend/Controllers', 'C:/app/backend', 1, '', 0, NULL),
    ('6', 'srv-prod-01', 'Models', 'C:/app/backend/Models', 'C:/app/backend', 1, '', 0, NULL),
    ('7', 'srv-prod-01', 'Services', 'C:/app/backend/Services', 'C:/app/backend', 1, '', 0, NULL),
    ('8', 'srv-prod-01', 'Program.cs', 'C:/app/backend/Program.cs', 'C:/app/backend', 0, 'cs', 2048, 'var builder = WebApplication.CreateBuilder(args);\nvar app = builder.Build();\napp.Run();');
GO

-- srv-storage-02 Örnek Klasör ve Dosyaları
INSERT INTO TRN.ExplorerItems (Id, ServerCode, Name, Path, ParentPath, IsFolder, Extension, Size, Content)
VALUES
    ('201', 'srv-storage-02', 'uploads', '/var/data/uploads', '/var/data', 1, '', 0, NULL),
    ('202', 'srv-storage-02', 'logs', '/var/data/logs', '/var/data', 1, '', 0, NULL),
    ('203', 'srv-storage-02', 'database.bak', '/var/data/database.bak', '/var/data', 0, 'bak', 524288000, NULL),
    ('204', 'srv-storage-02', 'access.log', '/var/data/logs/access.log', '/var/data/logs', 0, 'log', 4096, '2026-09-15 10:00:00 [INFO] Storage cluster initialized.');
GO

-- Başlangıç İşlem Günlüğü Tohum Kaydı
INSERT INTO TRN.FileTransactions (Id, ServerCode, TransactionType, Path, ItemName, IsFolder, Size, Details)
VALUES
    (NEWID(), 'srv-prod-01', 'CreateFolder', 'C:/app/backend', 'backend', 1, 0, 'Sistem kurulumunda otomatik oluşturuldu.'),
    (NEWID(), 'srv-prod-01', 'CreateFile', 'C:/app/appsettings.json', 'appsettings.json', 0, 512, 'Yapılandırma dosyası oluşturuldu.');
GO

PRINT 'TRN şeması, tablolar ve tohum verileri başarıyla oluşturuldu.';
GO
