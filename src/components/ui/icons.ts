import { ComponentProps } from "react";
import { MaterialIcons } from "@expo/vector-icons";

export type IconName = ComponentProps<typeof MaterialIcons>["name"];
