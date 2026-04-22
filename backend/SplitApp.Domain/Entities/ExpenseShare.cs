namespace SplitApp.Domain.Entities;

public class ExpenseShare 
{
    public int ExpenseId { get; set; }
    public Expense Expense { get; set; } = null!;

    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public decimal OwedAmount { get; set; }
}