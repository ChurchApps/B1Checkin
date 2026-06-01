import Foundation
import UIKit
import BRLMPrinterKit

class BrotherProvider: PrintProviderProtocol {
    let brand = "Brother"
    var printerIP = ""
    var printerModel = "QL-1110NWB"
    var status = "Pending init"

    var onError: ((_ source: String, _ message: String) -> Void)?
    var onEvent: ((_ eventType: String, _ source: String, _ message: String) -> Void)?

    func scan() -> [String] {
        var result: [String] = []
        let option = BRLMNetworkSearchOption()
        option.searchDuration = 15
        option.printerList = [
            "Brother QL-1100", "Brother QL-1110NWB", "Brother QL-580N",
            "Brother QL-710W", "Brother QL-720NW", "Brother QL-800",
            "Brother QL-810W", "Brother QL-820NWB", "Brother QL-1115NWB"
        ]

        _ = BRLMPrinterSearcher.startNetworkSearch(option) { channel in
            let modelName = channel.extraInfo?.value(forKey: BRLMChannelExtraInfoKeyModelName) as? String ?? ""
            let ipAddress = channel.channelInfo
            result.append("\(modelName)~\(ipAddress)")
        }

        onEvent?("Scan", "BrotherProvider.swift", "Scan - \(result.count)")
        return result
    }

    func checkInit(ip: String, model: String) {
        printerIP = ip
        printerModel = model

        if !printerIP.isEmpty {
            status = printerIP
        } else {
            status = "No Printer"
        }

        onEvent?("Model Selected", "BrotherProvider.swift", "Printer Model - \(printerModel)")
    }

    func configure() {
        // Reserved for future configuration
    }

    private func getPrinterModel() -> BRLMPrinterModel {
        switch printerModel {
        // The bundled BRLMPrinterKit.xcframework does not define enum cases for
        // the QL-1100, QL-580N, or QL-800 models, so each is mapped to its
        // same-hardware-family sibling. These share DK label media handling, so
        // the default print settings are equivalent for label printing:
        //   QL-1100  -> QL-1110NWB (same hardware; 1110NWB adds network/BT)
        //   QL-580N  -> QL-720NW   (700-series successor; network variant)
        //   QL-800   -> QL-810W    (same 800 family; 810W adds WiFi)
        case "Brother QL-1100": return .QL_1110NWB
        case "Brother QL-1110NWB": return .QL_1110NWB
        case "Brother QL-580N": return .QL_720NW
        case "Brother QL-710W": return .QL_710W
        case "Brother QL-720NW": return .QL_720NW
        case "Brother QL-800": return .QL_810W
        case "Brother QL-810W": return .QL_810W
        case "Brother QL-820NWB": return .QL_820NWB
        case "Brother QL-1115NWB": return .QL_1115NWB
        default: return .QL_1110NWB
        }
    }

    func printImages(_ imageURIs: [String]) {
        let log: (String) -> Void = { [weak self] msg in
            self?.onEvent?("Debug", "BrotherProvider.swift", msg)
        }

        log("printImages start — ip=\(printerIP), model=\(printerModel), labels=\(imageURIs.count)")

        let channel = BRLMChannel(wifiIPAddress: printerIP)
        let generateResult = BRLMPrinterDriverGenerator.open(channel)

        guard generateResult.error.code == .noError,
              let printerDriver = generateResult.driver else {
            onError?("BrotherProvider.swift", "Open Channel failed: \(generateResult.error.code) (raw \(generateResult.error.code.rawValue)) for ip=\(printerIP)")
            return
        }
        log("Channel opened to \(printerIP)")

        defer {
            printerDriver.closeChannel()
        }

        guard let printSettings = BRLMQLPrintSettings(defaultPrintSettingsWith: getPrinterModel()) else {
            onError?("BrotherProvider.swift", "Could not create print settings for model: \(printerModel)")
            return
        }

        printSettings.labelSize = .dieCutW29H90
        printSettings.autoCut = true
        printSettings.printOrientation = .landscape
        log("Settings ready — sdkModel=\(getPrinterModel().rawValue), labelSize=dieCutW29H90, autoCut=true, orientation=landscape")

        for (index, uriString) in imageURIs.enumerated() {
            // react-native-view-shot returns a bare filesystem path on iOS (no
            // "file://" scheme), so build a proper file URL. URL(string:) on a
            // schemeless path produces a non-file URL the Brother SDK can't read.
            let path = uriString.hasPrefix("file://")
                ? (URL(string: uriString)?.path ?? uriString)
                : uriString
            let url = URL(fileURLWithPath: path)

            let exists = FileManager.default.fileExists(atPath: path)
            let attrs = try? FileManager.default.attributesOfItem(atPath: path)
            let size = (attrs?[.size] as? Int).map { "\($0) bytes" } ?? "n/a"
            log("Label \(index + 1)/\(imageURIs.count): uri=\(uriString)")
            log("  -> path=\(path) exists=\(exists) size=\(size)")
            log("  -> fileURL=\(url.absoluteString)")

            if !exists {
                onError?("BrotherProvider.swift", "Label \(index + 1): file not found at \(path)")
                continue
            }

            let printError = printerDriver.printImage(with: url, settings: printSettings)

            if printError.code != .noError {
                onError?("BrotherProvider.swift", "Print failed for label \(index + 1): \(printError.code) (raw \(printError.code.rawValue))")
            } else {
                onEvent?("Print", "BrotherProvider.swift", "Success — label \(index + 1) sent to printer")
            }
        }

        log("printImages complete")
    }
}
