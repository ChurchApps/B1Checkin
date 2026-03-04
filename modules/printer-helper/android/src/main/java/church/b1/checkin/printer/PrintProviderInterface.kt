package church.b1.checkin.printer

import android.content.Context
import android.graphics.Bitmap

interface PrintProviderInterface {
    val brand: String
    var onError: ((source: String, message: String) -> Unit)?
    var onEvent: ((eventType: String, source: String, message: String) -> Unit)?
    fun scan(): Array<String>
    fun checkInit(context: Context, ip: String, model: String)
    fun configure()
    fun printBitmaps(bmps: List<Bitmap>)
}
