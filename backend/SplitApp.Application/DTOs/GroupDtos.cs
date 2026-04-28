using System;
using System.Collections.Generic;

namespace SplitApp.Application.DTOs;

public class GroupDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? AvatarKey { get; set; }
    public string DefaultCurrency { get; set; } = string.Empty;
    public Guid OwnerId { get; set; }
    public decimal MyBalance { get; set; }
    public Dictionary<string, decimal> MyBalanceByCurrency { get; set; } = new();
    public int MembersCount { get; set; }
    public string LastActive { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
}

public class GroupDetailsDto : GroupDto
{
    public List<UserDto> Members { get; set; } = new();
    public List<ExpenseDto> Expenses { get; set; } = new();
    public Dictionary<string, Dictionary<Guid, decimal>> BalancesByCurrency { get; set; } = new();
    public List<DebtTransferDto> OptimizedDebts { get; set; } = new();
    public Dictionary<string, List<DebtTransferDto>> OptimizedDebtsByCurrency { get; set; } = new();
}

public class DebtTransferDto
{
    public Guid FromUserId { get; set; }
    public Guid ToUserId { get; set; }
    public decimal Amount { get; set; }
}

public class UserDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? AvatarKey { get; set; }
    public string? Bio { get; set; }
    public bool HasPassword { get; set; }
}

public class GroupMemberDto
{
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? AvatarKey { get; set; }
    public string? Bio { get; set; }
    public int Role { get; set; }
}

public class ExpenseDto
{
    public Guid Id { get; set; }
    public Guid PayerId { get; set; }
    public string Title { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public string Currency { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public decimal MyShare { get; set; }
}
