namespace api.Lib.Type;

public sealed record AccessTokenPayload(
    Guid Uuid,
    string Role,
    IReadOnlyCollection<string> Permissions
);

public sealed record RefreshTokenPayload(
    Guid Uuid
);
