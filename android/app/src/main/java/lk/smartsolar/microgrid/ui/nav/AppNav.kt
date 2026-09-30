package lk.smartsolar.microgrid.ui.nav

import android.Manifest
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.Crossfade
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Dashboard
import androidx.compose.material.icons.outlined.EventAvailable
import androidx.compose.material.icons.outlined.History
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.LocationOn
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.QrCodeScanner
import androidx.compose.material.icons.outlined.Receipt
import androidx.compose.material.icons.rounded.Dashboard
import androidx.compose.material.icons.rounded.EventAvailable
import androidx.compose.material.icons.rounded.History
import androidx.compose.material.icons.rounded.Home
import androidx.compose.material.icons.rounded.LocationOn
import androidx.compose.material.icons.rounded.Person
import androidx.compose.material.icons.rounded.QrCodeScanner
import androidx.compose.material.icons.rounded.Receipt
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Snackbar
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.graphics.Color
import kotlinx.coroutines.delay
import lk.smartsolar.microgrid.R
import lk.smartsolar.microgrid.ui.auth.SplashScreen
import lk.smartsolar.microgrid.ui.design.GlassBottomNavigation
import lk.smartsolar.microgrid.ui.design.NavItem
import lk.smartsolar.microgrid.ui.design.SunChainBackground
import lk.smartsolar.microgrid.ui.theme.DarkNavy
import lk.smartsolar.microgrid.ui.theme.Shapes
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import lk.smartsolar.microgrid.data.local.Session
import lk.smartsolar.microgrid.ui.auth.LoginScreen
import lk.smartsolar.microgrid.ui.auth.RegisterScreen
import lk.smartsolar.microgrid.ui.common.LocalContainer
import lk.smartsolar.microgrid.ui.common.LocalSnackbar
import lk.smartsolar.microgrid.ui.common.ReservationDetailScreen
import lk.smartsolar.microgrid.ui.operator.OperatorDashboardScreen
import lk.smartsolar.microgrid.ui.operator.OperatorTransactionsScreen
import lk.smartsolar.microgrid.ui.operator.ScannerScreen
import lk.smartsolar.microgrid.ui.profile.ProfileScreen
import lk.smartsolar.microgrid.ui.prosumer.BookingScreen
import lk.smartsolar.microgrid.ui.prosumer.MyReservationsScreen
import lk.smartsolar.microgrid.ui.prosumer.ProsumerHomeScreen
import lk.smartsolar.microgrid.ui.prosumer.StationDetailScreen
import lk.smartsolar.microgrid.ui.prosumer.StationsScreen
import lk.smartsolar.microgrid.ui.prosumer.TransactionHistoryScreen

private object Routes {
    const val LOGIN = "login"
    const val REGISTER = "register"
    const val HOME = "home"
    const val STATIONS = "stations"
    const val RESERVATIONS = "reservations"
    const val HISTORY = "history"
    const val PROFILE = "profile"
    const val DASHBOARD = "dashboard"
    const val SCANNER = "scanner"
    const val TRANSACTIONS = "transactions"
    const val STATION = "station/{id}"
    const val BOOK = "book?stationId={stationId}&slotId={slotId}"
    const val EDIT = "edit/{id}"
    const val RESERVATION = "reservation/{id}"
    fun station(id: String) = "station/$id"
    fun book(stationId: String? = null, slotId: String? = null) =
        if (stationId != null) "book?stationId=$stationId&slotId=${slotId ?: ""}" else "book"
    fun edit(id: String) = "edit/$id"
    fun reservation(id: String) = "reservation/$id"
}

private val ProsumerTabs = listOf(
    NavItem(Routes.HOME, "Home", Icons.Outlined.Home, Icons.Rounded.Home, iconRes = R.drawable.home_app_logo_24),
    NavItem(Routes.STATIONS, "Stations", Icons.Outlined.LocationOn, Icons.Rounded.LocationOn),
    NavItem(Routes.RESERVATIONS, "Reservations", Icons.Outlined.EventAvailable, Icons.Rounded.EventAvailable),
    NavItem(Routes.HISTORY, "History", Icons.Outlined.History, Icons.Rounded.History),
    NavItem(Routes.PROFILE, "Profile", Icons.Outlined.Person, Icons.Rounded.Person),
)

private val OperatorTabs = listOf(
    NavItem(Routes.DASHBOARD, "Dashboard", Icons.Outlined.Dashboard, Icons.Rounded.Dashboard, iconRes = R.drawable.home_app_logo_24),
    NavItem(Routes.SCANNER, "Scan", Icons.Outlined.QrCodeScanner, Icons.Rounded.QrCodeScanner),
    NavItem(Routes.TRANSACTIONS, "Transactions", Icons.Outlined.Receipt, Icons.Rounded.Receipt),
    NavItem(Routes.PROFILE, "Profile", Icons.Outlined.Person, Icons.Rounded.Person),
)

private val TabFadeIn = fadeIn(tween(200))
private val TabFadeOut = fadeOut(tween(120))

/** Signed out shows the auth screens; signed in shows the role's tabs. The session flow switches between them. */
@Composable
fun SunChainRoot() {
    val container = LocalContainer.current
    val session by container.session.session.collectAsState()
    val current = session
    // A short branded splash on cold start; it hands over to the auth or main screens.
    var splash by rememberSaveable { mutableStateOf(true) }
    LaunchedEffect(Unit) {
        delay(1000)
        splash = false
    }
    SunChainBackground {
        Crossfade(splash, animationSpec = tween(280), label = "splash") { showSplash ->
            when {
                showSplash -> SplashScreen()
                current == null -> AuthNav()
                else -> MainNav(current)
            }
        }
    }
}

@Composable
private fun AuthNav() {
    val nav = rememberNavController()
    NavHost(
        nav, startDestination = Routes.LOGIN,
        enterTransition = { TabFadeIn }, exitTransition = { TabFadeOut },
        popEnterTransition = { TabFadeIn }, popExitTransition = { TabFadeOut },
    ) {
        composable(Routes.LOGIN) { LoginScreen(onRegister = { nav.navigate(Routes.REGISTER) }) }
        composable(Routes.REGISTER) { RegisterScreen(onBack = { nav.popBackStack() }) }
    }
}

@Composable
private fun MainNav(session: Session) {
    val nav = rememberNavController()
    val snackbar = remember { SnackbarHostState() }
    val isProsumer = session.isProsumer
    val tabs = if (isProsumer) ProsumerTabs else OperatorTabs
    val start = if (isProsumer) Routes.HOME else Routes.DASHBOARD
    val entry by nav.currentBackStackEntryAsState()
    val route = entry?.destination?.route

    val askNotifications = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { }
    val container = LocalContainer.current
    LaunchedEffect(Unit) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU && !container.notifier.canNotify()) {
            askNotifications.launch(Manifest.permission.POST_NOTIFICATIONS)
        }
    }

    CompositionLocalProvider(LocalSnackbar provides snackbar) {
        Scaffold(
            containerColor = Color.Transparent,
            snackbarHost = {
                SnackbarHost(snackbar) { data ->
                    Snackbar(data, shape = Shapes.medium, containerColor = DarkNavy, contentColor = Color.White, actionColor = Color(0xFF9DB8FF))
                }
            },
            bottomBar = {
                if (tabs.any { it.route == route }) {
                    GlassBottomNavigation(tabs, route, onSelect = { nav.goToTab(it) })
                }
            },
        ) { padding ->
            NavHost(
                nav, startDestination = start, modifier = Modifier.padding(padding),
                enterTransition = { TabFadeIn }, exitTransition = { TabFadeOut },
                popEnterTransition = { TabFadeIn }, popExitTransition = { TabFadeOut },
            ) {
                // Prosumer tabs
                composable(Routes.HOME) { ProsumerHomeScreen(onBook = { nav.navigate(Routes.book()) }, onOpen = { nav.navigate(Routes.reservation(it)) }, onProfile = { nav.goToTab(Routes.PROFILE) }) }
                composable(Routes.STATIONS) { StationsScreen(onOpen = { nav.navigate(Routes.station(it)) }) }
                composable(Routes.RESERVATIONS) { MyReservationsScreen(onOpen = { nav.navigate(Routes.reservation(it)) }) }
                composable(Routes.HISTORY) { TransactionHistoryScreen(onOpen = { nav.navigate(Routes.reservation(it)) }) }

                // Grid operator tabs
                composable(Routes.DASHBOARD) { OperatorDashboardScreen(onScan = { nav.goToTab(Routes.SCANNER) }, onOpen = { nav.navigate(Routes.reservation(it)) }) }
                composable(Routes.SCANNER) { ScannerScreen(onOpenReceipt = { nav.navigate(Routes.reservation(it)) }) }
                composable(Routes.TRANSACTIONS) { OperatorTransactionsScreen(onOpen = { nav.navigate(Routes.reservation(it)) }) }

                composable(Routes.PROFILE) { ProfileScreen() }

                // Shared detail screens
                composable(Routes.STATION, arguments = listOf(navArgument("id") { type = NavType.StringType })) { e ->
                    StationDetailScreen(
                        id = e.arguments?.getString("id").orEmpty(),
                        onBack = { nav.popBackStack() },
                        onReserve = { stationId, slotId -> nav.navigate(Routes.book(stationId, slotId)) },
                    )
                }
                composable(
                    Routes.BOOK,
                    arguments = listOf(
                        navArgument("stationId") { type = NavType.StringType; nullable = true; defaultValue = null },
                        navArgument("slotId") { type = NavType.StringType; nullable = true; defaultValue = null },
                    ),
                ) { e ->
                    BookingScreen(
                        reservationId = null,
                        presetStationId = e.arguments?.getString("stationId"),
                        presetSlotId = e.arguments?.getString("slotId")?.ifBlank { null },
                        onBack = { nav.popBackStack() },
                        onSaved = { id -> nav.navigate(Routes.reservation(id)) { popUpTo(Routes.BOOK) { inclusive = true } } },
                    )
                }
                composable(Routes.EDIT, arguments = listOf(navArgument("id") { type = NavType.StringType })) { e ->
                    BookingScreen(
                        reservationId = e.arguments?.getString("id"),
                        presetStationId = null,
                        presetSlotId = null,
                        onBack = { nav.popBackStack() },
                        onSaved = { nav.popBackStack() },
                    )
                }
                composable(Routes.RESERVATION, arguments = listOf(navArgument("id") { type = NavType.StringType })) { e ->
                    ReservationDetailScreen(
                        id = e.arguments?.getString("id").orEmpty(),
                        onBack = { nav.popBackStack() },
                        onEdit = { nav.navigate(Routes.edit(it)) },
                    )
                }
            }
        }
    }
}

private fun NavHostController.goToTab(route: String) {
    navigate(route) {
        popUpTo(graph.findStartDestination().id) { saveState = true }
        launchSingleTop = true
        restoreState = true
    }
}
