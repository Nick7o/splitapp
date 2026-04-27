using Microsoft.AspNetCore.Mvc;
using System.Globalization;

namespace SplitApp.Api.Localization;

public static class ErrorMessages
{
    private static readonly Dictionary<string, string> English = new(StringComparer.Ordinal)
    {
        ["auth.emailExists"] = "User with this email already exists.",
        ["auth.invalidCredentials"] = "Invalid email or password.",
        ["auth.invalidGoogleToken"] = "Invalid Google token.",
        ["currency.required"] = "Currency is required.",
        ["currency.unsupported"] = "Unsupported currency code.",
        ["expense.splitSumMismatch"] = "Sum of splits must equal total amount.",
        ["group.invalidAvatarKey"] = "Invalid group avatar.",
        ["group.invalidDescription"] = "Group description is too long.",
        ["group.invalidName"] = "Group name is required.",
        ["group.invalidRole"] = "Invalid member role.",
        ["group.memberHasDebts"] = "This member still has unsettled balances.",
        ["group.memberNotFound"] = "Group member was not found.",
        ["group.notFound"] = "Group was not found.",
        ["group.notMember"] = "You are not a member of this group.",
        ["group.onlyOwnerCan"] = "Only the group owner can perform this action.",
        ["group.cannotChangeOwnerRole"] = "The owner's role cannot be changed.",
        ["group.ownerCannotLeave"] = "The owner cannot leave the group.",
        ["password.notSet"] = "Password sign-in is not available for this account.",
        ["password.tooShort"] = "Password must be at least 8 characters.",
        ["payment.alreadyVoided"] = "This payment is already voided.",
        ["payment.invalidAmount"] = "Payment amount must be greater than zero.",
        ["payment.notFound"] = "Payment was not found.",
        ["payment.self"] = "Payment users must be different.",
        ["payment.usersNotMembers"] = "Both payment users must be group members.",
        ["settlement.closed"] = "This settlement is already closed.",
        ["settlement.invalidAmount"] = "Settlement amount must be greater than zero.",
        ["settlement.notAllowed"] = "You cannot change this settlement.",
        ["settlement.notFound"] = "Settlement was not found.",
        ["settlement.overpay"] = "Payment cannot be greater than the remaining amount.",
        ["settlement.self"] = "Settlement users must be different.",
        ["settlement.usersNotMembers"] = "Both settlement users must be group members.",
        ["user.invalidAvatarKey"] = "Invalid profile avatar.",
        ["user.invalidBio"] = "Bio is too long.",
        ["user.invalidName"] = "Name is required and must be at most 80 characters.",
        ["user.notFound"] = "User was not found."
    };

    private static readonly Dictionary<string, string> Polish = new(StringComparer.Ordinal)
    {
        ["auth.emailExists"] = "Użytkownik z tym adresem email już istnieje.",
        ["auth.invalidCredentials"] = "Nieprawidłowy email lub hasło.",
        ["auth.invalidGoogleToken"] = "Nieprawidłowy token Google.",
        ["currency.required"] = "Waluta jest wymagana.",
        ["currency.unsupported"] = "Nieobsługiwany kod waluty.",
        ["expense.splitSumMismatch"] = "Suma podziału musi równać się pełnej kwocie.",
        ["group.invalidAvatarKey"] = "Nieprawidłowy avatar grupy.",
        ["group.invalidDescription"] = "Opis grupy jest zbyt długi.",
        ["group.invalidName"] = "Nazwa grupy jest wymagana.",
        ["group.invalidRole"] = "Nieprawidłowa rola uczestnika.",
        ["group.memberHasDebts"] = "Ten uczestnik nadal ma nierozliczone salda.",
        ["group.memberNotFound"] = "Nie znaleziono uczestnika grupy.",
        ["group.notFound"] = "Nie znaleziono grupy.",
        ["group.notMember"] = "Nie jesteś uczestnikiem tej grupy.",
        ["group.onlyOwnerCan"] = "Tylko właściciel grupy może wykonać tę akcję.",
        ["group.cannotChangeOwnerRole"] = "Roli właściciela nie można zmienić.",
        ["group.ownerCannotLeave"] = "Właściciel nie może opuścić grupy.",
        ["password.notSet"] = "Logowanie hasłem nie jest dostępne dla tego konta.",
        ["password.tooShort"] = "Hasło musi mieć co najmniej 8 znaków.",
        ["payment.alreadyVoided"] = "Ta płatność została już cofnięta.",
        ["payment.invalidAmount"] = "Kwota płatności musi być większa od zera.",
        ["payment.notFound"] = "Nie znaleziono płatności.",
        ["payment.self"] = "Uczestnicy płatności muszą być różni.",
        ["payment.usersNotMembers"] = "Obie osoby w płatności muszą należeć do grupy.",
        ["settlement.closed"] = "To rozliczenie jest już zamknięte.",
        ["settlement.invalidAmount"] = "Kwota rozliczenia musi być większa od zera.",
        ["settlement.notAllowed"] = "Nie możesz zmienić tego rozliczenia.",
        ["settlement.notFound"] = "Nie znaleziono rozliczenia.",
        ["settlement.overpay"] = "Płatność nie może przekraczać pozostałej kwoty.",
        ["settlement.self"] = "Uczestnicy rozliczenia muszą być różni.",
        ["settlement.usersNotMembers"] = "Obie osoby w rozliczeniu muszą należeć do grupy.",
        ["user.invalidAvatarKey"] = "Nieprawidłowy avatar profilu.",
        ["user.invalidBio"] = "Bio jest zbyt długie.",
        ["user.invalidName"] = "Imię jest wymagane i może mieć maksymalnie 80 znaków.",
        ["user.notFound"] = "Nie znaleziono użytkownika."
    };

    public static ObjectResult ToResult(HttpContext httpContext, string messageOrCode, int statusCode)
    {
        var code = NormalizeCode(messageOrCode);
        var detail = Translate(code);
        var problem = new ProblemDetails
        {
            Status = statusCode,
            Title = statusCode >= 500 ? "Server error" : "Request error",
            Detail = detail
        };
        problem.Extensions["code"] = code;

        return new ObjectResult(problem)
        {
            StatusCode = statusCode,
            ContentTypes = { "application/problem+json" }
        };
    }

    private static string Translate(string code)
    {
        var messages = CultureInfo.CurrentUICulture.TwoLetterISOLanguageName == "pl" ? Polish : English;
        if (messages.TryGetValue(code, out var message))
        {
            return message;
        }

        return English.TryGetValue(code, out var fallback) ? fallback : code;
    }

    private static string NormalizeCode(string messageOrCode)
    {
        if (messageOrCode.Contains('.', StringComparison.Ordinal))
        {
            return messageOrCode;
        }

        return messageOrCode switch
        {
            "Invalid email or password." => "auth.invalidCredentials",
            "Invalid Google token." => "auth.invalidGoogleToken",
            "User with this email already exists." => "auth.emailExists",
            "Currency is required" => "currency.required",
            "Sum of splits must equal total amount" => "expense.splitSumMismatch",
            var value when value.StartsWith("Unsupported currency code", StringComparison.Ordinal) => "currency.unsupported",
            var value when value.StartsWith("Group with ID", StringComparison.Ordinal) => "group.notFound",
            _ => messageOrCode
        };
    }
}
