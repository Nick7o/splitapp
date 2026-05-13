using System;
using System.Collections.Generic;

namespace SplitApp.Application.Currency;

public static class IsoCurrencyCodes
{
    private static readonly HashSet<string> Codes = new(StringComparer.Ordinal)
    {
        "USD", "EUR", "PLN", "GBP", "CHF", "JPY", "CZK", "SEK", "NOK", "DKK",
        "HUF", "RON", "BGN", "UAH", "TRY", "AUD", "CAD", "NZD", "CNY", "HKD",
        "SGD", "KRW", "INR", "BRL", "MXN", "ARS", "CLP", "ZAR", "THB", "IDR",
        "PHP", "MYR", "VND", "AED", "SAR", "ILS", "EGP", "MAD", "NGN", "KES",
        "GHS", "ISK", "RSD", "HRK", "PKR", "BDT", "LKR", "TWD", "TZS", "RUB"
    };

    public static string Normalize(string currency)
    {
        if (string.IsNullOrWhiteSpace(currency))
        {
            throw new ArgumentException("currency.required");
        }

        var normalized = currency.Trim().ToUpperInvariant();
        if (normalized.Length != 3 || !Codes.Contains(normalized))
        {
            throw new ArgumentException("currency.unsupported");
        }

        return normalized;
    }
}
