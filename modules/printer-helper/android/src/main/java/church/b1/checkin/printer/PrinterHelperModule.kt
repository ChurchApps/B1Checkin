package church.b1.checkin.printer

import android.graphics.Bitmap
import android.net.Uri
import android.provider.MediaStore
import androidx.core.os.bundleOf
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.concurrent.Executors

class PrinterHelperModule : Module() {
    private val providers: Map<String, PrintProviderInterface> = mapOf(
        "Brother" to BrotherProvider(),
        "Zebra" to ZebraProvider()
    )
    private var activeProvider: PrintProviderInterface? = null
    private var status = "Pending init"

    override fun definition() = ModuleDefinition {
        Name("PrinterHelper")

        Events("StatusUpdated", "onError", "onEvent")

        // Wire up callbacks for all providers
        for ((_, provider) in providers) {
            provider.onError = { source, message ->
                sendEvent("onError", bundleOf("source" to source, "message" to message))
            }
            provider.onEvent = { eventType, source, message ->
                sendEvent("onEvent", bundleOf("eventType" to eventType, "source" to source, "message" to message))
            }
        }

        AsyncFunction("scan") {
            val executor = Executors.newFixedThreadPool(providers.size)
            val futures = providers.map { (brand, provider) ->
                brand to executor.submit<Array<String>> { provider.scan() }
            }

            val allResults = mutableListOf<String>()
            for ((brand, future) in futures) {
                try {
                    val results = future.get()
                    for (result in results) {
                        allResults.add("$brand~$result")
                    }
                } catch (_: Exception) {
                    // Skip providers that fail to scan
                }
            }
            executor.shutdown()

            allResults.joinToString(",")
        }

        Function("checkInit") { ip: String, model: String, brand: String ->
            val context = appContext.reactContext ?: return@Function
            val providerBrand = brand.ifEmpty { "Brother" }
            activeProvider = providers[providerBrand] ?: providers["Brother"]
            activeProvider?.checkInit(context, ip, model)
            if (ip.isNotEmpty()) {
                updateStatus(ip)
            } else {
                updateStatus("No Printer")
            }
        }

        Function("printUris") { uriList: String ->
            val context = appContext.reactContext ?: return@Function
            val provider = activeProvider ?: return@Function
            val uris = uriList.split(",")
            val bmps = mutableListOf<Bitmap>()

            for (uriString in uris) {
                try {
                    val uri = Uri.parse(uriString)
                    @Suppress("DEPRECATION")
                    val bitmap = MediaStore.Images.Media.getBitmap(context.contentResolver, uri)
                    bmps.add(bitmap)
                } catch (_: Exception) {
                    // Skip invalid URIs
                }
            }

            if (bmps.isNotEmpty()) {
                provider.printBitmaps(bmps)
            }
        }

        Function("configure") {
            activeProvider?.configure()
        }

        Function("getStatus") {
            status
        }
    }

    private fun updateStatus(newStatus: String) {
        status = newStatus
        sendEvent("StatusUpdated", bundleOf("status" to status))
    }
}
