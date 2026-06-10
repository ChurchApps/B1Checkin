import React from "react";
import { Dimensions, View } from "react-native";
import { WebView } from "react-native-webview";
import ViewShot, { captureRef } from "react-native-view-shot";
import * as PrinterHelper from "printer-helper";

interface Props {
  htmlLabels: string[],
  onPrintComplete: () => void,
  onLog?: (message: string) => void
}

// Frozen at import on purpose — this math defines the captured label bitmap size.
const labelWidth = Dimensions.get("window").width * 0.9;
const labelHeight = Dimensions.get("window").width * 0.9 / 3.5 * 1.1;

const PrintUI = (props: Props) => {
  const log = (message: string) => props.onLog?.(message);
  const shotRef = React.useRef(null);
  const [html, setHtml] = React.useState("");

  const [printIndex, setPrintIndex] = React.useState(-1);
  const [uris, setUris] = React.useState<string[]>([]);
  const [firstTag, setFirstTag] = React.useState(true);
  const timeoutIds = React.useRef<ReturnType<typeof setTimeout>[]>([]);

  React.useEffect(() => { resetPrint(); }, []);
  React.useEffect(() => { setPrintIndex((props.htmlLabels.length === 0) ? -1 : 0); }, [props.htmlLabels]);
  React.useEffect(() => { if (printIndex < props.htmlLabels.length) loadNextLabel(); }, [printIndex]);
  React.useEffect(() => {
    if (html) {
      if (firstTag) timeout(1500).then(handleHtmlLoaded);
      else timeout(300).then(handleHtmlLoaded);
    }
  }, [html]);

  React.useEffect(() => {
    return () => { timeoutIds.current.forEach(id => clearTimeout(id)); };
  }, []);

  const timeout = (ms: number) => new Promise(resolve => {
    const id = setTimeout(() => { resolve(null); }, ms);
    timeoutIds.current.push(id);
  });

  const resetPrint = () => { setPrintIndex(-1); setUris([]); };

  const handleCaptureComplete = (uri: string) => {
    const urisCopy = [...uris];
    urisCopy.push(uri);

    if (printIndex < props.htmlLabels.length - 1) {
      setPrintIndex(printIndex + 1);
      setUris(urisCopy);
    } else {
      log(`Sending ${urisCopy.length} label(s) to native printUris`);
      PrinterHelper.printUris(urisCopy.toString());
      resetPrint();
      props.onPrintComplete();
    }
  };

  const handleHtmlLoaded = async () => {
    if (firstTag) setFirstTag(false);
    captureRef(shotRef, { format: "jpg", quality: 1 })
      .then(async result => {
        log(`Captured label ${printIndex + 1}: ${result}`);
        await timeout(500);
        handleCaptureComplete(result);
      })
      .catch(error => {
        log(`Capture error: ${error?.message ?? String(error)}`);
        console.error("Error capturing print view:", error);
      });
  };

  const loadNextLabel = () => { setHtml(props.htmlLabels[printIndex]); };

  return (
    <View style={{ flex: 1, opacity: 1 }}>
      <ViewShot ref={shotRef} style={{ width: labelWidth, height: labelHeight }}>
        <WebView source={{ html: html }} style={{ width: labelWidth, height: labelHeight }} />
      </ViewShot>
    </View>
  );
};
export default PrintUI;
