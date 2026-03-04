import ExpoModulesCore
import BRLMPrinterKit

public class PrinterHelperModule: Module {
    private let provider = BrotherProvider()

    public func definition() -> ModuleDefinition {
        Name("PrinterHelper")

        Events("StatusUpdated", "onError", "onEvent")

        provider.onError = { [weak self] source, message in
            self?.sendEvent("onError", ["source": source, "message": message])
        }

        provider.onEvent = { [weak self] eventType, source, message in
            self?.sendEvent("onEvent", ["eventType": eventType, "source": source, "message": message])
        }

        AsyncFunction("scan") { () -> String in
            let results = self.provider.scan()
            return results.joined(separator: ",")
        }

        Function("checkInit") { (ip: String, model: String) in
            self.provider.checkInit(ip: ip, model: model)
            self.sendEvent("StatusUpdated", ["status": self.provider.status])
        }

        Function("printUris") { (uriList: String) in
            let uris = uriList.components(separatedBy: ",").filter { !$0.isEmpty }
            self.provider.printImages(uris)
        }

        Function("configure") {
            self.provider.configure()
        }

        Function("getStatus") { () -> String in
            return self.provider.status
        }
    }
}
