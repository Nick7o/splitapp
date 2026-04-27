using System.Threading;
using System.Threading.Tasks;
using SplitApp.Domain.Entities;
using System.Collections.Generic;
using System;

namespace SplitApp.Domain.Interfaces;

public interface IAppDbContext
{
    Microsoft.EntityFrameworkCore.DbSet<User> Users { get; }
    Microsoft.EntityFrameworkCore.DbSet<Group> Groups { get; }
    Microsoft.EntityFrameworkCore.DbSet<GroupMember> GroupMembers { get; }
    Microsoft.EntityFrameworkCore.DbSet<Expense> Expenses { get; }
    Microsoft.EntityFrameworkCore.DbSet<ExpenseSplit> ExpenseSplits { get; }
    Microsoft.EntityFrameworkCore.DbSet<Settlement> Settlements { get; }
    Microsoft.EntityFrameworkCore.DbSet<SettlementPayment> SettlementPayments { get; }
    Microsoft.EntityFrameworkCore.DbSet<ActivityLog> ActivityLogs { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
