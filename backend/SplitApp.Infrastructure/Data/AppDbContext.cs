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
    public DbSet<Settlement> Settlements { get; set; } = null!;
    public DbSet<SettlementPayment> SettlementPayments { get; set; } = null!;
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

        modelBuilder.Entity<Expense>()
            .Property(e => e.Currency)
            .IsRequired()
            .HasMaxLength(3);

        modelBuilder.Entity<ExpenseSplit>()
            .HasOne(es => es.User)
            .WithMany(u => u.ExpenseSplits)
            .HasForeignKey(es => es.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Group>()
            .Property(g => g.AvatarKey)
            .HasMaxLength(64);

        modelBuilder.Entity<Group>()
            .Property(g => g.Description)
            .HasMaxLength(280);

        modelBuilder.Entity<Settlement>()
            .HasOne(s => s.Group)
            .WithMany()
            .HasForeignKey(s => s.GroupId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Settlement>()
            .HasOne(s => s.FromUser)
            .WithMany()
            .HasForeignKey(s => s.FromUserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Settlement>()
            .HasOne(s => s.ToUser)
            .WithMany()
            .HasForeignKey(s => s.ToUserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Settlement>()
            .Property(s => s.Currency)
            .IsRequired()
            .HasMaxLength(3);

        modelBuilder.Entity<Settlement>()
            .Property(s => s.Note)
            .HasMaxLength(280);

        modelBuilder.Entity<SettlementPayment>()
            .HasOne(sp => sp.Settlement)
            .WithMany(s => s.Payments)
            .HasForeignKey(sp => sp.SettlementId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<SettlementPayment>()
            .HasOne(sp => sp.RecordedByUser)
            .WithMany()
            .HasForeignKey(sp => sp.RecordedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<User>()
            .Property(u => u.AvatarKey)
            .HasMaxLength(64);

        modelBuilder.Entity<User>()
            .Property(u => u.Bio)
            .HasMaxLength(280);

        modelBuilder.Entity<ActivityLog>()
            .Property(a => a.ActivityType)
            .IsRequired()
            .HasMaxLength(64);

        modelBuilder.Entity<ActivityLog>()
            .Property(a => a.MetadataJson)
            .HasColumnType("jsonb");
    }
}
