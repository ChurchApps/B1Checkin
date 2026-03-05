import React from "react";
import { View, Text } from "react-native";
import { WebView } from "react-native-webview";
import ViewShot, { captureRef } from "react-native-view-shot";
import { useTranslation } from "react-i18next";
import { Styles } from "../helpers";
import * as PrinterHelper from "printer-helper";

interface Props {
  htmlLabels: string[],
  onPrintComplete: () => void
}

const PrintUI = (props: Props) => {
  const { t } = useTranslation();
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
      PrinterHelper.printUris(urisCopy.toString());
      resetPrint();
      props.onPrintComplete();
    }
  };

  const handleHtmlLoaded = async () => {
    if (firstTag) setFirstTag(false);
    captureRef(shotRef, { format: "jpg", quality: 1 })
      .then(async result => {
        await timeout(500);
        handleCaptureComplete(result);
      })
      .catch(error => {
        console.error("Error capturing print view:", error);
      });
  };

  const loadNextLabel = () => { setHtml(props.htmlLabels[printIndex]); };

  return (
    <>
      <Text style={Styles.H1}>{t("print.printing")}</Text>
      <View style={{ flex: 1, opacity: 1 }}>
        <ViewShot ref={shotRef} style={Styles.viewShot}>
          <WebView source={{ html: html }} style={Styles.webView} />
        </ViewShot>
      </View>
    </>
  );
};
export default PrintUI;
