declare module "@env" {
  export const CONTENT_ROOT: string;
  export const MEMBERSHIP_API: string;
  export const ATTENDANCE_API: string;
  export const STAGE: string | undefined;
}

declare module "react-native-qrcode-svg" {
  import { Component } from "react";
  interface QRCodeProps {
    value: string;
    size?: number;
    color?: string;
    backgroundColor?: string;
    logo?: any;
    logoSize?: number;
    logoBackgroundColor?: string;
    logoMargin?: number;
    logoBorderRadius?: number;
    quietZone?: number;
    enableLinearGradient?: boolean;
    gradientDirection?: string[];
    linearGradient?: string[];
    ecl?: "L" | "M" | "Q" | "H";
    getRef?: (ref: any) => void;
    onError?: (error: Error) => void;
  }
  export default class QRCode extends Component<QRCodeProps> {}
}
