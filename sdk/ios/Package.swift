// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "FraudShield",
    platforms: [
        .iOS(.v14)
    ],
    products: [
        .library(
            name: "FraudShield",
            targets: ["FraudShield"]
        ),
    ],
    dependencies: [],
    targets: [
        .target(
            name: "FraudShield",
            dependencies: [],
            path: "Sources/FraudShield"
        ),
        .testTarget(
            name: "FraudShieldTests",
            dependencies: ["FraudShield"],
            path: "Tests/FraudShieldTests"
        ),
    ]
)
