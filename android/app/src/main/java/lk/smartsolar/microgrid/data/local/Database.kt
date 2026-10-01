package lk.smartsolar.microgrid.data.local

import android.content.Context
import androidx.room.Dao
import androidx.room.Database
import androidx.room.Entity
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.PrimaryKey
import androidx.room.Query
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.Transaction
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase
import kotlinx.coroutines.flow.Flow

@Entity(tableName = "stations")
data class StationEntity(
    @PrimaryKey val id: String,
    val code: String,
    val name: String,
    val latitude: Double,
    val longitude: Double,
    val capacityKw: Double,
    val batterySlots: Int,
    val availableSlots: Int,
    val isActive: Boolean,
    /** Opening hours as "Monday|08:00:00|18:00:00|1;..." (see Mappers). */
    val schedule: String,
)

@Entity(tableName = "slots")
data class SlotEntity(
    @PrimaryKey val id: String,
    val stationId: String,
    /** yyyy-MM-dd */
    val date: String,
    /** HH:mm:ss */
    val startTime: String,
    val endTime: String,
    val capacityKw: Double,
    val availableKw: Double,
    val status: Int,
)

@Entity(tableName = "reservations")
data class ReservationEntity(
    @PrimaryKey val id: String,
    val number: String,
    val prosumerNic: String,
    val stationId: String,
    val slotId: String,
    /** yyyy-MM-dd */
    val date: String,
    val startTime: String,
    val endTime: String,
    val status: Int,
    val qrToken: String?,
    val transactionStatus: Int,
    val approvedBy: String?,
    val completedBy: String?,
    val completedAt: String?,
    val createdAt: String,
)

@Entity(tableName = "favorites")
data class FavoriteEntity(@PrimaryKey val stationId: String)

/** Non-sensitive signed-in user/profile data cached in SQLite for local user management. */
@Entity(tableName = "local_users")
data class LocalUserEntity(
    @PrimaryKey val nic: String,
    val fullName: String,
    val email: String? = null,
    val phoneNumber: String? = null,
    val role: String,
    val isActive: Boolean = true,
    val profileImage: String? = null,
    val cachedAt: Long = 0L,
)

@Dao
interface StationDao {
    @Query("SELECT * FROM stations ORDER BY name")
    fun observeAll(): Flow<List<StationEntity>>

    @Query("SELECT * FROM stations WHERE id = :id")
    fun observe(id: String): Flow<StationEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(items: List<StationEntity>)

    @Query("DELETE FROM stations")
    suspend fun deleteAll()

    @Transaction
    suspend fun replaceAll(items: List<StationEntity>) {
        deleteAll()
        insertAll(items)
    }
}

@Dao
interface SlotDao {
    @Query("SELECT * FROM slots ORDER BY date, startTime")
    fun observeAll(): Flow<List<SlotEntity>>

    @Query("SELECT * FROM slots WHERE stationId = :stationId ORDER BY date, startTime")
    fun observeForStation(stationId: String): Flow<List<SlotEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(items: List<SlotEntity>)

    @Query("DELETE FROM slots")
    suspend fun deleteAll()

    @Transaction
    suspend fun replaceAll(items: List<SlotEntity>) {
        deleteAll()
        insertAll(items)
    }
}

@Dao
interface ReservationDao {
    @Query("SELECT * FROM reservations ORDER BY createdAt DESC")
    fun observeAll(): Flow<List<ReservationEntity>>

    @Query("SELECT * FROM reservations ORDER BY createdAt DESC")
    suspend fun getAll(): List<ReservationEntity>

    @Query("SELECT * FROM reservations WHERE id = :id")
    fun observe(id: String): Flow<ReservationEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(item: ReservationEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(items: List<ReservationEntity>)

    @Query("DELETE FROM reservations")
    suspend fun deleteAll()

    @Transaction
    suspend fun replaceAll(items: List<ReservationEntity>) {
        deleteAll()
        insertAll(items)
    }
}

@Dao
interface FavoriteDao {
    @Query("SELECT stationId FROM favorites")
    fun observeIds(): Flow<List<String>>

    @Query("SELECT COUNT(*) FROM favorites WHERE stationId = :id")
    suspend fun count(id: String): Int

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun add(item: FavoriteEntity)

    @Query("DELETE FROM favorites WHERE stationId = :id")
    suspend fun remove(id: String)

    @Query("DELETE FROM favorites")
    suspend fun clear()
}

@Dao
interface LocalUserDao {
    @Query("SELECT * FROM local_users WHERE nic = :nic")
    fun observe(nic: String): Flow<LocalUserEntity?>

    @Query("SELECT * FROM local_users WHERE nic = :nic")
    suspend fun get(nic: String): LocalUserEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(user: LocalUserEntity)

    @Query("DELETE FROM local_users")
    suspend fun clear()
}

@Database(
    entities = [StationEntity::class, SlotEntity::class, ReservationEntity::class, FavoriteEntity::class, LocalUserEntity::class],
    version = 2,
    exportSchema = false,
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun stations(): StationDao
    abstract fun slots(): SlotDao
    abstract fun reservations(): ReservationDao
    abstract fun favorites(): FavoriteDao
    abstract fun users(): LocalUserDao

    companion object {
        val MIGRATION_1_2 = object : Migration(1, 2) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL(
                    """CREATE TABLE IF NOT EXISTS `local_users` (`nic` TEXT NOT NULL, `fullName` TEXT NOT NULL, `email` TEXT, `phoneNumber` TEXT, `role` TEXT NOT NULL, `isActive` INTEGER NOT NULL, `profileImage` TEXT, `cachedAt` INTEGER NOT NULL, PRIMARY KEY(`nic`))""",
                )
            }
        }

        fun create(context: Context): AppDatabase =
            Room.databaseBuilder(context, AppDatabase::class.java, "sunchain.db")
                .addMigrations(MIGRATION_1_2)
                .build()
    }
}
