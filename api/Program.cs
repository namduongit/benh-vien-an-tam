using System.Text;
using System.Text.Json.Serialization;
using api.Config;
using api.Lib;
using api.Lib.Setting;
using api.Middleware;
using api.Service;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddControllers()
    .AddJsonOptions(options =>
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins(builder.Configuration["FrontendUrl"] ?? "http://localhost:3000")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials());
});

// Config Momo 
builder.Services.Configure<MomoSetting>(
    builder.Configuration.GetSection("MomoConfiguration")
);

// Config Jwt
builder.Services.AddOptions<JwtOptions>()
    .Bind(builder.Configuration.GetSection(JwtOptions.SectionName))
    .Validate(options => options.SecretKey.Length >= 32, "Jwt:SecretKey must contain at least 32 characters.")
    .Validate(options => options.AccessTokenMinutes > 0, "Jwt:AccessTokenMinutes must be greater than zero.")
    .Validate(options => options.RefreshTokenDays > 0, "Jwt:RefreshTokenDays must be greater than zero.")
    .ValidateOnStart();

var jwtOptions = builder.Configuration
    .GetSection(JwtOptions.SectionName)
    .Get<JwtOptions>() ?? new JwtOptions();

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.SecretKey)),
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                context.Token = context.Request.Cookies["access_token"];
                return Task.CompletedTask;
            }
        };
    });
builder.Services.AddAuthorization();
builder.Services.AddSingleton<PasswordHasher>();
builder.Services.AddSingleton<JwtService>();
builder.Services.AddScoped<AuthService>();
// builder.Services.AddScoped<IAvailableMedicineService, AvailableMedicineService>();
// builder.Services.AddScoped<IDoctorProfileService, DoctorProfileService>();

// Config Postges
builder.Services.AddDbContext<DBContext>(options => options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseMiddleware<ExceptionHandler>();

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.Run();
