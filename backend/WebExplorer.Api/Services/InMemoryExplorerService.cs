using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using WebExplorer.Api.Models;

namespace WebExplorer.Api.Services;

/// <summary>
/// [TR] Bellek İçi Gezgin Servisi: Sunucuları, dosya/klasör ağacını simüle eder ve yapılan her manipülasyonu ITransactionService aracılığıyla denetim günlüğüne kaydeder.
/// [EN] In-Memory Explorer Service: Simulates servers, file/folder hierarchy, and logs every manipulation to the audit journal via ITransactionService.
/// </summary>
public class InMemoryExplorerService : IExplorerService
{
    /// <summary>
    /// [TR] Statik sunucu tanımları (ileride harici bir servisten getirilecektir)
    /// [EN] Static server definitions (will be retrieved from an external service in the future)
    /// </summary>
    private static readonly List<ServerDto> StaticServers = new()
    {
        new ServerDto
        {
            ServerCode = "srv-prod-01",
            Name = "PROD-APP-01",
            Host = "192.168.1.10",
            Status = "Online",
            RootPath = "C:/app"
        },
        new ServerDto
        {
            ServerCode = "srv-db-01",
            Name = "PROD-DB-01",
            Host = "192.168.1.15",
            Status = "Online",
            RootPath = "D:/database"
        },
        new ServerDto
        {
            ServerCode = "srv-dev-01",
            Name = "DEV-STAGE-01",
            Host = "192.168.1.50",
            Status = "Online",
            RootPath = "C:/stage"
        },
        new ServerDto
        {
            ServerCode = "srv-storage-02",
            Name = "STORAGE-NAS-02",
            Host = "192.168.1.20",
            Status = "Online",
            RootPath = "/var/data"
        },
        new ServerDto
        {
            ServerCode = "srv-backup-03",
            Name = "BACKUP-VAULT-03",
            Host = "192.168.1.30",
            Status = "Online",
            RootPath = "/backup/archives"
        },
        new ServerDto
        {
            ServerCode = "srv-share-04",
            Name = "SHARED-STORAGE-04",
            Host = "192.168.1.40",
            Status = "Online",
            RootPath = "D:/Shared"
        }
    };

    private readonly ConcurrentDictionary<string, ExplorerItemDto> _items;
    private readonly ITransactionService _transactionService;

    /// <summary>
    /// [TR] Bellek içi gezgin servisini başlatır ve örnek sunucu ile dosya verilerini tohumlar.
    /// [EN] Initializes the in-memory explorer service and seeds sample server and file datasets.
    /// </summary>
    /// <param name="transactionService">İşlem kayıt ve denetim servisi / Transaction recording and audit service</param>
    public InMemoryExplorerService(ITransactionService transactionService)
    {
        _transactionService = transactionService;
        _items = new ConcurrentDictionary<string, ExplorerItemDto>(StringComparer.OrdinalIgnoreCase);
        SeedInitialData();
    }

    public string CanonicalizePath(string path)
    {
        if (string.IsNullOrWhiteSpace(path)) return "/";
        var p = path.Replace('\\', '/').Trim();

        while (p.Contains("//"))
        {
            p = p.Replace("//", "/");
        }

        string drive = string.Empty;
        if (p.Length >= 2 && char.IsLetter(p[0]) && p[1] == ':')
        {
            drive = p.Substring(0, 2);
            p = p.Substring(2);
        }

        bool isAbsolute = p.StartsWith('/');
        var segments = p.Split(new[] { '/' }, StringSplitOptions.RemoveEmptyEntries);
        var stack = new List<string>();

        foreach (var seg in segments)
        {
            if (seg == ".") continue;
            if (seg == "..")
            {
                if (stack.Count > 0)
                {
                    stack.RemoveAt(stack.Count - 1);
                }
            }
            else
            {
                stack.Add(seg);
            }
        }

        var resolved = string.Join('/', stack);
        if (!string.IsNullOrEmpty(drive))
        {
            return string.IsNullOrEmpty(resolved) ? $"{drive}/" : $"{drive}/{resolved}";
        }
        if (isAbsolute)
        {
            return $"/{resolved}";
        }
        return string.IsNullOrEmpty(resolved) ? "/" : resolved;
    }

    private string NormalizePath(string path) => CanonicalizePath(path);

    public bool IsPathWithinRoot(string rootPath, string targetPath)
    {
        if (string.IsNullOrWhiteSpace(rootPath) || string.IsNullOrWhiteSpace(targetPath)) return false;
        var cRoot = CanonicalizePath(rootPath);
        var cTarget = CanonicalizePath(targetPath);

        if (string.Equals(cRoot, cTarget, StringComparison.OrdinalIgnoreCase)) return true;

        var prefix = cRoot.EndsWith('/') ? cRoot : cRoot + "/";
        return cTarget.StartsWith(prefix, StringComparison.OrdinalIgnoreCase);
    }

    private string MakeKey(string serverCode, string path) => $"{serverCode.ToLowerInvariant()}::{CanonicalizePath(path).ToLowerInvariant()}";

    private void AddItem(string serverCode, string path, string name, bool isFolder, long size = 0, string? content = null)
    {
        var normPath = CanonicalizePath(path);
        var parentPath = GetParentPath(normPath);
        var ext = isFolder ? string.Empty : Path.GetExtension(name).TrimStart('.').ToLowerInvariant();

        var item = new ExplorerItemDto
        {
            Id = Guid.NewGuid().ToString(),
            ServerCode = serverCode,
            Name = name,
            Path = normPath,
            ParentPath = parentPath,
            IsFolder = isFolder,
            Extension = ext,
            Size = size,
            ModifiedAt = DateTime.UtcNow.AddHours(-Random.Shared.Next(1, 120)),
            CreatedAt = DateTime.UtcNow.AddDays(-Random.Shared.Next(10, 300)),
            Content = content
        };

        _items[MakeKey(serverCode, normPath)] = item;
    }

    private string GetParentPath(string path)
    {
        var norm = CanonicalizePath(path);
        if (norm == "/" || (norm.Length == 3 && char.IsLetter(norm[0]) && norm[1] == ':' && norm[2] == '/'))
            return string.Empty;

        var lastSlash = norm.LastIndexOf('/');
        if (lastSlash <= 0)
        {
            return norm.Contains(':') ? norm.Substring(0, 3) : "/";
        }
        var parent = norm.Substring(0, lastSlash);
        if (parent.EndsWith(':')) parent += "/";
        return parent;
    }

    private void SeedInitialData()
    {
        // srv-prod-01 (Root: C:/app)
        AddItem("srv-prod-01", "C:/app/backend", "backend", true);
        AddItem("srv-prod-01", "C:/app/backend/appsettings.json", "appsettings.json", false, 824, "{\n  \"Logging\": {\n    \"LogLevel\": {\n      \"Default\": \"Information\"\n    }\n  }\n}");
        AddItem("srv-prod-01", "C:/app/backend/WebExplorer.dll", "WebExplorer.dll", false, 5242880);
        AddItem("srv-prod-01", "C:/app/frontend", "frontend", true);
        AddItem("srv-prod-01", "C:/app/frontend/package.json", "package.json", false, 1240, "{\n  \"name\": \"webexplorer-ui\",\n  \"version\": \"1.0.0\"\n}");
        AddItem("srv-prod-01", "C:/app/frontend/next.config.js", "next.config.js", false, 512, "module.exports = { reactStrictMode: true };");
        AddItem("srv-prod-01", "C:/app/logs", "logs", true);
        AddItem("srv-prod-01", "C:/app/logs/access.log", "access.log", false, 1048576, "2026-09-15 10:00:01 GET / 200 OK\n2026-09-15 10:00:05 GET /api/explorer/servers 200 OK");

        // srv-db-01 (Root: D:/database)
        AddItem("srv-db-01", "D:/database/data", "data", true);
        AddItem("srv-db-01", "D:/database/data/master.mdf", "master.mdf", false, 104857600);
        AddItem("srv-db-01", "D:/database/data/app_primary.mdf", "app_primary.mdf", false, 524288000);
        AddItem("srv-db-01", "D:/database/logs", "logs", true);
        AddItem("srv-db-01", "D:/database/logs/errorlog.txt", "errorlog.txt", false, 124500, "SQL Server is ready for client connections.");
        AddItem("srv-db-01", "D:/database/backups", "backups", true);
        AddItem("srv-db-01", "D:/database/backups/full_backup.bak", "full_backup.bak", false, 209715200);

        // srv-dev-01 (Root: C:/stage)
        AddItem("srv-dev-01", "C:/stage/app", "app", true);
        AddItem("srv-dev-01", "C:/stage/app/server.js", "server.js", false, 2048, "console.log('Stage server running on port 3000');");
        AddItem("srv-dev-01", "C:/stage/config", "config", true);
        AddItem("srv-dev-01", "C:/stage/config/stage.env", "stage.env", false, 320, "NODE_ENV=staging\nPORT=3000");

        // srv-storage-02 (Root: /var/data)
        AddItem("srv-storage-02", "/var/data/uploads", "uploads", true);
        AddItem("srv-storage-02", "/var/data/uploads/avatar_profile.png", "avatar_profile.png", false, 485120);
        AddItem("srv-storage-02", "/var/data/uploads/contract_signed.pdf", "contract_signed.pdf", false, 1250300);
        AddItem("srv-storage-02", "/var/data/exports", "exports", true);
        AddItem("srv-storage-02", "/var/data/exports/users_dump.csv", "users_dump.csv", false, 895000, "id,username,email,role\n1,admin,admin@company.local,SuperAdmin");
        AddItem("srv-storage-02", "/var/data/exports/system_metrics.json", "system_metrics.json", false, 14200, "{\n  \"cpu\": 18.4,\n  \"memory\": 62.1\n}");
        AddItem("srv-storage-02", "/var/data/backups", "backups", true);
        AddItem("srv-storage-02", "/var/data/backups/daily_db_20260912.sql.gz", "daily_db_20260912.sql.gz", false, 45200000);
        AddItem("srv-storage-02", "/var/data/backups/redis_dump.rdb", "redis_dump.rdb", false, 12400000);

        // srv-backup-03 (Root: /backup/archives)
        AddItem("srv-backup-03", "/backup/archives/yearly_2025.tar.gz", "yearly_2025.tar.gz", false, 1500000000);
        AddItem("srv-backup-03", "/backup/archives/audit_logs_2025.zip", "audit_logs_2025.zip", false, 420000000);

        // srv-share-04 (Root: D:/Shared)
        AddItem("srv-share-04", "D:/Shared/Reports", "Reports", true);
        AddItem("srv-share-04", "D:/Shared/Reports/Q3_Summary_2026.pdf", "Q3_Summary_2026.pdf", false, 3450000);
        AddItem("srv-share-04", "D:/Shared/Reports/Financial_Export.xlsx", "Financial_Export.xlsx", false, 1890000);
        AddItem("srv-share-04", "D:/Shared/Documents", "Documents", true);
        AddItem("srv-share-04", "D:/Shared/Documents/Architecture_Guide.docx", "Architecture_Guide.docx", false, 245000);
        AddItem("srv-share-04", "D:/Shared/Documents/README.md", "README.md", false, 2048, "# Shared Storage\n\nAll team documents are stored here.");
    }

    /// <summary>
    /// [TR] Mevcut sunucuları liste olarak döndürür.
    /// [EN] Returns available servers as a list.
    /// </summary>
    public Task<List<ServerDto>> GetServersAsync()
    {
        return Task.FromResult(StaticServers.ToList());
    }

    /// <summary>
    /// [TR] Belirtilen sunucuda verilen yolu tarar, alt öğeleri ve ekmek kırıntılarını döner.
    /// [EN] Browses the given path on the specified server, returning child items and breadcrumbs.
    /// </summary>
    public Task<BrowseResponseDto> BrowseAsync(string serverCode, string path)
    {
        var server = StaticServers.FirstOrDefault(s => string.Equals(s.ServerCode, serverCode, StringComparison.OrdinalIgnoreCase))
            ?? StaticServers[0];

        var serverRoot = CanonicalizePath(server.RootPath);
        var normPath = CanonicalizePath(string.IsNullOrWhiteSpace(path) ? serverRoot : path);

        // Path manipulation / Traversal prevention: Must be strictly inside serverRoot
        if (!IsPathWithinRoot(serverRoot, normPath))
        {
            normPath = serverRoot;
        }

        bool isRoot = string.Equals(normPath, serverRoot, StringComparison.OrdinalIgnoreCase);
        string? parentPath = null;
        if (!isRoot)
        {
            var parentCandidate = GetParentPath(normPath);
            if (IsPathWithinRoot(serverRoot, parentCandidate))
            {
                parentPath = parentCandidate;
            }
            else
            {
                parentPath = serverRoot;
            }
        }

        // Breadcrumbs starting strictly from serverRoot
        var breadcrumbs = new List<PathBreadcrumbItem>
        {
            new PathBreadcrumbItem { Name = serverRoot, Path = serverRoot }
        };

        if (normPath.Length > serverRoot.Length)
        {
            var rel = normPath.Substring(serverRoot.Length).TrimStart('/');
            if (!string.IsNullOrEmpty(rel))
            {
                var parts = rel.Split(new[] { '/' }, StringSplitOptions.RemoveEmptyEntries);
                var accumulated = serverRoot.EndsWith('/') ? serverRoot.TrimEnd('/') : serverRoot;
                foreach (var p in parts)
                {
                    accumulated += "/" + p;
                    breadcrumbs.Add(new PathBreadcrumbItem { Name = p, Path = accumulated });
                }
            }
        }

        // Find direct children
        var children = _items.Values
            .Where(item => string.Equals(item.ServerCode, server.ServerCode, StringComparison.OrdinalIgnoreCase) &&
                           string.Equals(CanonicalizePath(item.ParentPath), normPath, StringComparison.OrdinalIgnoreCase))
            .OrderByDescending(i => i.IsFolder)
            .ThenBy(i => i.Name, StringComparer.OrdinalIgnoreCase)
            .ToList();

        var response = new BrowseResponseDto
        {
            ServerCode = server.ServerCode,
            ServerName = server.Name,
            CurrentPath = normPath,
            ParentPath = parentPath,
            Breadcrumbs = breadcrumbs,
            Items = children,
            TotalFolders = children.Count(i => i.IsFolder),
            TotalFiles = children.Count(i => !i.IsFolder),
            TotalSize = children.Where(i => !i.IsFolder).Sum(i => i.Size)
        };

        return Task.FromResult(response);
    }

    /// <summary>
    /// [TR] Yeni bir dosya veya klasör oluşturur ve işlem geçmişine transaction olarak kaydeder.
    /// [EN] Creates a new file or folder and records it as a transaction in history.
    /// </summary>
    public Task<ExplorerItemDto> CreateItemAsync(CreateItemRequestDto request)
    {
        var server = StaticServers.FirstOrDefault(s => string.Equals(s.ServerCode, request.ServerCode, StringComparison.OrdinalIgnoreCase))
            ?? StaticServers[0];
        var serverRoot = CanonicalizePath(server.RootPath);

        var normDir = CanonicalizePath(request.Path);
        if (!IsPathWithinRoot(serverRoot, normDir))
        {
            throw new InvalidOperationException("Yol manipülasyonu engellendi: Hedef dizin sunucu kök dizini dışındadır.");
        }

        var cleanName = request.Name.Trim();
        if (string.IsNullOrEmpty(cleanName) || cleanName == "." || cleanName == ".." || cleanName.Contains('/') || cleanName.Contains('\\'))
        {
            throw new InvalidOperationException("Geçersiz dosya veya klasör adı.");
        }

        var targetPath = normDir.EndsWith('/') ? $"{normDir}{cleanName}" : $"{normDir}/{cleanName}";
        if (!IsPathWithinRoot(serverRoot, targetPath))
        {
            throw new InvalidOperationException("Yol manipülasyonu engellendi: Oluşturulacak öğe sunucu kök dizini dışına çıkamaz.");
        }

        var key = MakeKey(request.ServerCode, targetPath);
        if (_items.ContainsKey(key))
        {
            throw new InvalidOperationException($"'{cleanName}' bu dizinde zaten mevcut.");
        }

        var ext = request.IsFolder ? string.Empty : Path.GetExtension(cleanName).TrimStart('.').ToLowerInvariant();
        var item = new ExplorerItemDto
        {
            Id = Guid.NewGuid().ToString(),
            ServerCode = request.ServerCode,
            Name = cleanName,
            Path = targetPath,
            ParentPath = normDir,
            IsFolder = request.IsFolder,
            Extension = ext,
            Size = request.IsFolder ? 0 : (request.InitialContent?.Length ?? 0),
            ModifiedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            Content = request.InitialContent
        };

        _items[key] = item;

        _ = _transactionService.RecordAsync(new FileTransaction
        {
            ServerCode = request.ServerCode,
            TransactionType = request.IsFolder ? "CreateFolder" : "CreateFile",
            Path = targetPath,
            ItemName = cleanName,
            IsFolder = request.IsFolder,
            Size = item.Size,
            Status = "Committed",
            Details = $"'{cleanName}' oluşturuldu ({normDir}).",
            PreviousContent = request.InitialContent
        });

        return Task.FromResult(item);
    }

    /// <summary>
    /// [TR] Dosya veya klasör adını günceller, alt elemanların yollarını taşır ve Rename transaction'ı oluşturur.
    /// [EN] Renames a file or folder, cascades path updates to descendants, and logs a Rename transaction.
    /// </summary>
    public Task<ExplorerItemDto> RenameItemAsync(RenameItemRequestDto request)
    {
        var server = StaticServers.FirstOrDefault(s => string.Equals(s.ServerCode, request.ServerCode, StringComparison.OrdinalIgnoreCase))
            ?? StaticServers[0];
        var serverRoot = CanonicalizePath(server.RootPath);

        var oldPath = CanonicalizePath(request.Path);
        if (!IsPathWithinRoot(serverRoot, oldPath))
        {
            throw new InvalidOperationException("Yol manipülasyonu engellendi: Yeniden adlandırılacak öğe kök dizin dışındadır.");
        }
        if (string.Equals(oldPath, serverRoot, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Sunucu kök dizini yeniden adlandırılamaz.");
        }

        var cleanNewName = request.NewName.Trim();
        if (string.IsNullOrEmpty(cleanNewName) || cleanNewName == "." || cleanNewName == ".." || cleanNewName.Contains('/') || cleanNewName.Contains('\\'))
        {
            throw new InvalidOperationException("Geçersiz yeni ad.");
        }

        var oldKey = MakeKey(request.ServerCode, oldPath);
        if (!_items.TryGetValue(oldKey, out var existingItem))
        {
            throw new KeyNotFoundException("Yeniden adlandırılacak öğe bulunamadı.");
        }

        var parent = existingItem.ParentPath;
        var newPath = parent.EndsWith('/') ? $"{parent}{cleanNewName}" : $"{parent}/{cleanNewName}";
        if (!IsPathWithinRoot(serverRoot, newPath))
        {
            throw new InvalidOperationException("Yol manipülasyonu engellendi: Yeni yol kök dizin dışındadır.");
        }

        var newKey = MakeKey(request.ServerCode, newPath);
        if (_items.ContainsKey(newKey))
        {
            throw new InvalidOperationException($"'{cleanNewName}' adında bir dosya veya klasör zaten mevcut.");
        }

        // Remove old item
        _items.TryRemove(oldKey, out _);

        // Update item
        existingItem.Name = cleanNewName;
        existingItem.Path = newPath;
        existingItem.ModifiedAt = DateTime.UtcNow;
        if (!existingItem.IsFolder)
        {
            existingItem.Extension = Path.GetExtension(cleanNewName).TrimStart('.').ToLowerInvariant();
        }

        _items[newKey] = existingItem;

        // If it's a folder, update all child item paths
        if (existingItem.IsFolder)
        {
            var oldPrefix = oldPath + "/";
            var newPrefix = newPath + "/";
            var descendants = _items.Values
                .Where(v => string.Equals(v.ServerCode, request.ServerCode, StringComparison.OrdinalIgnoreCase) &&
                            v.Path.StartsWith(oldPrefix, StringComparison.OrdinalIgnoreCase))
                .ToList();

            foreach (var desc in descendants)
            {
                var descOldKey = MakeKey(request.ServerCode, desc.Path);
                _items.TryRemove(descOldKey, out _);

                var relative = desc.Path.Substring(oldPrefix.Length);
                desc.Path = newPrefix + relative;
                desc.ParentPath = GetParentPath(desc.Path);
                _items[MakeKey(request.ServerCode, desc.Path)] = desc;
            }
        }

        _ = _transactionService.RecordAsync(new FileTransaction
        {
            ServerCode = request.ServerCode,
            TransactionType = "Rename",
            Path = newPath,
            OldPath = oldPath,
            NewPath = newPath,
            ItemName = cleanNewName,
            IsFolder = existingItem.IsFolder,
            Size = existingItem.Size,
            Status = "Committed",
            Details = $"'{oldPath}' -> '{newPath}' olarak yeniden adlandırıldı."
        });

        return Task.FromResult(existingItem);
    }

    /// <summary>
    /// [TR] Belirtilen dosya veya klasörü (tüm alt öğeleriyle birlikte) siler ve Delete transaction'ı kaydeder.
    /// [EN] Deletes the specified file or folder (along with all descendants) and logs a Delete transaction.
    /// </summary>
    public Task<bool> DeleteItemAsync(string serverCode, string path)
    {
        var server = StaticServers.FirstOrDefault(s => string.Equals(s.ServerCode, serverCode, StringComparison.OrdinalIgnoreCase))
            ?? StaticServers[0];
        var serverRoot = CanonicalizePath(server.RootPath);

        var normPath = CanonicalizePath(path);
        if (!IsPathWithinRoot(serverRoot, normPath))
        {
            throw new InvalidOperationException("Yol manipülasyonu engellendi: Silinecek öğe kök dizin dışındadır.");
        }
        if (string.Equals(normPath, serverRoot, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Sunucu kök dizini silinemez.");
        }

        var key = MakeKey(serverCode, normPath);
        if (!_items.TryRemove(key, out var item))
        {
            return Task.FromResult(false);
        }

        // If folder, delete all descendants
        if (item.IsFolder)
        {
            var prefix = normPath + "/";
            var keysToRemove = _items.Values
                .Where(v => string.Equals(v.ServerCode, serverCode, StringComparison.OrdinalIgnoreCase) &&
                            v.Path.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
                .Select(v => MakeKey(serverCode, v.Path))
                .ToList();

            foreach (var k in keysToRemove)
            {
                _items.TryRemove(k, out _);
            }
        }

        _ = _transactionService.RecordAsync(new FileTransaction
        {
            ServerCode = serverCode,
            TransactionType = "Delete",
            Path = normPath,
            ItemName = item.Name,
            IsFolder = item.IsFolder,
            Size = item.Size,
            Status = "Committed",
            Details = $"'{normPath}' {(item.IsFolder ? "klasörü ve tüm alt içeriği" : "dosyası")} silindi.",
            PreviousContent = item.Content
        });

        return Task.FromResult(true);
    }

    /// <summary>
    /// [TR] Çoklu dosya yükleme işlemini gerçekleştirir ve her dosya için Upload transaction'ı üretir.
    /// [EN] Performs multi-file upload operation and generates an Upload transaction for each file.
    /// </summary>
    public async Task<List<ExplorerItemDto>> UploadFilesAsync(string serverCode, string path, List<Microsoft.AspNetCore.Http.IFormFile> files)
    {
        var server = StaticServers.FirstOrDefault(s => string.Equals(s.ServerCode, serverCode, StringComparison.OrdinalIgnoreCase))
            ?? StaticServers[0];
        var serverRoot = CanonicalizePath(server.RootPath);

        var normDir = CanonicalizePath(path);
        if (!IsPathWithinRoot(serverRoot, normDir))
        {
            throw new InvalidOperationException("Yol manipülasyonu engellendi: Yükleme hedefi kök dizin dışındadır.");
        }

        var uploadedItems = new List<ExplorerItemDto>();

        foreach (var file in files)
        {
            if (file == null || file.Length == 0) continue;

            var rawName = Path.GetFileName(file.FileName);
            var cleanName = rawName.Trim();
            if (string.IsNullOrEmpty(cleanName) || cleanName == "." || cleanName == ".." || cleanName.Contains('/') || cleanName.Contains('\\'))
            {
                continue;
            }

            var targetPath = normDir.EndsWith('/') ? $"{normDir}{cleanName}" : $"{normDir}/{cleanName}";
            if (!IsPathWithinRoot(serverRoot, targetPath))
            {
                continue;
            }

            var key = MakeKey(serverCode, targetPath);
            var ext = Path.GetExtension(cleanName).TrimStart('.').ToLowerInvariant();

            string? content = null;
            var textExtensions = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "txt", "log", "json", "xml", "html", "css", "js", "ts", "md", "csv", "sql", "cs", "config", "sh"
            };

            if (textExtensions.Contains(ext) && file.Length < 1024 * 1024 * 5) // max 5MB text preview
            {
                using var reader = new StreamReader(file.OpenReadStream());
                content = await reader.ReadToEndAsync();
            }

            var item = new ExplorerItemDto
            {
                Id = Guid.NewGuid().ToString(),
                ServerCode = serverCode,
                Name = cleanName,
                Path = targetPath,
                ParentPath = normDir,
                IsFolder = false,
                Extension = ext,
                Size = file.Length,
                ModifiedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                Content = content
            };

            _items[key] = item;
            uploadedItems.Add(item);

            _ = _transactionService.RecordAsync(new FileTransaction
            {
                ServerCode = serverCode,
                TransactionType = "Upload",
                Path = targetPath,
                ItemName = cleanName,
                IsFolder = false,
                Size = file.Length,
                Status = "Committed",
                Details = $"'{cleanName}' ({file.Length} byte) '{normDir}' konumuna yüklendi.",
                PreviousContent = content
            });
        }

        return uploadedItems;
    }

    /// <summary>
    /// [TR] Belirtilen sunucuda ve dizin altında joker karakter (wildcard), regex ve yol araması gerçekleştirir.
    /// [EN] Performs wildcard, regex, and path search under the specified directory on the server.
    /// </summary>
    public Task<SearchResultDto> SearchAsync(SearchRequestDto request)
    {
        var sw = Stopwatch.StartNew();

        var server = StaticServers.FirstOrDefault(s => string.Equals(s.ServerCode, request.ServerCode, StringComparison.OrdinalIgnoreCase))
            ?? StaticServers[0];
        var serverRoot = CanonicalizePath(server.RootPath);

        var basePath = CanonicalizePath(string.IsNullOrWhiteSpace(request.Path) ? serverRoot : request.Path);
        if (!IsPathWithinRoot(serverRoot, basePath))
        {
            basePath = serverRoot;
        }

        var query = (request.Query ?? string.Empty).Trim();
        var isRecursive = request.Recursive;
        var isRegex = request.IsRegex;
        var matchPath = request.MatchPath;

        // Auto-detect regex if query starts and ends with '/' e.g. /^doc_.*\.pdf$/i
        if (!isRegex && query.StartsWith('/') && query.Length > 2 && query.EndsWith('/'))
        {
            isRegex = true;
        }

        var candidates = _items.Values
            .Where(item => string.Equals(item.ServerCode, server.ServerCode, StringComparison.OrdinalIgnoreCase))
            .Where(item =>
            {
                var itemPath = CanonicalizePath(item.Path);
                var itemParent = CanonicalizePath(item.ParentPath);

                // Scope checking
                if (isRecursive)
                {
                    return IsPathWithinRoot(basePath, itemPath) &&
                           !string.Equals(itemPath, basePath, StringComparison.OrdinalIgnoreCase);
                }
                else
                {
                    return string.Equals(itemParent, basePath, StringComparison.OrdinalIgnoreCase);
                }
            })
            .Where(item => MatchesQuery(item, basePath, query, isRegex, matchPath))
            .OrderByDescending(i => i.IsFolder)
            .ThenBy(i => i.Name, StringComparer.OrdinalIgnoreCase)
            .ToList();

        sw.Stop();

        var result = new SearchResultDto
        {
            ServerCode = server.ServerCode,
            BasePath = basePath,
            Query = query,
            Items = candidates,
            ElapsedMilliseconds = sw.ElapsedMilliseconds
        };

        return Task.FromResult(result);
    }

    /// <summary>
    /// [TR] Wildcard desenini (*, ?) regex nesnesine dönüştürür.
    /// [EN] Converts wildcard pattern (*, ?) to a regex object.
    /// </summary>
    private static Regex CreateWildcardRegex(string wildcard)
    {
        if (wildcard == "*.*")
        {
            return new Regex(@"^.+\..+$|^.+$", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);
        }

        var escaped = Regex.Escape(wildcard)
            .Replace(@"\*", ".*")
            .Replace(@"\?", ".");

        return new Regex($"^{escaped}$", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);
    }

    /// <summary>
    /// [TR] Bir öğenin arama sorgusuyla (wildcard, regex veya alt dize) eşleşip eşleşmediğini kontrol eder.
    /// [EN] Checks if an item matches the search query (wildcard, regex, or substring).
    /// </summary>
    private static bool MatchesQuery(ExplorerItemDto item, string baseDir, string query, bool isRegex, bool matchPath)
    {
        if (string.IsNullOrWhiteSpace(query))
            return true;

        var name = item.Name;
        var relPath = item.Path.StartsWith(baseDir, StringComparison.OrdinalIgnoreCase)
            ? item.Path.Substring(baseDir.Length).TrimStart('/')
            : item.Path;

        if (isRegex)
        {
            try
            {
                var cleanPattern = query;
                if (cleanPattern.StartsWith('/') && cleanPattern.Length > 2 && cleanPattern.EndsWith('/'))
                {
                    cleanPattern = cleanPattern.Substring(1, cleanPattern.Length - 2);
                }
                var rx = new Regex(cleanPattern, RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);
                if (rx.IsMatch(name)) return true;
                if (matchPath && rx.IsMatch(relPath)) return true;
                return false;
            }
            catch
            {
                return name.Contains(query, StringComparison.OrdinalIgnoreCase) ||
                       (matchPath && relPath.Contains(query, StringComparison.OrdinalIgnoreCase));
            }
        }

        if (query.Contains('*') || query.Contains('?'))
        {
            try
            {
                var rx = CreateWildcardRegex(query);
                if (rx.IsMatch(name)) return true;
                if (matchPath && rx.IsMatch(relPath)) return true;
                return false;
            }
            catch
            {
                // Ignore fallback to substring
            }
        }

        return name.Contains(query, StringComparison.OrdinalIgnoreCase) ||
               (matchPath && relPath.Contains(query, StringComparison.OrdinalIgnoreCase));
    }
}
