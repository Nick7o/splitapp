using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SplitApp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddActivityLogMetadata : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ActivityType",
                table: "ActivityLogs",
                type: "character varying(64)",
                maxLength: 64,
                nullable: false,
                defaultValue: "legacy");

            migrationBuilder.AddColumn<string>(
                name: "MetadataJson",
                table: "ActivityLogs",
                type: "jsonb",
                nullable: true);

            migrationBuilder.Sql("UPDATE \"ActivityLogs\" SET \"ActivityType\" = 'legacy' WHERE \"ActivityType\" IS NULL OR \"ActivityType\" = '';");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ActivityType",
                table: "ActivityLogs");

            migrationBuilder.DropColumn(
                name: "MetadataJson",
                table: "ActivityLogs");
        }
    }
}
