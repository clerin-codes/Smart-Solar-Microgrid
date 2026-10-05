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
import kotlinx.coroutines.flow.Flow

/* =====================================================
   Entities
===================================================== */

@Entity(
    tableName = "stations",
)
data class StationEntity(
    @PrimaryKey
    val id: String,

    val code: String,

    val name: String,

    val latitude: Double,

    val longitude: Double,

    val capacityKw: Double,

    val batterySlots: Int,

    val availableSlots: Int,

    val isActive: Boolean,

    /** Opening hours serialized for local SQLite storage. */
    val schedule: String,
)

@Entity(
    tableName = "slots",
)
data class SlotEntity(
    @PrimaryKey
    val id: String,

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

@Entity(
    tableName = "reservations",
)
data class ReservationEntity(
    @PrimaryKey
    val id: String,

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

@Entity(
    tableName = "favorites",
)
data class FavoriteEntity(
    @PrimaryKey
    val stationId: String,
)

/**
 * Locally cached signed-in account profile.
 *
 * The ASP.NET Core API remains authoritative.
 * SQLite is used only for local persistence/offline display.
 */
@Entity(
    tableName = "user_profile",
)
data class UserProfileEntity(
    @PrimaryKey
    val nic: String,

    val fullName: String,

    val email: String,

    val phoneNumber: String,

    val role: String,

    val isActive: Boolean,

    val status: String,

    val deactivationRequestedAt: String?,

    val createdAt: String?,

    val updatedAt: String?,
)

/* =====================================================
   Station DAO
===================================================== */

@Dao
interface StationDao {

    @Query(
        "SELECT * FROM stations ORDER BY name",
    )
    fun observeAll():
            Flow<List<StationEntity>>

    @Query(
        "SELECT * FROM stations WHERE id = :id",
    )
    fun observe(
        id: String,
    ): Flow<StationEntity?>

    @Insert(
        onConflict =
            OnConflictStrategy.REPLACE,
    )
    suspend fun insertAll(
        items:
        List<StationEntity>,
    )

    @Query(
        "DELETE FROM stations",
    )
    suspend fun deleteAll()

    @Transaction
    suspend fun replaceAll(
        items:
        List<StationEntity>,
    ) {

        deleteAll()

        insertAll(
            items,
        )
    }
}

/* =====================================================
   Slot DAO
===================================================== */

@Dao
interface SlotDao {

    @Query(
        "SELECT * FROM slots ORDER BY date, startTime",
    )
    fun observeAll():
            Flow<List<SlotEntity>>

    @Query(
        "SELECT * FROM slots WHERE stationId = :stationId ORDER BY date, startTime",
    )
    fun observeForStation(
        stationId: String,
    ): Flow<List<SlotEntity>>

    @Insert(
        onConflict =
            OnConflictStrategy.REPLACE,
    )
    suspend fun insertAll(
        items:
        List<SlotEntity>,
    )

    @Query(
        "DELETE FROM slots",
    )
    suspend fun deleteAll()

    @Transaction
    suspend fun replaceAll(
        items:
        List<SlotEntity>,
    ) {

        deleteAll()

        insertAll(
            items,
        )
    }
}

/* =====================================================
   Reservation DAO
===================================================== */

@Dao
interface ReservationDao {

    @Query(
        "SELECT * FROM reservations ORDER BY createdAt DESC",
    )
    fun observeAll():
            Flow<List<ReservationEntity>>

    @Query(
        "SELECT * FROM reservations ORDER BY createdAt DESC",
    )
    suspend fun getAll():
            List<ReservationEntity>

    @Query(
        "SELECT * FROM reservations WHERE id = :id",
    )
    fun observe(
        id: String,
    ): Flow<ReservationEntity?>

    @Insert(
        onConflict =
            OnConflictStrategy.REPLACE,
    )
    suspend fun insert(
        item:
        ReservationEntity,
    )

    @Insert(
        onConflict =
            OnConflictStrategy.REPLACE,
    )
    suspend fun insertAll(
        items:
        List<ReservationEntity>,
    )

    @Query(
        "DELETE FROM reservations",
    )
    suspend fun deleteAll()

    @Transaction
    suspend fun replaceAll(
        items:
        List<ReservationEntity>,
    ) {

        deleteAll()

        insertAll(
            items,
        )
    }
}

/* =====================================================
   Favorite DAO
===================================================== */

@Dao
interface FavoriteDao {

    @Query(
        "SELECT stationId FROM favorites",
    )
    fun observeIds():
            Flow<List<String>>

    @Query(
        "SELECT COUNT(*) FROM favorites WHERE stationId = :id",
    )
    suspend fun count(
        id: String,
    ): Int

    @Insert(
        onConflict =
            OnConflictStrategy.REPLACE,
    )
    suspend fun add(
        item:
        FavoriteEntity,
    )

    @Query(
        "DELETE FROM favorites WHERE stationId = :id",
    )
    suspend fun remove(
        id: String,
    )

    @Query(
        "DELETE FROM favorites",
    )
    suspend fun clear()
}

/* =====================================================
   Member 1 - User Profile DAO
===================================================== */

@Dao
interface UserProfileDao {

    /** Loads the locally cached profile for the authenticated NIC. */
    @Query(
        "SELECT * FROM user_profile WHERE nic = :nic LIMIT 1",
    )
    suspend fun get(
        nic: String,
    ): UserProfileEntity?

    /** Saves the newest safe profile returned by the API. */
    @Insert(
        onConflict =
            OnConflictStrategy.REPLACE,
    )
    suspend fun save(
        profile:
        UserProfileEntity,
    )

    /** Clears locally stored account information during logout. */
    @Query(
        "DELETE FROM user_profile",
    )
    suspend fun clear()
}

/* =====================================================
   Room Database
===================================================== */

@Database(
    entities = [
        StationEntity::class,
        SlotEntity::class,
        ReservationEntity::class,
        FavoriteEntity::class,
        UserProfileEntity::class,
    ],
    version = 3,
    exportSchema = false,
)
abstract class AppDatabase :
    RoomDatabase() {

    abstract fun stations():
            StationDao

    abstract fun slots():
            SlotDao

    abstract fun reservations():
            ReservationDao

    abstract fun favorites():
            FavoriteDao

    abstract fun userProfiles():
            UserProfileDao

    companion object {

        /** Creates the Room database backed by SQLite. */
        fun create(
            context: Context,
        ): AppDatabase =

            Room.databaseBuilder(
                context,
                AppDatabase::class.java,
                "sunchain.db",
            )
                .fallbackToDestructiveMigration(
                    dropAllTables = true,
                )
                .build()
    }
}