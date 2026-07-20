using System.Text.RegularExpressions;

namespace LmsApi.Utils;

public static class Slugify
{
    public static string ToSlug(string value)
    {
        var lowered = value.ToLowerInvariant().Trim();
        var dashed = Regex.Replace(lowered, "[^a-z0-9]+", "-");
        return dashed.Trim('-');
    }
}
