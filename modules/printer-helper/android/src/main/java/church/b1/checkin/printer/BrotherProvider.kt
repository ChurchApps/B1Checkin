package church.b1.checkin.printer

import android.content.Context
import android.graphics.Bitmap
import android.util.Log

import com.brother.ptouch.sdk.NetPrinter
import com.brother.ptouch.sdk.Printer
import com.brother.sdk.lmprinter.Channel
import com.brother.sdk.lmprinter.OpenChannelError
import com.brother.sdk.lmprinter.PrintError
import com.brother.sdk.lmprinter.PrinterDriverGenerator
import com.brother.sdk.lmprinter.PrinterModel
import com.brother.sdk.lmprinter.setting.PrintImageSettings
import com.brother.sdk.lmprinter.setting.QLPrintSettings

class BrotherProvider {
    var context: Context? = null
    var readyToPrint = false
    var printerIP = ""
    var printerModel = "QL-1110NWB"

    var onError: ((source: String, message: String) -> Unit)? = null
    var onEvent: ((eventType: String, source: String, message: String) -> Unit)? = null

    fun scan(): Array<String> {
        val result = mutableListOf<String>()
        val printers = Printer()
        val models = arrayOf(
            "QL-1100", "QL-1110NWB", "QL-580N", "QL-710W",
            "QL-720NW", "QL-800", "QL-810W", "QL-820NWB", "QL-1115NWB"
        )
        val printerList = printers.getNetPrinters(models)

        for (printer in printerList) {
            result.add("${printer.modelName}~${printer.ipAddress}")
        }

        onEvent?.invoke("Scan", "BrotherProvider.kt", "Scan - ${result.size}")
        return result.toTypedArray()
    }

    fun checkInit(c: Context, ip: String, model: String) {
        printerIP = ip
        printerModel = model
        context = c
        onEvent?.invoke("Model Selected", "BrotherProvider.kt", "Printer Model - $printerModel")
    }

    fun configure() {
        // Reserved for future configuration
    }

    private fun getPrinterSettings(): QLPrintSettings {
        val settings = when (printerModel) {
            "Brother QL-1100" -> QLPrintSettings(PrinterModel.QL_1100)
            "Brother QL-580N" -> QLPrintSettings(PrinterModel.QL_580N)
            "Brother QL-710W" -> QLPrintSettings(PrinterModel.QL_710W)
            "Brother QL-720NW" -> QLPrintSettings(PrinterModel.QL_720NW)
            "Brother QL-800" -> QLPrintSettings(PrinterModel.QL_800)
            "Brother QL-810W" -> QLPrintSettings(PrinterModel.QL_810W)
            "Brother QL-820NWB" -> QLPrintSettings(PrinterModel.QL_820NWB)
            "Brother QL-1115NWB" -> QLPrintSettings(PrinterModel.QL_1115NWB)
            else -> QLPrintSettings(PrinterModel.QL_1110NWB)
        }
        return settings
    }

    fun printBitmaps(bmps: List<Bitmap>) {
        val channel = Channel.newWifiChannel(printerIP)
        val result = PrinterDriverGenerator.openChannel(channel)

        if (result.error.code != OpenChannelError.ErrorCode.NoError) {
            onError?.invoke("BrotherProvider.kt", "Error - Open Channel: ${result.error.code}")
            return
        }

        val dir = context?.getExternalFilesDir(null)
        val printerDriver = result.driver
        val printSettings = getPrinterSettings()

        printSettings.setPrintOrientation(PrintImageSettings.Orientation.Landscape)
        printSettings.setLabelSize(QLPrintSettings.LabelSize.DieCutW29H90)
        printSettings.setAutoCut(true)
        printSettings.setWorkPath(dir.toString())

        for (bmp in bmps) {
            val printError = printerDriver.printImage(bmp, printSettings)
            if (printError.code != PrintError.ErrorCode.NoError) {
                onError?.invoke("BrotherProvider.kt", "Error - Print Image: ${printError.code} - ${printError.errorDescription}")
            } else {
                onEvent?.invoke("Print", "BrotherProvider.kt", "Success - Print Image")
            }
        }

        printerDriver.closeChannel()
    }
}
