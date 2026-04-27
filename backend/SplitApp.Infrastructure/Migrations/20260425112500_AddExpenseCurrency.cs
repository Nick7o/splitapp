using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SplitApp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddExpenseCurrency : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Currency",
                table: "Expenses",
                type: "character varying(3)",
                maxLength: 3,
                nullable: false,
                defaultValue: "PLN");

            migrationBuilder.Sql(
                "UPDATE \"Expenses\" AS e SET \"Currency\" = g.\"Currency\" FROM \"Groups\" AS g WHERE g.\"Id\" = e.\"GroupId\";");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Currency",
                table: "Expenses");
        }
    }
}
