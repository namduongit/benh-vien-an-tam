
using System.Text;
using System.Text.Json.Serialization;
using api.Lib;
using api.Lib.Setting;
using api.Middleware;
using api.Service;
using api.Service.Interfaces;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        var frontendUrl = builder.Configuration["FrontendUrl"]
                          ?? "http://localhost:3000";

        policy.WithOrigins(frontendUrl, "http://localhost:3001")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Controllers and JSON
builder.Services
    .AddControllers()
    .AddJsonOptions(options =>
        options.JsonSerializerOptions.Converters.Add(
            new JsonStringEnumConverter()));

// Swagger and OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddOpenApi();

// Payment configuration
builder.Services.Configure<SepaySetting>(
    builder.Configuration.GetSection("SepayConfiguration"));

// JWT configuration
builder.Services.Configure<JwtSetting>(
    builder.Configuration.GetSection("Jwt"));

var jwtOptions =
    builder.Configuration.GetSection("Jwt").Get<JwtSetting>()
    ?? new JwtSetting();

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtOptions.SecretKey)),
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                context.Token =
                    context.Request.Cookies["access_token"];

                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

// Common services
builder.Services.AddScoped<PasswordHasher>();
builder.Services.AddScoped<Jwt>();

// Existing services from main
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<HospitalService>();
builder.Services.AddScoped<DepartmentService>();
builder.Services.AddScoped<MedicineService>();
builder.Services.AddScoped<AccountService>();
builder.Services.AddScoped<TimeWorkingService>();

// Services from your current work
builder.Services.AddScoped<
    IAvailableMedicineService, AvailableMedicineService>();
builder.Services.AddScoped<
    IDoctorProfileService, DoctorProfileService>();
builder.Services.AddScoped<
    IPrescriptionService, PrescriptionService>();
builder.Services.AddScoped<
    IDoctorAppointmentService, DoctorAppointmentService>();
builder.Services.AddScoped<
    IClinicalExaminationService, ClinicalExaminationService>();
builder.Services.AddScoped<
    IPrescriptionManagementService, PrescriptionManagementService>();

// PostgreSQL
builder.Services.AddDbContext<DBContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

// API documentation
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
