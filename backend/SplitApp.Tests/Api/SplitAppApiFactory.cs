using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using SplitApp.Infrastructure.Data;

namespace SplitApp.Tests.Api;

public sealed class SplitAppApiFactory : WebApplicationFactory<Program>
{
    private readonly string _databaseName = $"splitapp-api-tests-{Guid.NewGuid():N}";

    public SplitAppApiFactory()
    {
        Environment.SetEnvironmentVariable("Jwt__Key", "SplitAppIntegrationTestsJwtKeyWithEnoughLength12345");
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureAppConfiguration((_, configuration) =>
        {
            configuration.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = "Host=localhost;Database=unused",
                ["Jwt:Key"] = "SplitAppIntegrationTestsJwtKeyWithEnoughLength12345",
                ["Jwt:Issuer"] = "SplitApp",
                ["Jwt:Audience"] = "SplitAppUsers",
                ["Authentication:Google:ClientId"] = "test-client-id"
            });
        });

        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions<AppDbContext>>();
            services.RemoveAll<IDbContextOptionsConfiguration<AppDbContext>>();
            services.AddDbContext<AppDbContext>(options =>
            {
                options.UseInMemoryDatabase(_databaseName);
                options.EnableSensitiveDataLogging();
            });
        });
    }
}
