using System;

namespace WebExplorer.Api.Models;

/// <summary>
/// [TR] Dosya Manipülasyon Transaction Modeli: Dosya ve klasörler üzerinde gerçekleştirilen ekleme, silme, adlandırma ve yükleme işlemlerini denetim (audit) ve geri alma amacıyla saklar.
/// [EN] File Manipulation Transaction Model: Stores creation, deletion, rename, and upload operations performed on files and folders for audit and rollback purposes.
/// </summary>
public class FileTransaction
{
    /// <summary>
    /// [TR] Benzersiz işlem kimliği (GUID)
    /// [EN] Unique transaction identifier (GUID)
    /// </summary>
    public string Id { get; set; } = Guid.NewGuid().ToString();

    /// <summary>
    /// [TR] İşlemin yapıldığı hedef sunucu kodu
    /// [EN] Target server code where the operation took place
    /// </summary>
    public string ServerCode { get; set; } = string.Empty;

    /// <summary>
    /// [TR] İşlem türü (CreateFile, CreateFolder, Rename, Delete, Upload)
    /// [EN] Transaction type (CreateFile, CreateFolder, Rename, Delete, Upload)
    /// </summary>
    public string TransactionType { get; set; } = string.Empty;

    /// <summary>
    /// [TR] İşlem yapılan hedef dosya veya klasör yolu
    /// [EN] Target file or folder path of the operation
    /// </summary>
    public string Path { get; set; } = string.Empty;

    /// <summary>
    /// [TR] Yeniden adlandırma öncesindeki eski yol
    /// [EN] Old path prior to rename operation
    /// </summary>
    public string? OldPath { get; set; }

    /// <summary>
    /// [TR] Yeniden adlandırma sonrasındaki yeni yol
    /// [EN] New path after rename operation
    /// </summary>
    public string? NewPath { get; set; }

    /// <summary>
    /// [TR] Dosya veya klasörün adı
    /// [EN] Name of the file or folder
    /// </summary>
    public string ItemName { get; set; } = string.Empty;

    /// <summary>
    /// [TR] Öğenin klasör olup olmadığını belirtir
    /// [EN] Indicates whether the item is a folder
    /// </summary>
    public bool IsFolder { get; set; }

    /// <summary>
    /// [TR] Dosya boyutu (byte)
    /// [EN] File size in bytes
    /// </summary>
    public long Size { get; set; }

    /// <summary>
    /// [TR] Transaction durumu (Committed, Failed, RolledBack)
    /// [EN] Transaction status (Committed, Failed, RolledBack)
    /// </summary>
    public string Status { get; set; } = "Committed";

    /// <summary>
    /// [TR] İşlemin gerçekleştiği UTC zaman damgası
    /// [EN] UTC timestamp when the operation occurred
    /// </summary>
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// [TR] İşlemle ilgili açıklayıcı detay metni
    /// [EN] Descriptive detail text regarding the operation
    /// </summary>
    public string Details { get; set; } = string.Empty;

    /// <summary>
    /// [TR] Metin dosyalarında silinmeden veya değiştirilmeden önceki içerik yedeği
    /// [EN] Backup of content prior to deletion or modification for text files
    /// </summary>
    public string? PreviousContent { get; set; }
}
