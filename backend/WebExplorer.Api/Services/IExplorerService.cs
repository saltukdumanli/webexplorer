using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using WebExplorer.Api.Models;

namespace WebExplorer.Api.Services;

/// <summary>
/// [TR] Dosya Gezgini Servisi Arayüzü: Sunucu listeleme, dizin tarama ve dosya/klasör CRUD operasyonlarını tanımlar.
/// [EN] File Explorer Service Interface: Defines server listing, directory browsing, and file/folder CRUD operations.
/// </summary>
public interface IExplorerService
{
    /// <summary>
    /// [TR] Sistemde tanımlı sunucuların listesini getirir.
    /// [EN] Retrieves the list of servers configured in the system.
    /// </summary>
    Task<List<ServerDto>> GetServersAsync();

    /// <summary>
    /// [TR] Belirtilen sunucuda verilen dizin yolunu tarar ve alt öğeleri döner.
    /// [EN] Browses the given directory path on the specified server and returns child items.
    /// </summary>
    /// <param name="serverCode">Sunucu kodu / Server code</param>
    /// <param name="path">Taranacak dizin yolu / Directory path to browse</param>
    Task<BrowseResponseDto> BrowseAsync(string serverCode, string path);

    /// <summary>
    /// [TR] Yeni bir dosya veya klasör oluşturur ve işlem kaydı oluşturur.
    /// [EN] Creates a new file or folder and logs the transaction.
    /// </summary>
    /// <param name="request">Oluşturma istek modeli / Creation request model</param>
    Task<ExplorerItemDto> CreateItemAsync(CreateItemRequestDto request);

    /// <summary>
    /// [TR] Mevcut bir dosya veya klasörü yeniden adlandırır ve işlem kaydı oluşturur.
    /// [EN] Renames an existing file or folder and logs the transaction.
    /// </summary>
    /// <param name="request">Yeniden adlandırma istek modeli / Rename request model</param>
    Task<ExplorerItemDto> RenameItemAsync(RenameItemRequestDto request);

    /// <summary>
    /// [TR] Belirtilen dosya veya klasörü siler ve işlem kaydı oluşturur.
    /// [EN] Deletes the specified file or folder and logs the transaction.
    /// </summary>
    /// <param name="serverCode">Sunucu kodu / Server code</param>
    /// <param name="path">Silinecek öğenin tam yolu / Full path of item to delete</param>
    Task<bool> DeleteItemAsync(string serverCode, string path);

    /// <summary>
    /// [TR] Belirtilen dizine dosya yüklemelerini gerçekleştirir ve her biri için işlem kaydı oluşturur.
    /// [EN] Performs file uploads to the specified directory and logs a transaction for each file.
    /// </summary>
    /// <param name="serverCode">Sunucu kodu / Server code</param>
    /// <param name="path">Hedef yükleme dizini / Target upload directory</param>
    /// <param name="files">Yüklenecek form dosyaları / Form files to upload</param>
    Task<List<ExplorerItemDto>> UploadFilesAsync(string serverCode, string path, List<IFormFile> files);

    /// <summary>
    /// [TR] Belirtilen sunucuda ve dizin altında joker karakter (wildcard), regex ve yol araması gerçekleştirir.
    /// [EN] Performs wildcard, regex, and path search under the specified directory on the server.
    /// </summary>
    /// <param name="request">Arama istek modeli / Search request model</param>
    Task<SearchResultDto> SearchAsync(SearchRequestDto request);
}

