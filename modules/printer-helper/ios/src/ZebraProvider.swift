import Foundation
import UIKit

class ZebraProvider: PrintProviderProtocol {
    let brand = "Zebra"
    var printerIP = ""
    var printerModel = ""
    var status = "Pending init"

    var onError: ((_ source: String, _ message: String) -> Void)?
    var onEvent: ((_ eventType: String, _ source: String, _ message: String) -> Void)?

    func scan() -> [String] {
        let addresses = ZebraBridge.discoverPrinters(withTimeout: 15000)
        let result = addresses.map { "Zebra Printer~\($0)" }
        onEvent?("Scan", "ZebraProvider.swift", "Scan - \(result.count)")
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

        onEvent?("Model Selected", "ZebraProvider.swift", "Printer Model - \(printerModel)")
    }

    func configure() {
        // Reserved for future configuration
    }

    func printImages(_ imageURIs: [String]) {
        for uriString in imageURIs {
            guard let url = URL(string: uriString),
                  let data = try? Data(contentsOf: url),
                  let image = UIImage(data: data),
                  let cgImage = image.cgImage else { continue }

            if let errorMessage = ZebraBridge.printImage(cgImage, toIp: printerIP, port: 9100) {
                onError?("ZebraProvider.swift", "Error - Print: \(errorMessage)")
            } else {
                onEvent?("Print", "ZebraProvider.swift", "Success - Print Image")
            }
        }
    }
}
