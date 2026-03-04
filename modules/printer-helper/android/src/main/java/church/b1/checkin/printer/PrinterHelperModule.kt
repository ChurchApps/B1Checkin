package church.b1.checkin.printer

import android.graphics.Bitmap
import android.net.Uri
import android.provider.MediaStore
import androidx.core.os.bundleOf
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class PrinterHelperModule : Module() {
    private val provider = BrotherProvider()
    private var status = "Pending init"

    override fun definition() = ModuleDefinition {
        Name("PrinterHelper")

        Events("StatusUpdated", "onError", "onEvent")

        provider.onError = { source, message ->
            sendEvent("onError", bundleOf("source" to source, "message" to message))
        }

        provider.onEvent = { eventType, source, message ->
            sendEvent("onEvent", bundleOf("eventType" to eventType, "source" to source, "message" to message))
        }

        AsyncFunction("scan") {
            val results = provider.scan()
            results.joinToString(",")
        }

        Function("checkInit") { ip: String, model: String ->
            val context = appContext.reactContext ?: return@Function
            provider.checkInit(context, ip, model)
            if (ip.isNotEmpty()) {
                updateStatus(ip)
            } else {
                updateStatus("No Printer")
            }
        }

        Function("printUris") { uriList: String ->
            val context = appContext.reactContext ?: return@Function
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
            provider.configure()
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
