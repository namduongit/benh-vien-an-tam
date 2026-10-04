namespace api.Contract.Hospital;

public sealed class RoomResponse
{
    public Guid Uuid { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public Guid? HospitalUuid { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
