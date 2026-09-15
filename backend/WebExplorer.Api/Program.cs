// ============================================================================
// [TR] WebExplorer API Giriş Noktası ve Servis Yapılandırması
// [EN] WebExplorer API Entry Point and Service Configuration
// ============================================================================

using System;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using WebExplorer.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// [TR] MVC Denetleyicileri ve OpenAPI/Swagger desteğini kaydet
// [EN] Register MVC Controllers and OpenAPI/Swagger support
builder.Services.AddControllers();
builder.Services.AddOpenApi();

// [TR] Transaction ve Explorer servislerini Singleton yaşam döngüsüyle kaydet
// [EN] Register Transaction and Explorer services with Singleton lifecycle
builder.Services.AddSingleton<ITransactionService, InMemoryTransactionService>();
builder.Services.AddSingleton<IExplorerService, InMemoryExplorerService>();

// [TR] Frontend Next.js istemcisi için CORS izinlerini yapılandır
// [EN] Configure CORS policies for Next.js frontend client
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.SetIsOriginAllowed(origin => new Uri(origin).Host == "localhost")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("AllowFrontend");

app.MapControllers();

app.Run();

