using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace SplitApp.Tests.Api;

public class AuthAndGroupApiTests
{
    [Fact]
    public async Task Protected_groups_endpoint_returns_problem_details_without_token()
    {
        await using var factory = new SplitAppApiFactory();
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/groups");
        var problem = await response.Content.ReadFromJsonAsync<ApiProblemPayload>();

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Equal("auth.unauthorized", problem?.Code);
    }

    [Fact]
    public async Task Register_login_create_group_and_read_group_details_flow()
    {
        await using var factory = new SplitAppApiFactory();
        var client = factory.CreateClient();

        var registerResponse = await client.PostAsJsonAsync("/api/auth/register", new
        {
            email = "owner@example.com",
            password = "Password123!",
            name = "Owner"
        });

        registerResponse.EnsureSuccessStatusCode();
        var registered = await registerResponse.Content.ReadFromJsonAsync<AuthPayload>();
        Assert.False(string.IsNullOrWhiteSpace(registered?.Token));
        Assert.Equal("owner@example.com", registered?.User.Email);

        var loginResponse = await client.PostAsJsonAsync("/api/auth/login", new
        {
            email = "owner@example.com",
            password = "Password123!"
        });

        loginResponse.EnsureSuccessStatusCode();
        var loggedIn = await loginResponse.Content.ReadFromJsonAsync<AuthPayload>();
        Assert.False(string.IsNullOrWhiteSpace(loggedIn?.Token));

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", loggedIn!.Token);

        var createGroupResponse = await client.PostAsJsonAsync("/api/groups", new
        {
            name = "  Demo trip  ",
            defaultCurrency = "pln"
        });

        createGroupResponse.EnsureSuccessStatusCode();
        var createdGroup = await createGroupResponse.Content.ReadFromJsonAsync<CreateGroupPayload>();
        Assert.NotEqual(Guid.Empty, createdGroup!.Id);

        var groups = await client.GetFromJsonAsync<List<GroupPayload>>("/api/groups");
        Assert.NotNull(groups);
        var group = Assert.Single(groups);
        Assert.Equal("Demo trip", group.Name);
        Assert.Equal("PLN", group.DefaultCurrency);
        Assert.Equal(1, group.MembersCount);
        Assert.Equal(registered!.User.Id, group.OwnerId);

        var details = await client.GetFromJsonAsync<GroupDetailsPayload>($"/api/groups/{createdGroup.Id}");
        Assert.NotNull(details);
        Assert.Equal(createdGroup.Id, details!.Id);
        Assert.Equal("Demo trip", details.Name);
        var member = Assert.Single(details.Members);
        Assert.Equal(registered.User.Id, member.Id);
        Assert.Equal("Owner", member.Name);
    }

    [Fact]
    public async Task Register_returns_stable_problem_code_for_duplicate_email()
    {
        await using var factory = new SplitAppApiFactory();
        var client = factory.CreateClient();
        var payload = new
        {
            email = "duplicate@example.com",
            password = "Password123!",
            name = "Owner"
        };

        (await client.PostAsJsonAsync("/api/auth/register", payload)).EnsureSuccessStatusCode();
        var duplicateResponse = await client.PostAsJsonAsync("/api/auth/register", payload);
        var problem = await duplicateResponse.Content.ReadFromJsonAsync<ApiProblemPayload>();

        Assert.Equal(HttpStatusCode.BadRequest, duplicateResponse.StatusCode);
        Assert.Equal("auth.emailExists", problem?.Code);
    }

    private sealed record ApiProblemPayload(string? Code);
    private sealed record AuthPayload(string Token, UserPayload User);
    private sealed record UserPayload(Guid Id, string Name, string Email);
    private sealed record CreateGroupPayload(Guid Id);
    private sealed record GroupPayload(Guid Id, string Name, string DefaultCurrency, Guid OwnerId, int MembersCount);
    private sealed record GroupDetailsPayload(Guid Id, string Name, string DefaultCurrency, Guid OwnerId, List<UserPayload> Members);
}
