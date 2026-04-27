using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SplitApp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddGroupAvatarAndDescription : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AvatarKey",
                table: "Groups",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "Groups",
                type: "character varying(280)",
                maxLength: 280,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AvatarKey",
                table: "Groups");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "Groups");
        }
    }
}
