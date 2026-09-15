using System;
using System.Collections.Generic;

namespace WebExplorer.Api.Models;

/// <summary>
/// [TR] Sunucu Bilgisi DTO: Explorer üzerinde yönetilen uzak veya yerel sunucunun temel özelliklerini taşır.
/// [EN] Server Information DTO: Carries essential properties of a remote or local server managed on the explorer.
/// </summary>
public class ServerDto
{
    /// <summary>
    /// [TR] Benzersiz sunucu kodu
    /// [EN] Unique server code
    /// </summary>
    public string ServerCode { get; set; } = string.Empty;

    /// <summary>
    /// [TR] Geriye dönük uyumluluk için Id takma adı
    /// [EN] Id alias for backward compatibility
    /// </summary>
    public string Id { get => ServerCode; set => ServerCode = value; }

    /// <summary>
    /// [TR] Sunucunun görünen adı
    /// [EN] Display name of the server
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// [TR] Sunucu ana makine adresi veya IP bilgisi
    /// [EN] Server host address or IP information
    /// </summary>
    public string Host { get; set; } = string.Empty;

    /// <summary>
    /// [TR] Sunucu çalışma ortamı türü (kullanıcı arayüzünde gizlenmiş veya genel tanımlayıcı)
    /// [EN] Server runtime environment type (hidden from UI or generic descriptor)
    /// </summary>
    public string OsType { get; set; } = string.Empty;

    /// <summary>
    /// [TR] Sunucu bağlantı durumu (Online, Standby, Maintenance vb.)
    /// [EN] Server connection status (Online, Standby, Maintenance, etc.)
    /// </summary>
    public string Status { get; set; } = "Online";

    /// <summary>
    /// [TR] Sunucunun tekil kök dizini
    /// [EN] Single root directory of the server
    /// </summary>
    public string RootPath { get; set; } = string.Empty;
}

/// <summary>
/// [TR] Gezgin Dosya/Klasör Öğesi DTO: Dizin listelemelerinde her bir dosya veya klasörün meta verilerini ve içeriğini temsil eder.
/// [EN] Explorer Item DTO: Represents metadata and preview content of each file or folder in directory listings.
/// </summary>
public class ExplorerItemDto
{
    /// <summary>
    /// [TR] Öğenin benzersiz kimliği
    /// [EN] Unique identifier of the item
    /// </summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// [TR] Öğenin ait olduğu sunucu kimliği
    /// [EN] Server identifier to which the item belongs
    /// </summary>
    public string ServerCode { get; set; } = string.Empty;

    /// <summary>
    /// [TR] Dosya veya klasörün adı
    /// [EN] Name of the file or folder
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// [TR] Öğenin tam dosya sistemi yolu
    /// [EN] Full filesystem path of the item
    /// </summary>
    public string Path { get; set; } = string.Empty;

    /// <summary>
    /// [TR] Öğenin üst dizin yolu
    /// [EN] Parent directory path of the item
    /// </summary>
    public string ParentPath { get; set; } = string.Empty;

    /// <summary>
    /// [TR] Öğenin klasör olup olmadığını belirtir
    /// [EN] Indicates whether the item is a folder
    /// </summary>
    public bool IsFolder { get; set; }

    /// <summary>
    /// [TR] Dosya uzantısı (.txt, .json, vb.)
    /// [EN] File extension (.txt, .json, etc.)
    /// </summary>
    public string Extension { get; set; } = string.Empty;

    /// <summary>
    /// [TR] Dosya boyutu (bayt cinsinden)
    /// [EN] File size in bytes
    /// </summary>
    public long Size { get; set; }

    /// <summary>
    /// [TR] Son değiştirilme tarihi ve saati
    /// [EN] Last modification date and time
    /// </summary>
    public DateTime ModifiedAt { get; set; }

    /// <summary>
    /// [TR] Oluşturulma tarihi ve saati
    /// [EN] Creation date and time
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// [TR] Önizleme veya düzenleme için metin tabanlı dosya içeriği
    /// [EN] Text-based file content for preview or editing
    /// </summary>
    public string? Content { get; set; }
}

/// <summary>
/// [TR] Dizin Ekmek Kırıntısı (Breadcrumb) DTO: Adres çubuğundaki hiyerarşik yol parçacıklarını temsil eder.
/// [EN] Directory Breadcrumb DTO: Represents hierarchical path segments in the address bar.
/// </summary>
public class PathBreadcrumbItem
{
    /// <summary>
    /// [TR] Yol segmentinin adı
    /// [EN] Name of the path segment
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// [TR] Segmentin tam yolu
    /// [EN] Full path of the segment
    /// </summary>
    public string Path { get; set; } = string.Empty;
}

/// <summary>
/// [TR] Dizin Gezinme Yanıt DTO: Seçili yoldaki dosya ve klasörleri, ekmek kırıntılarını ve istatistikleri içerir.
/// [EN] Directory Browse Response DTO: Contains files, folders, breadcrumbs, and statistics for the selected path.
/// </summary>
public class BrowseResponseDto
{
    /// <summary>
    /// [TR] Sunucu kimliği
    /// [EN] Server identifier
    /// </summary>
    public string ServerCode { get; set; } = string.Empty;

    /// <summary>
    /// [TR] Sunucu adı
    /// [EN] Server name
    /// </summary>
    public string ServerName { get; set; } = string.Empty;

    /// <summary>
    /// [TR] Geçerli taranan dizin yolu
    /// [EN] Currently browsed directory path
    /// </summary>
    public string CurrentPath { get; set; } = string.Empty;

    /// <summary>
    /// [TR] Üst dizin yolu (varsa)
    /// [EN] Parent directory path if available
    /// </summary>
    public string? ParentPath { get; set; }

    /// <summary>
    /// [TR] Hiyerarşik yol segmentleri
    /// [EN] Hierarchical path segments
    /// </summary>
    public List<PathBreadcrumbItem> Breadcrumbs { get; set; } = new();

    /// <summary>
    /// [TR] Dizin içerisindeki dosya ve klasör listesi
    /// [EN] List of files and folders in the directory
    /// </summary>
    public List<ExplorerItemDto> Items { get; set; } = new();

    /// <summary>
    /// [TR] Dizindeki toplam klasör sayısı
    /// [EN] Total number of folders in the directory
    /// </summary>
    public int TotalFolders { get; set; }

    /// <summary>
    /// [TR] Dizindeki toplam dosya sayısı
    /// [EN] Total number of files in the directory
    /// </summary>
    public int TotalFiles { get; set; }

    /// <summary>
    /// [TR] Dizindeki toplam dosya boyutu (bayt)
    /// [EN] Total file size in bytes in the directory
    /// </summary>
    public long TotalSize { get; set; }
}

/// <summary>
/// [TR] Yeni Öğe Oluşturma İstek DTO: Yeni bir dosya veya klasör oluşturma parametrelerini içerir.
/// [EN] Create Item Request DTO: Contains parameters for creating a new file or folder.
/// </summary>
public class CreateItemRequestDto
{
    /// <summary>
    /// [TR] Hedef sunucu kimliği
    /// [EN] Target server identifier
    /// </summary>
    public string ServerCode { get; set; } = string.Empty;

    /// <summary>
    /// [TR] Yeni öğenin oluşturulacağı üst dizin yolu
    /// [EN] Parent directory path where the new item will be created
    /// </summary>
    public string Path { get; set; } = string.Empty;

    /// <summary>
    /// [TR] Oluşturulacak yeni dosya veya klasörün adı
    /// [EN] Name of the new file or folder to be created
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// [TR] Öğenin klasör olup olmadığını belirtir (true: klasör, false: dosya)
    /// [EN] Indicates whether the item is a folder (true: folder, false: file)
    /// </summary>
    public bool IsFolder { get; set; }

    /// <summary>
    /// [TR] Dosya ise isteğe bağlı başlangıç metin içeriği
    /// [EN] Optional initial text content if creating a file
    /// </summary>
    public string? InitialContent { get; set; }
}

/// <summary>
/// [TR] Yeniden Adlandırma İstek DTO: Mevcut bir dosya veya klasörün adını değiştirmek için kullanılır.
/// [EN] Rename Item Request DTO: Used to rename an existing file or folder.
/// </summary>
public class RenameItemRequestDto
{
    /// <summary>
    /// [TR] Hedef sunucu kimliği
    /// [EN] Target server identifier
    /// </summary>
    public string ServerCode { get; set; } = string.Empty;

    /// <summary>
    /// [TR] Yeniden adlandırılacak öğenin mevcut tam yolu
    /// [EN] Current full path of the item to be renamed
    /// </summary>
    public string Path { get; set; } = string.Empty;

    /// <summary>
    /// [TR] Verilecek yeni ad
    /// [EN] New name to assign
    /// </summary>
    public string NewName { get; set; } = string.Empty;
}

/// <summary>
/// [TR] Öğe Silme İstek DTO: Bir dosya veya klasörü silmek için gereken bilgileri taşır.
/// [EN] Delete Item Request DTO: Carries information required to delete a file or folder.
/// </summary>
public class DeleteItemRequestDto
{
    /// <summary>
    /// [TR] Hedef sunucu kimliği
    /// [EN] Target server identifier
    /// </summary>
    public string ServerCode { get; set; } = string.Empty;

    /// <summary>
    /// [TR] Silinecek dosya veya klasörün tam yolu
    /// [EN] Full path of the file or folder to be deleted
    /// </summary>
    public string Path { get; set; } = string.Empty;
}

/// <summary>
/// [TR] Standart API Yanıt Sarmalayıcı: Başarı durumu, mesaj ve veri yükünü standart formatta döndürür.
/// [EN] Standard API Response Wrapper: Returns success status, message, and data payload in a unified format.
/// </summary>
/// <typeparam name="T">Veri yükünün türü / Type of the data payload</typeparam>
public class ApiResponse<T>
{
    /// <summary>
    /// [TR] İşlemin başarılı olup olmadığını belirtir
    /// [EN] Indicates whether the operation succeeded
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// [TR] İşlem sonucu bilgilendirme veya hata mesajı
    /// [EN] Information or error message regarding the operation result
    /// </summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// [TR] Yanıt verisi yükü
    /// [EN] Response data payload
    /// </summary>
    public T? Data { get; set; }

    /// <summary>
    /// [TR] Başarılı yanıt fabrikası metodu
    /// [EN] Factory method for successful response
    /// </summary>
    public static ApiResponse<T> Ok(T data, string message = "Success") => new()
    {
        Success = true,
        Message = message,
        Data = data
    };

    /// <summary>
    /// [TR] Başarısız yanıt fabrikası metodu
    /// [EN] Factory method for failed response
    /// </summary>
    public static ApiResponse<T> Fail(string message) => new()
    {
        Success = false,
        Message = message,
        Data = default
    };
}

/// <summary>
/// [TR] Arama İsteği DTO: Dosya/klasör arama parametrelerini (wildcard, regex, recursive vb.) içerir.
/// [EN] Search Request DTO: Contains file/folder search parameters (wildcard, regex, recursive, etc.).
/// </summary>
public class SearchRequestDto
{
    /// <summary>
    /// [TR] Hedef sunucu kimliği
    /// [EN] Target server identifier
    /// </summary>
    public string ServerCode { get; set; } = string.Empty;

    /// <summary>
    /// [TR] Aramanın başlatılacağı kök/başlangıç dizin yolu
    /// [EN] Root or base directory path where search begins
    /// </summary>
    public string Path { get; set; } = string.Empty;

    /// <summary>
    /// [TR] Arama terimi, wildcard (*.*, *.cs) veya regex deseni
    /// [EN] Search query, wildcard (*.*, *.cs), or regex pattern
    /// </summary>
    public string Query { get; set; } = string.Empty;

    /// <summary>
    /// [TR] Alt dizinlerin de taranıp taranmayacağını belirtir (true: recursive, false: yalnızca mevcut dizin)
    /// [EN] Specifies whether subdirectories should be included (true: recursive, false: current folder only)
    /// </summary>
    public bool Recursive { get; set; } = true;

    /// <summary>
    /// [TR] Sorgunun doğrudan regex olarak işlenip işlenmeyeceği
    /// [EN] Whether the query should be evaluated directly as regex
    /// </summary>
    public bool IsRegex { get; set; } = false;

    /// <summary>
    /// [TR] Yol üzerinde de arama yapılıp yapılmayacağı (dosya adına ek olarak)
    /// [EN] Whether to match against path as well as filename
    /// </summary>
    public bool MatchPath { get; set; } = true;
}

/// <summary>
/// [TR] Arama Yanıtı DTO: Bulunan dosya ve klasörlerin listesi ve arama istatistiklerini içerir.
/// [EN] Search Result DTO: Contains matched files and folders along with search statistics.
/// </summary>
public class SearchResultDto
{
    /// <summary>
    /// [TR] Sunucu kimliği
    /// [EN] Server identifier
    /// </summary>
    public string ServerCode { get; set; } = string.Empty;

    /// <summary>
    /// [TR] Aramanın yapıldığı başlangıç yolu
    /// [EN] Base path where search was executed
    /// </summary>
    public string BasePath { get; set; } = string.Empty;

    /// <summary>
    /// [TR] Kullanılan arama sorgusu
    /// [EN] Search query used
    /// </summary>
    public string Query { get; set; } = string.Empty;

    /// <summary>
    /// [TR] Eşleşen dosya ve klasör listesi
    /// [EN] List of matched files and folders
    /// </summary>
    public List<ExplorerItemDto> Items { get; set; } = new();

    /// <summary>
    /// [TR] Toplam eşleşen öğe sayısı
    /// [EN] Total matched items count
    /// </summary>
    public int TotalMatches => Items.Count;

    /// <summary>
    /// [TR] Arama yürütme süresi (milisaniye)
    /// [EN] Search execution duration in milliseconds
    /// </summary>
    public long ElapsedMilliseconds { get; set; }
}

