import Foundation
import UIKit
import BRLMPrinterKit

class BrotherProvider {
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
        case "Brother QL-1100": return .QL_1100
        case "Brother QL-1110NWB": return .QL_1110NWB
        case "Brother QL-580N": return .QL_580N
        case "Brother QL-710W": return .QL_710W
        case "Brother QL-720NW": return .QL_720NW
        case "Brother QL-800": return .QL_800
        case "Brother QL-810W": return .QL_810W
        case "Brother QL-820NWB": return .QL_820NWB
        case "Brother QL-1115NWB": return .QL_1115NWB
        default: return .QL_1110NWB
        }
    }

    func printImages(_ imageURIs: [String]) {
        let channel = BRLMChannel(wifiIPAddress: printerIP)
        let generateResult = BRLMPrinterDriverGenerator.open(channel)

        guard generateResult.error.code == .noError,
              let printerDriver = generateResult.driver else {
            onError?("BrotherProvider.swift", "Error - Open Channel: \(generateResult.error.code)")
            return
        }

        defer {
            printerDriver.closeChannel()
        }

        guard let printSettings = BRLMQLPrintSettings(defaultPrintSettingsWith: getPrinterModel()) else {
            onError?("BrotherProvider.swift", "Error - Could not create print settings for model: \(printerModel)")
            return
        }

        printSettings.labelSize = .dieCutW29H90
        printSettings.autoCut = true

        for uriString in imageURIs {
            guard let url = URL(string: uriString) else { continue }

            let printError = printerDriver.printImage(with: url, settings: printSettings)

            if printError.code != .noError {
                onError?("BrotherProvider.swift", "Error - Print Image: \(printError.code)")
            } else {
                onEvent?("Print", "BrotherProvider.swift", "Success - Print Image")
            }
        }
    }
}
