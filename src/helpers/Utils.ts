import { Toast, ToastTone } from "../components/ui/Toast";

export class Utils {

  public static snackBar(message: string, tone: ToastTone = "info") {
    Toast.show(message, tone);
  }

}
