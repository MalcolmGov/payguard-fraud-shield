package com.swifter.fraudshield.collectors

import android.content.Context
import android.location.Location
import android.location.LocationManager
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import java.net.InetAddress
import java.net.NetworkInterface

data class NetworkSignals(
    val ipAddress: String,
    val isVpnActive: Boolean,
    val isProxySet: Boolean,
    val connectionType: String,
    val latitude: Double?,
    val longitude: Double?
)

class NetworkCollector(private val context: Context) {

    fun collect(): NetworkSignals {
        return NetworkSignals(
            ipAddress = getIpAddress(),
            isVpnActive = detectVpn(),
            isProxySet = detectProxy(),
            connectionType = getConnectionType(),
            latitude = getLastKnownLocation()?.latitude,
            longitude = getLastKnownLocation()?.longitude
        )
    }

    private fun getIpAddress(): String {
        return try {
            NetworkInterface.getNetworkInterfaces()?.toList()
                ?.flatMap { it.inetAddresses.toList() }
                ?.firstOrNull { !it.isLoopbackAddress && it is InetAddress && it.address.size == 4 }
                ?.hostAddress ?: "unknown"
        } catch (e: Exception) {
            "unknown"
        }
    }

    private fun detectVpn(): Boolean {
        val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val activeNetwork = cm.activeNetwork ?: return false
        val caps = cm.getNetworkCapabilities(activeNetwork) ?: return false
        return caps.hasTransport(NetworkCapabilities.TRANSPORT_VPN)
    }

    private fun detectProxy(): Boolean {
        val proxyHost = System.getProperty("http.proxyHost")
        val proxyPort = System.getProperty("http.proxyPort")
        return !proxyHost.isNullOrBlank() && !proxyPort.isNullOrBlank()
    }

    private fun getConnectionType(): String {
        val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val activeNetwork = cm.activeNetwork ?: return "NONE"
        val caps = cm.getNetworkCapabilities(activeNetwork) ?: return "NONE"
        return when {
            caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) -> "WIFI"
            caps.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) -> "CELLULAR"
            caps.hasTransport(NetworkCapabilities.TRANSPORT_VPN) -> "VPN"
            else -> "OTHER"
        }
    }

    private fun getLastKnownLocation(): Location? {
        return try {
            val lm = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
            @Suppress("MissingPermission")
            lm.getLastKnownLocation(LocationManager.NETWORK_PROVIDER)
                ?: lm.getLastKnownLocation(LocationManager.GPS_PROVIDER)
        } catch (e: SecurityException) {
            null // Location permission not granted
        } catch (e: Exception) {
            null
        }
    }
}
