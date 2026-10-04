using MongoDB.Driver;
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Data
{
    /// <summary>
    /// Initializes MongoDB collections and indexes
    /// </summary>
    public static class MongoDbInitializer
    {
        public static async Task InitializeAsync(IMongoDbContext context)
        {
            try
            {
                // Initialize QRVerifications collection
                await InitializeQRVerificationsAsync(context);

                // Initialize Transactions collection
                await InitializeTransactionsAsync(context);

                Console.WriteLine("✅ MongoDB collections and indexes initialized successfully");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error initializing MongoDB: {ex.Message}");
                throw;
            }
        }

        private static async Task InitializeQRVerificationsAsync(IMongoDbContext context)
        {
            var collection = context.GetCollection<QRVerification>("QRVerifications");

            // Create TTL index (documents expire after 2 hours)
            var indexModel = new CreateIndexModel<QRVerification>(
                Builders<QRVerification>.IndexKeys.Ascending(x => x.ExpiresAt),
                new CreateIndexOptions { ExpireAfter = TimeSpan.FromSeconds(1) }
            );

            await collection.Indexes.CreateOneAsync(indexModel);

            // Create index on token for fast lookup
            var tokenIndexModel = new CreateIndexModel<QRVerification>(
                Builders<QRVerification>.IndexKeys.Ascending(x => x.Token),
                new CreateIndexOptions { Unique = true }
            );

            await collection.Indexes.CreateOneAsync(tokenIndexModel);

            // Create index on reservationId
            var reservationIndexModel = new CreateIndexModel<QRVerification>(
                Builders<QRVerification>.IndexKeys.Ascending(x => x.ReservationId)
            );

            await collection.Indexes.CreateOneAsync(reservationIndexModel);
        }

        private static async Task InitializeTransactionsAsync(IMongoDbContext context)
        {
            var collection = context.GetCollection<Transaction>("Transactions");

            // Create index on ReservationId
            var reservationIndexModel = new CreateIndexModel<Transaction>(
                Builders<Transaction>.IndexKeys.Ascending(x => x.ReservationId)
            );

            await collection.Indexes.CreateOneAsync(reservationIndexModel);

            // Create index on GridOperatorId
            var gridOperatorIndexModel = new CreateIndexModel<Transaction>(
                Builders<Transaction>.IndexKeys.Ascending(x => x.GridOperatorId)
            );

            await collection.Indexes.CreateOneAsync(gridOperatorIndexModel);

            // Create index on ProsumerId
            var prosumerIndexModel = new CreateIndexModel<Transaction>(
                Builders<Transaction>.IndexKeys.Ascending(x => x.ProsumerId)
            );

            await collection.Indexes.CreateOneAsync(prosumerIndexModel);

            // Create composite index on Timestamp for sorting
            var timestampIndexModel = new CreateIndexModel<Transaction>(
                Builders<Transaction>.IndexKeys.Descending(x => x.Timestamp)
            );

            await collection.Indexes.CreateOneAsync(timestampIndexModel);
        }
    }
}
