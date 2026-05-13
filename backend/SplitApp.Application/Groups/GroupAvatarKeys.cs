using System;
using System.Collections.Generic;

namespace SplitApp.Application.Groups;

public static class GroupAvatarKeys
{
    private static readonly HashSet<string> AllowedKeys = new(StringComparer.Ordinal)
    {
        "mountain",
        "sail",
        "beach",
        "ski",
        "camp",
        "home",
        "dinner",
        "party",
        "roadtrip",
        "flight",
        "band",
        "stadium"
    };

    public static string? Normalize(string? avatarKey)
    {
        if (string.IsNullOrWhiteSpace(avatarKey))
        {
            return null;
        }

        var normalized = avatarKey.Trim();
        if (!AllowedKeys.Contains(normalized))
        {
            throw new ArgumentException("group.invalidAvatarKey");
        }

        return normalized;
    }
}
