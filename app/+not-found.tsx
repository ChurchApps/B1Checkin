import React from "react";
import { router, Stack } from "expo-router";
import { View } from "react-native";
import { Button, EmptyState } from "../src/components/ui";
import { useAppTheme } from "../src/theme";

function NotFoundScreen() {
  const theme = useAppTheme();
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <View style={{ flex: 1, backgroundColor: theme.colors.canvas, alignItems: "center", justifyContent: "center", padding: theme.spacing.xl }}>
        <EmptyState
          icon="explore-off"
          title="This screen doesn't exist."
          action={<Button label="Go to home screen" onPress={() => router.replace("/")} fullWidth />}
        />
      </View>
    </>
  );
}

export default NotFoundScreen;
