package church.b1.checkin.printer

import android.content.Context
import android.graphics.Bitmap
import com.zebra.sdk.comm.Connection
import com.zebra.sdk.comm.TcpConnection
import com.zebra.sdk.graphics.internal.ZebraImageAndroid
import com.zebra.sdk.printer.ZebraPrinter
import com.zebra.sdk.printer.ZebraPrinterFactory
import com.zebra.sdk.printer.discovery.DiscoveredPrinter
import com.zebra.sdk.printer.discovery.DiscoveryHandler
import com.zebra.sdk.printer.discovery.NetworkDiscoverer
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

class ZebraProvider : PrintProviderInterface {
    override val brand = "Zebra"
    var context: Context? = null
    var printerIP = ""
    var printerModel = ""

    override var onError: ((source: String, message: String) -> Unit)? = null
    override var onEvent: ((eventType: String, source: String, message: String) -> Unit)? = null

    override fun scan(): Array<String> {
        val result = mutableListOf<String>()
        val latch = CountDownLatch(1)
        try {
            NetworkDiscoverer.findPrinters(object : DiscoveryHandler {
                override fun foundPrinter(printer: DiscoveredPrinter) {
                    val model = printer.discoveryDataMap["MODEL"] ?: "Zebra Printer"
                    val ip = printer.discoveryDataMap["ADDRESS"] ?: return
                    result.add("$model~$ip")
                }

                override fun discoveryFinished() {
                    latch.countDown()
                }

                override fun discoveryError(message: String?) {
                    onError?.invoke("ZebraProvider.kt", "Error - Scan: $message")
                    latch.countDown()
                }
            })
            latch.await(15, TimeUnit.SECONDS)
        } catch (e: Exception) {
            onError?.invoke("ZebraProvider.kt", "Error - Scan: ${e.message}")
        }
        onEvent?.invoke("Scan", "ZebraProvider.kt", "Scan - ${result.size}")
        return result.toTypedArray()
    }

    override fun checkInit(ctx: Context, ip: String, model: String) {
        printerIP = ip
        printerModel = model
        context = ctx
        onEvent?.invoke("Model Selected", "ZebraProvider.kt", "Printer Model - $printerModel")
    }

    override fun configure() {
        // Reserved for future configuration
    }

    override fun printBitmaps(bmps: List<Bitmap>) {
        var connection: Connection? = null
        try {
            connection = TcpConnection(printerIP, TcpConnection.DEFAULT_ZPL_TCP_PORT)
            connection.open()
            val printer: ZebraPrinter = ZebraPrinterFactory.getInstance(connection)

            for (bmp in bmps) {
                val zebraImage = ZebraImageAndroid(bmp)
                printer.printImage(zebraImage, 0, 0, bmp.width, bmp.height, false)
                onEvent?.invoke("Print", "ZebraProvider.kt", "Success - Print Image")
            }
        } catch (e: Exception) {
            onError?.invoke("ZebraProvider.kt", "Error - Print: ${e.message}")
        } finally {
            try {
                connection?.close()
            } catch (_: Exception) {}
        }
    }
}
