using Microsoft.EntityFrameworkCore;
using SplitApp.Infrastructure.Data;

namespace SplitApp.Tests.TestSupport;

public static class AppDbContextFactory
{
    public static AppDbContext Create()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"splitapp-tests-{Guid.NewGuid():N}")
            .EnableSensitiveDataLogging()
            .Options;

        var context = new AppDbContext(options);
        context.Database.EnsureCreated();
        return context;
    }
}
