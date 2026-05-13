using System;
using System.Collections.Generic;

namespace SplitApp.Application.Users;

public static class UserAvatarKeys
{
    private static readonly HashSet<string> AllowedKeys = new(StringComparer.Ordinal)
    {
        "fox",
        "owl",
        "wave",
        "mountain",
        "rocket",
        "cactus",
        "coffee",
        "book",
        "music",
        "bike",
        "camera",
        "sun"
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
            throw new ArgumentException("user.invalidAvatarKey");
        }

        return normalized;
    }
}
