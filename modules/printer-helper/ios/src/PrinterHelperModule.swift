import ExpoModulesCore
import BRLMPrinterKit

public class PrinterHelperModule: Module {
    private var providers: [String: PrintProviderProtocol] = [:]
    private var activeProvider: PrintProviderProtocol?

    private func setupProviders() {
        var brother = BrotherProvider()
        brother.onError = { [weak self] source, message in
            self?.sendEvent("onError", ["source": source, "message": message])
        }
        brother.onEvent = { [weak self] eventType, source, message in
            self?.sendEvent("onEvent", ["eventType": eventType, "source": source, "message": message])
        }
        providers["Brother"] = brother

        // Zebra not yet supported on iOS (SDK not available)
        // TODO: Add ZebraProvider when Zebra iOS SDK is obtained
    }

    public func definition() -> ModuleDefinition {
        Name("PrinterHelper")

        Events("StatusUpdated", "onError", "onEvent")

        OnCreate {
            self.setupProviders()
        }

        AsyncFunction("scan") { () -> String in
            var allResults: [String] = []
            let group = DispatchGroup()
            let lock = NSLock()

            for (brand, provider) in self.providers {
                group.enter()
                DispatchQueue.global().async {
                    let results = provider.scan()
                    let prefixed = results.map { "\(brand)~\($0)" }
                    lock.lock()
                    allResults.append(contentsOf: prefixed)
                    lock.unlock()
                    group.leave()
                }
            }

            group.wait()
            return allResults.joined(separator: ",")
        }

        Function("checkInit") { (ip: String, model: String, brand: String) in
            let providerBrand = brand.isEmpty ? "Brother" : brand
            self.activeProvider = self.providers[providerBrand] ?? self.providers["Brother"]
            self.activeProvider?.checkInit(ip: ip, model: model)
            if let status = self.activeProvider?.status {
                self.sendEvent("StatusUpdated", ["status": status])
            }
        }

        Function("printUris") { (uriList: String) in
            let uris = uriList.components(separatedBy: ",").filter { !$0.isEmpty }
            self.activeProvider?.printImages(uris)
        }

        Function("configure") {
            self.activeProvider?.configure()
        }

        Function("getStatus") { () -> String in
            return self.activeProvider?.status ?? "No Printer"
        }
    }
}
