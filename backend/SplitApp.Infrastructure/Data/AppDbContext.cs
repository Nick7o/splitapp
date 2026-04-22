using Microsoft.EntityFrameworkCore;
using SplitApp.Domain.Entities;
using SplitApp.Domain.Interfaces;

namespace SplitApp.Infrastructure.Data;

public class AppDbContext : DbContext, IAppDbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; } = null!;
    public DbSet<Group> Groups { get; set; } = null!;
    public DbSet<GroupMember> GroupMembers { get; set; } = null!;
    public DbSet<Expense> Expenses { get; set; } = null!;
    public DbSet<ExpenseSplit> ExpenseSplits { get; set; } = null!;
    public DbSet<ActivityLog> ActivityLogs { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<GroupMember>()
            .HasKey(gm => new { gm.GroupId, gm.UserId });

        modelBuilder.Entity<GroupMember>()
            .HasOne(gm => gm.Group)
            .WithMany(g => g.Members)
            .HasForeignKey(gm => gm.GroupId);

        modelBuilder.Entity<GroupMember>()
            .HasOne(gm => gm.User)
            .WithMany(u => u.GroupMemberships)
            .HasForeignKey(gm => gm.UserId);

        modelBuilder.Entity<Expense>()
            .HasOne(e => e.Payer)
            .WithMany(u => u.PaidExpenses)
            .HasForeignKey(e => e.PayerId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ExpenseSplit>()
            .HasOne(es => es.User)
            .WithMany(u => u.ExpenseSplits)
            .HasForeignKey(es => es.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
