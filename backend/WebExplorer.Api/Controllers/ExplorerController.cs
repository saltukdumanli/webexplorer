using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using WebExplorer.Api.Models;
using WebExplorer.Api.Services;

namespace WebExplorer.Api.Controllers;

/// <summary>
/// [TR] Dosya Gezgini API Denetleyicisi: Sunucu listeleme, dosya/klasör gezintisi, CRUD işlemleri ve işlem geçmişi uç noktalarını sağlar.
/// [EN] File Explorer API Controller: Provides endpoints for server listing, file/folder navigation, CRUD operations, and transaction audit logs.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class ExplorerController : ControllerBase
{
    private readonly IExplorerService _explorerService;
    private readonly ITransactionService _transactionService;

    /// <summary>
    /// [TR] Gezgin denetleyicisini bağımlılıklarla başlatır.
    /// [EN] Initializes the explorer controller with dependencies.
    /// </summary>
    public ExplorerController(IExplorerService explorerService, ITransactionService transactionService)
    {
        _explorerService = explorerService;
        _transactionService = transactionService;
    }

    /// <summary>
    /// [TR] Tanımlı sunucuları listeler: GET /api/explorer/servers
    /// [EN] Lists configured servers: GET /api/explorer/servers
    /// </summary>
    [HttpGet("servers")]
    public async Task<IActionResult> GetServers()
    {
        var servers = await _explorerService.GetServersAsync();
        return Ok(ApiResponse<object>.Ok(servers));
    }

    /// <summary>
    /// [TR] Belirtilen sunucuda dizin içeriğini tarar: GET /api/explorer/browse?serverCode=...&amp;path=...
    /// [EN] Browses directory content on specified server: GET /api/explorer/browse?serverCode=...&amp;path=...
    /// </summary>
    [HttpGet("browse")]
    public async Task<IActionResult> Browse([FromQuery] string serverCode, [FromQuery] string? path = "")
    {
        if (string.IsNullOrWhiteSpace(serverCode))
        {
            return BadRequest(ApiResponse<object>.Fail("ServerCode zorunludur."));
        }

        try
        {
            var result = await _explorerService.BrowseAsync(serverCode, path ?? string.Empty);
            return Ok(ApiResponse<BrowseResponseDto>.Ok(result));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }

    /// <summary>
    /// [TR] Sunucuda gelişmiş dosya/klasör araması yapar (wildcard *.*, regex, recursive): GET /api/explorer/search
    /// [EN] Performs advanced file/folder search on server (wildcard *.*, regex, recursive): GET /api/explorer/search
    /// </summary>
    [HttpGet("search")]
    public async Task<IActionResult> Search(
        [FromQuery] string serverCode,
        [FromQuery] string? path = "",
        [FromQuery] string? query = "",
        [FromQuery] bool recursive = true,
        [FromQuery] bool isRegex = false,
        [FromQuery] bool matchPath = true)
    {
        if (string.IsNullOrWhiteSpace(serverCode))
        {
            return BadRequest(ApiResponse<object>.Fail("ServerCode zorunludur."));
        }

        try
        {
            var request = new SearchRequestDto
            {
                ServerCode = serverCode,
                Path = path ?? string.Empty,
                Query = query ?? string.Empty,
                Recursive = recursive,
                IsRegex = isRegex,
                MatchPath = matchPath
            };

            var result = await _explorerService.SearchAsync(request);
            return Ok(ApiResponse<SearchResultDto>.Ok(result));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }

    /// <summary>
    /// [TR] Yeni bir dosya veya klasör oluşturur: POST /api/explorer/item
    /// [EN] Creates a new file or folder: POST /api/explorer/item
    /// </summary>
    [HttpPost("item")]
    public async Task<IActionResult> CreateItem([FromBody] CreateItemRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.ServerCode) || string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest(ApiResponse<object>.Fail("Sunucu ve öğe adı gereklidir."));
        }

        try
        {
            var item = await _explorerService.CreateItemAsync(request);
            return Ok(ApiResponse<ExplorerItemDto>.Ok(item, "Öğe başarıyla oluşturuldu."));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }

    /// <summary>
    /// [TR] Bir dosya veya klasörü yeniden adlandırır: PUT /api/explorer/rename
    /// [EN] Renames a file or folder: PUT /api/explorer/rename
    /// </summary>
    [HttpPut("rename")]
    public async Task<IActionResult> RenameItem([FromBody] RenameItemRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.ServerCode) || string.IsNullOrWhiteSpace(request.Path) || string.IsNullOrWhiteSpace(request.NewName))
        {
            return BadRequest(ApiResponse<object>.Fail("Geçersiz istek parametreleri."));
        }

        try
        {
            var item = await _explorerService.RenameItemAsync(request);
            return Ok(ApiResponse<ExplorerItemDto>.Ok(item, "Yeniden adlandırma başarılı."));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }

    /// <summary>
    /// [TR] Belirtilen dosya veya klasörü siler: DELETE /api/explorer/item?serverCode=...&amp;path=...
    /// [EN] Deletes the specified file or folder: DELETE /api/explorer/item?serverCode=...&amp;path=...
    /// </summary>
    [HttpDelete("item")]
    public async Task<IActionResult> DeleteItem([FromQuery] string serverCode, [FromQuery] string path)
    {
        if (string.IsNullOrWhiteSpace(serverCode) || string.IsNullOrWhiteSpace(path))
        {
            return BadRequest(ApiResponse<object>.Fail("Sunucu ve dosya yolu zorunludur."));
        }

        try
        {
            var success = await _explorerService.DeleteItemAsync(serverCode, path);
            if (!success)
            {
                return NotFound(ApiResponse<object>.Fail("Silinecek öğe bulunamadı."));
            }
            return Ok(ApiResponse<bool>.Ok(true, "Öğe başarıyla silindi."));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }

    /// <summary>
    /// [TR] Çoklu dosya yükleme uç noktası: POST /api/explorer/upload (multipart/form-data)
    /// [EN] Multi-file upload endpoint: POST /api/explorer/upload (multipart/form-data)
    /// </summary>
    [HttpPost("upload")]
    public async Task<IActionResult> UploadFiles([FromForm] string serverCode, [FromForm] string path, [FromForm] List<Microsoft.AspNetCore.Http.IFormFile> files)
    {
        if (string.IsNullOrWhiteSpace(serverCode) || string.IsNullOrWhiteSpace(path))
        {
            return BadRequest(ApiResponse<object>.Fail("Sunucu ve hedef yol zorunludur."));
        }

        if (files == null || files.Count == 0)
        {
            return BadRequest(ApiResponse<object>.Fail("Yüklenecek dosya seçilmedi."));
        }

        try
        {
            var uploaded = await _explorerService.UploadFilesAsync(serverCode, path, files);
            return Ok(ApiResponse<List<ExplorerItemDto>>.Ok(uploaded, $"{uploaded.Count} dosya başarıyla yüklendi."));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }

    /// <summary>
    /// [TR] Dosya manipülasyon işlem geçmişini listeler: GET /api/explorer/transactions?serverCode=...&amp;limit=...
    /// [EN] Lists file manipulation transaction audit history: GET /api/explorer/transactions?serverCode=...&amp;limit=...
    /// </summary>
    [HttpGet("transactions")]
    public async Task<IActionResult> GetTransactions(
        [FromQuery] string? serverCode = null,
        [FromQuery] string? search = null,
        [FromQuery] int limit = 1000)
    {
        try
        {
            var transactions = await _transactionService.GetAllAsync(serverCode, search, limit);
            return Ok(ApiResponse<object>.Ok(transactions));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }
}
