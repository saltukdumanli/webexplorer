using System.Collections.Generic;
using System.Threading.Tasks;
using WebExplorer.Api.Models;

namespace WebExplorer.Api.Services;

/// <summary>
/// [TR] Dosya İşlem Log / Transaction Servisi Arayüzü: Dosya ve dizin değişikliklerini kaydetme, listeleme ve sorgulama kontratı.
/// [EN] File Transaction / Audit Service Interface: Contract for recording, listing, and querying file and directory manipulation operations.
/// </summary>
public interface ITransactionService
{
    /// <summary>
    /// [TR] Yeni bir dosya manipülasyon işlemini kaydeder ve kalıcı hale getirir.
    /// [EN] Records a new file manipulation transaction and persists it.
    /// </summary>
    /// <param name="transaction">Kaydedilecek işlem nesnesi / Transaction object to record</param>
    /// <returns>Kaydedilen işlem kaydı / The recorded transaction record</returns>
    Task<FileTransaction> RecordAsync(FileTransaction transaction);

    /// <summary>
    /// [TR] Kayıtlı tüm işlemleri filtreleme, arama ve limit parametreleriyle listeler (en fazla 1000 kayıt).
    /// [EN] Lists all recorded transactions with filtering, search, and limit parameters (max 1000 records).
    /// </summary>
    /// <param name="serverCode">İsteğe bağlı sunucu kodu filtresi / Optional server code filter</param>
    /// <param name="search">İsteğe bağlı metin arama filtresi / Optional text search filter</param>
    /// <param name="limit">Döndürülecek maksimum kayıt sayısı (en fazla 1000) / Maximum number of records to return (max 1000)</param>
    /// <returns>İşlem kayıtları listesi / List of transaction records</returns>
    Task<List<FileTransaction>> GetAllAsync(string? serverCode = null, string? search = null, int limit = 1000);

    /// <summary>
    /// [TR] Belirtilen kimliğe sahip işlem kaydını getirir.
    /// [EN] Retrieves the transaction record with the specified identifier.
    /// </summary>
    /// <param name="id">İşlem kimliği / Transaction identifier</param>
    /// <returns>Bulunan işlem veya null / Found transaction or null</returns>
    Task<FileTransaction?> GetByIdAsync(string id);
}

