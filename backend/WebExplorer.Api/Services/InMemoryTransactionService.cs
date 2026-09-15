using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using WebExplorer.Api.Models;

namespace WebExplorer.Api.Services;

/// <summary>
/// [TR] Bellek İçi ve JSON Dosya Tabanlı Transaction Servisi: Dosya manipülasyon kayıtlarını RAM'de eşzamanlı tutar ve App_Data/file_transactions.json dosyasına yazarak kalıcılık sağlar.
/// [EN] In-Memory and JSON File-Based Transaction Service: Holds file manipulation logs concurrently in memory and persists them to App_Data/file_transactions.json.
/// </summary>
public class InMemoryTransactionService : ITransactionService
{
    private readonly ConcurrentBag<FileTransaction> _transactions = new();
    private readonly string _logFilePath;
    private readonly object _fileLock = new();

    /// <summary>
    /// [TR] Servis örneği oluşturur ve App_Data altındaki geçmiş işlem kayıtlarını yükler.
    /// [EN] Initializes a new service instance and loads historical transaction records from App_Data.
    /// </summary>
    public InMemoryTransactionService()
    {
        var appData = Path.Combine(AppContext.BaseDirectory, "App_Data");
        Directory.CreateDirectory(appData);
        _logFilePath = Path.Combine(appData, "file_transactions.json");

        LoadTransactionsFromFile();
    }

    private void LoadTransactionsFromFile()
    {
        try
        {
            if (File.Exists(_logFilePath))
            {
                var json = File.ReadAllText(_logFilePath);
                var items = JsonSerializer.Deserialize<List<FileTransaction>>(json);
                if (items != null)
                {
                    foreach (var item in items.OrderBy(i => i.Timestamp))
                    {
                        _transactions.Add(item);
                    }
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Transactions could not be loaded from file: {ex.Message}");
        }
    }

    private void SaveTransactionsToFile()
    {
        try
        {
            lock (_fileLock)
            {
                var list = _transactions.OrderByDescending(t => t.Timestamp).ToList();
                var json = JsonSerializer.Serialize(list, new JsonSerializerOptions { WriteIndented = true });
                File.WriteAllText(_logFilePath, json);
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Transactions could not be written to file: {ex.Message}");
        }
    }

    /// <summary>
    /// [TR] Yeni bir işlemi ConcurrentBag listesine ekler ve JSON dosyasına kaydeder.
    /// [EN] Appends a new transaction to the ConcurrentBag and saves to JSON file.
    /// </summary>
    public Task<FileTransaction> RecordAsync(FileTransaction transaction)
    {
        if (string.IsNullOrWhiteSpace(transaction.Id))
        {
            transaction.Id = Guid.NewGuid().ToString();
        }

        if (transaction.Timestamp == default)
        {
            transaction.Timestamp = DateTime.UtcNow;
        }

        _transactions.Add(transaction);
        SaveTransactionsToFile();

        return Task.FromResult(transaction);
    }

    /// <summary>
    /// [TR] Filtrelenmiş, aranmış ve tarihe göre azalan sırada sıralanmış işlem listesini getirir (en fazla 1000 kayıt).
    /// [EN] Retrieves the filtered, searched transaction list ordered by timestamp descending (max 1000 records).
    /// </summary>
    public Task<List<FileTransaction>> GetAllAsync(string? serverCode = null, string? search = null, int limit = 1000)
    {
        var safeLimit = Math.Clamp(limit, 1, 1000);
        var query = _transactions.AsEnumerable();

        if (!string.IsNullOrWhiteSpace(serverCode) && !string.Equals(serverCode, "all", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(t => string.Equals(t.ServerCode, serverCode, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim();
            query = query.Where(t =>
                (t.ItemName != null && t.ItemName.Contains(s, StringComparison.OrdinalIgnoreCase)) ||
                (t.Path != null && t.Path.Contains(s, StringComparison.OrdinalIgnoreCase)) ||
                (t.Details != null && t.Details.Contains(s, StringComparison.OrdinalIgnoreCase)) ||
                (t.TransactionType != null && t.TransactionType.Contains(s, StringComparison.OrdinalIgnoreCase)) ||
                (t.ServerCode != null && t.ServerCode.Contains(s, StringComparison.OrdinalIgnoreCase))
            );
        }

        var results = query
            .OrderByDescending(t => t.Timestamp)
            .Take(safeLimit)
            .ToList();

        return Task.FromResult(results);
    }

    /// <summary>
    /// [TR] İşlem kimliğine göre tekil bir işlem kaydını arar.
    /// [EN] Finds a single transaction record by its unique identifier.
    /// </summary>
    public Task<FileTransaction?> GetByIdAsync(string id)
    {
        var item = _transactions.FirstOrDefault(t => string.Equals(t.Id, id, StringComparison.OrdinalIgnoreCase));
        return Task.FromResult(item);
    }
}
