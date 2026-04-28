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
    public DbSet<Payment> Payments { get; set; } = null!;
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

        modelBuilder.Entity<GroupMember>()
            .Property(gm => gm.Role)
            .HasConversion<int>();

        modelBuilder.Entity<GroupMember>()
            .HasIndex(gm => gm.GroupId)
            .HasFilter("\"Role\" = 2")
            .IsUnique();

        modelBuilder.Entity<Group>()
            .Property(g => g.Name)
            .IsRequired()
            .HasMaxLength(80);

        modelBuilder.Entity<Group>()
            .Property(g => g.DefaultCurrency)
            .IsRequired()
            .HasMaxLength(3);

        modelBuilder.Entity<Expense>()
            .HasOne(e => e.Payer)
            .WithMany(u => u.PaidExpenses)
            .HasForeignKey(e => e.PayerId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Expense>()
            .Property(e => e.Currency)
            .IsRequired()
            .HasMaxLength(3);

        modelBuilder.Entity<Expense>()
            .Property(e => e.Title)
            .IsRequired()
            .HasMaxLength(160);

        modelBuilder.Entity<Expense>()
            .Property(e => e.SplitMethod)
            .IsRequired()
            .HasMaxLength(32);

        modelBuilder.Entity<Expense>()
            .ToTable(table => table.HasCheckConstraint("CK_Expenses_TotalAmount_Positive", "\"TotalAmount\" > 0"));

        modelBuilder.Entity<ExpenseSplit>()
            .HasKey(es => new { es.ExpenseId, es.UserId });

        modelBuilder.Entity<ExpenseSplit>()
            .HasOne(es => es.User)
            .WithMany(u => u.ExpenseSplits)
            .HasForeignKey(es => es.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ExpenseSplit>()
            .ToTable(table => table.HasCheckConstraint("CK_ExpenseSplits_OwedAmount_Positive", "\"OwedAmount\" > 0"));

        modelBuilder.Entity<Group>()
            .Property(g => g.AvatarKey)
            .HasMaxLength(64);

        modelBuilder.Entity<Group>()
            .Property(g => g.Description)
            .HasMaxLength(280);

        modelBuilder.Entity<Payment>()
            .HasOne(p => p.Group)
            .WithMany(g => g.Payments)
            .HasForeignKey(p => p.GroupId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Payment>()
            .HasOne(p => p.FromUser)
            .WithMany()
            .HasForeignKey(p => p.FromUserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Payment>()
            .HasOne(p => p.ToUser)
            .WithMany()
            .HasForeignKey(p => p.ToUserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Payment>()
            .HasOne(p => p.RecordedByUser)
            .WithMany()
            .HasForeignKey(p => p.RecordedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Payment>()
            .HasOne(p => p.VoidedByUser)
            .WithMany()
            .HasForeignKey(p => p.VoidedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Payment>()
            .Property(p => p.Status)
            .HasConversion<int>();

        modelBuilder.Entity<Payment>()
            .Property(p => p.Currency)
            .IsRequired()
            .HasMaxLength(3);

        modelBuilder.Entity<Payment>()
            .Property(p => p.Note)
            .HasMaxLength(280);

        modelBuilder.Entity<Payment>()
            .ToTable(table => table.HasCheckConstraint("CK_Payments_Amount_Positive", "\"Amount\" > 0"));

        modelBuilder.Entity<User>()
            .Property(u => u.AvatarKey)
            .HasMaxLength(64);

        modelBuilder.Entity<User>()
            .Property(u => u.Bio)
            .HasMaxLength(280);

        modelBuilder.Entity<User>()
            .Property(u => u.Name)
            .IsRequired()
            .HasMaxLength(80);

        modelBuilder.Entity<User>()
            .Property(u => u.Email)
            .IsRequired()
            .HasMaxLength(320);

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<User>()
            .HasIndex(u => u.GoogleId)
            .IsUnique()
            .HasFilter("\"GoogleId\" IS NOT NULL");

        modelBuilder.Entity<ActivityLog>()
            .Property(a => a.ActivityType)
            .IsRequired()
            .HasMaxLength(64);

        modelBuilder.Entity<ActivityLog>()
            .Property(a => a.MetadataJson)
            .HasColumnType("jsonb");
    }
}
