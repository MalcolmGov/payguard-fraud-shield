/* ═══════════════════════════════════════════════════════════════════════════
 * PayGuard Android SDK — Network Collector
 * Detects VPN, proxy, connection type, and collects IP address
 * © 2026 Swifter Technologies (Pty) Ltd
 * ═══════════════════════════════════════════════════════════════════════════ */

package com.swifter.fraudshield.collectors

import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import com.swifter.fraudshield.models.NetworkSignals
import java.net.Inet4Address
import java.net.NetworkInterface

class NetworkCollector(private val context: Context) {

    suspend fun collect(): NetworkSignals {
        val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val activeNetwork = cm.activeNetwork
        val capabilities = activeNetwork?.let { cm.getNetworkCapabilities(it) }

        return NetworkSignals(
            ipAddress      = getLocalIpAddress(),
            isVpnActive    = detectVpn(capabilities),
            isProxySet     = detectProxy(),
            connectionType = getConnectionType(capabilities)
        )
    }

    // ── VPN Detection ───────────────────────────────────────────────────────

    private fun detectVpn(capabilities: NetworkCapabilities?): Boolean {
        if (capabilities == null) return false

        // NET_CAPABILITY_NOT_VPN is absent when a VPN is active
        return !capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_NOT_VPN)
    }

    // ── Proxy Detection ─────────────────────────────────────────────────────

    private fun detectProxy(): Boolean {
        val proxyHost = System.getProperty("http.proxyHost")
        val proxyPort = System.getProperty("http.proxyPort")
        return !proxyHost.isNullOrBlank() && !proxyPort.isNullOrBlank()
    }

    // ── Connection Type ─────────────────────────────────────────────────────

    private fun getConnectionType(capabilities: NetworkCapabilities?): String {
        if (capabilities == null) return "none"

        return when {
            capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)     -> "wifi"
            capabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) -> "cellular"
            capabilities.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET) -> "ethernet"
            capabilities.hasTransport(NetworkCapabilities.TRANSPORT_VPN)      -> "vpn"
            else -> "unknown"
        }
    }

    // ── Local IP Address ────────────────────────────────────────────────────

    private fun getLocalIpAddress(): String {
        try {
            val interfaces = NetworkInterface.getNetworkInterfaces() ?: return "0.0.0.0"
            for (networkInterface in interfaces) {
                if (networkInterface.isLoopback || !networkInterface.isUp) continue
                val addresses = networkInterface.inetAddresses
                for (address in addresses) {
                    if (!address.isLoopbackAddress && address is Inet4Address) {
                        return address.hostAddress ?: "0.0.0.0"
                    }
                }
            }
        } catch (_: Exception) {
            // Graceful degradation — network signals are supplementary
        }
        return "0.0.0.0"
    }
}
