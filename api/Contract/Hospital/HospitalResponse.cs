namespace api.Contract.Hospital;

public sealed class HospitalResponse
{
    public Guid Uuid { get; set; }
    public string Image { get; set; } = string.Empty;
    public string MapUrl { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public int NumberOfRoom { get; set; }
    public string Description { get; set; } = string.Empty;
    public string DetailService { get; set; } = string.Empty;
    public string WorkingHour { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
