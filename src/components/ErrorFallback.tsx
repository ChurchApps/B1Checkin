import * as React from "react";
import { View, StyleSheet, Button } from "react-native";

function ErrorFallback(props: any) {
  return (
    <View style={[styles.container]}>
      <Button title="try Again" onPress={props.resetErrorBoundary} />
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, flexDirection: "column", alignItems: "stretch", justifyContent: "center", alignContent: "center", paddingHorizontal: 12 } });
export default ErrorFallback;
