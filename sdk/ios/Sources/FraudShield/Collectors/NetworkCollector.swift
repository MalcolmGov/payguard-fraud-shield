import Foundation
import Network
import CoreLocation

struct NetworkSignals {
    let ipAddress: String
    let isVpnActive: Bool
    let isProxySet: Bool
    let connectionType: String
    let latitude: Double?
    let longitude: Double?
}

class NetworkCollector {

    func collect() async -> NetworkSignals {
        return NetworkSignals(
            ipAddress: await getIPAddress(),
            isVpnActive: detectVPN(),
            isProxySet: detectProxy(),
            connectionType: getConnectionType(),
            latitude: nil, // Location collected separately with user permission
            longitude: nil
        )
    }

    private func getIPAddress() async -> String {
        var address = "unknown"
        var ifaddr: UnsafeMutablePointer<ifaddrs>?
        guard getifaddrs(&ifaddr) == 0 else { return address }
        defer { freeifaddrs(ifaddr) }

        var ptr = ifaddr
        while ptr != nil {
            defer { ptr = ptr?.pointee.ifa_next }
            let interface = ptr!.pointee
            let addrFamily = interface.ifa_addr.pointee.sa_family
            if addrFamily == UInt8(AF_INET) {
                let name = String(cString: interface.ifa_name)
                if name == "en0" || name == "pdp_ip0" {
                    var hostname = [CChar](repeating: 0, count: Int(NI_MAXHOST))
                    getnameinfo(interface.ifa_addr, socklen_t(interface.ifa_addr.pointee.sa_len),
                                &hostname, socklen_t(hostname.count), nil, 0, NI_NUMERICHOST)
                    address = String(cString: hostname)
                }
            }
        }
        return address
    }

    private func detectVPN() -> Bool {
        // Check for utun (VPN tunnel) network interfaces
        var ifaddr: UnsafeMutablePointer<ifaddrs>?
        guard getifaddrs(&ifaddr) == 0 else { return false }
        defer { freeifaddrs(ifaddr) }

        var ptr = ifaddr
        while ptr != nil {
            defer { ptr = ptr?.pointee.ifa_next }
            let name = String(cString: ptr!.pointee.ifa_name)
            if name.hasPrefix("utun") || name.hasPrefix("tun") || name.hasPrefix("tap") {
                return true
            }
        }
        return false
    }

    private func detectProxy() -> Bool {
        guard let proxySettings = CFNetworkCopySystemProxySettings()?.takeRetainedValue() as? [String: Any] else {
            return false
        }
        let httpEnabled = (proxySettings["HTTPEnable"] as? Int) == 1
        let httpsEnabled = (proxySettings["HTTPSEnable"] as? Int) == 1
        return httpEnabled || httpsEnabled
    }

    private func getConnectionType() -> String {
        let monitor = NWPathMonitor()
        let path = monitor.currentPath
        return switch path.usesInterfaceType(.wifi) {
        case true: "WIFI"
        default: path.usesInterfaceType(.cellular) ? "CELLULAR" : "OTHER"
        }
    }
}
