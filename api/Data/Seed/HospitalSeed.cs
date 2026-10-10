using api.Model;
using api.Model.Enum;

namespace api.Data.Seed;

public static class HospitalSeed
{
    public static IReadOnlyList<Hospital> Hospitals { get; } =
    [
        new Hospital
        {
            Uuid = Guid.Parse("a4a0a61f-577d-48cb-94b9-c9ce85554b11"),
            Image = "/images/hospital-placeholder.svg",
            MapUrl = "https://maps.google.com",
            Slug = "benh-vien-an-binh",
            Name = "Bệnh viện An Bình",
            Address = "TP. Hồ Chí Minh",
            NumberOfRoom = 20,
            Description = "Cơ sở khám chữa bệnh đa khoa.",
            DetailService = "Cung cấp dịch vụ khám tổng quát và chuyên khoa.",
            WorkingHour = "07:00 - 17:00",
            Status = BaseStatus.Active,
            CreatedAt = DateTime.UnixEpoch,
            UpdatedAt = DateTime.UnixEpoch,
            DeletedAt = null
        },
        new Hospital
        {
            Uuid = Guid.Parse("f02f7063-adc4-47ae-9a42-02ca5adff369"),
            Image = "/images/hospital-placeholder.svg",
            MapUrl = "https://maps.google.com",
            Slug = "phong-kham-da-khoa-hai-au",
            Name = "Phòng khám Đa khoa Hải Âu",
            Address = "TP. Hồ Chí Minh",
            NumberOfRoom = 10,
            Description = "Phòng khám đa khoa.",
            DetailService = "Khám và tư vấn sức khỏe.",
            WorkingHour = "08:00 - 18:00",
            Status = BaseStatus.Active,
            CreatedAt = DateTime.UnixEpoch,
            UpdatedAt = DateTime.UnixEpoch,
            DeletedAt = null
        }
    ];
}