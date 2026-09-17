using MongoDB.Bson;
using MongoDB.Driver;
using SmartSolarMicrogrid.Api.Configuration;

var builder = WebApplication.CreateBuilder(args);

// MongoDB Configuration
var mongoSettings = builder.Configuration
    .GetSection("MongoDbSettings")
    .Get<MongoDbSettings>();

if (mongoSettings == null)
{
    throw new InvalidOperationException(
        "MongoDbSettings configuration is missing.");
}

// Register MongoDB Client
builder.Services.AddSingleton<IMongoClient>(_ =>
    new MongoClient(mongoSettings.ConnectionString));

// Register MongoDB Database
builder.Services.AddSingleton<IMongoDatabase>(serviceProvider =>
{
    var client = serviceProvider.GetRequiredService<IMongoClient>();

    return client.GetDatabase(mongoSettings.DatabaseName);
});

// Add services to the container.
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// MongoDB Startup Connection Test
try
{
    var database = app.Services.GetRequiredService<IMongoDatabase>();

    await database.RunCommandAsync<BsonDocument>(
        new BsonDocument("ping", 1));

    Console.WriteLine("========================================");
    Console.WriteLine("MongoDB Connection: SUCCESS");
    Console.WriteLine($"Database: {mongoSettings.DatabaseName}");
    Console.WriteLine("========================================");
}
catch (Exception ex)
{
    Console.WriteLine("========================================");
    Console.WriteLine("MongoDB Connection: FAILED");
    Console.WriteLine($"Error: {ex.Message}");
    Console.WriteLine("========================================");
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Temporarily comment this while testing HTTP localhost
// app.UseHttpsRedirection();

// MongoDB Connection Test
app.MapGet("/api/health", async (IMongoDatabase database) =>
{
    try
    {
        await database.RunCommandAsync<BsonDocument>(
            new BsonDocument("ping", 1));

        return Results.Ok(new
        {
            status = "OK",
            database = "Connected"
        });
    }
    catch (Exception ex)
    {
        return Results.Problem(
            detail: ex.Message,
            title: "MongoDB Connection Failed");
    }
});

app.Run();