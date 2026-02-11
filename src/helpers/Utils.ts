import Snackbar from "react-native-snackbar";
import { StyleConstants } from "./Styles";

export class Utils {

  public static snackBar(message: string) {
    Snackbar.show({ text: message, backgroundColor: StyleConstants.baseColor, duration: Snackbar.LENGTH_SHORT });
  }

}
