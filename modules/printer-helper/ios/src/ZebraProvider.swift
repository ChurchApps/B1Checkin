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
        let log: (String) -> Void = { [weak self] msg in
            self?.onEvent?("Debug", "ZebraProvider.swift", msg)
        }

        log("printImages start — ip=\(printerIP), labels=\(imageURIs.count)")

        for (index, uriString) in imageURIs.enumerated() {
            // react-native-view-shot returns a bare filesystem path on iOS (no
            // "file://" scheme), so build a proper file URL before loading it.
            let path = uriString.hasPrefix("file://")
                ? (URL(string: uriString)?.path ?? uriString)
                : uriString
            let url = URL(fileURLWithPath: path)

            let exists = FileManager.default.fileExists(atPath: path)
            log("Label \(index + 1)/\(imageURIs.count): uri=\(uriString)")
            log("  -> path=\(path) exists=\(exists)")

            guard let data = try? Data(contentsOf: url),
                  let image = UIImage(data: data),
                  let cgImage = image.cgImage else {
                onError?("ZebraProvider.swift", "Could not load image for label \(index + 1) at \(path)")
                continue
            }

            if let errorMessage = ZebraBridge.printImage(cgImage, toIp: printerIP, port: 9100) {
                onError?("ZebraProvider.swift", "Print failed for label \(index + 1): \(errorMessage)")
            } else {
                onEvent?("Print", "ZebraProvider.swift", "Success — label \(index + 1) sent to printer")
            }
        }

        log("printImages complete")
    }
}
