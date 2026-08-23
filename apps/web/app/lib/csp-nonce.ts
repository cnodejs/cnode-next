import { useContext } from "react";
import { UNSAFE_FrameworkContext } from "react-router";

export function useCspNonce() {
  return useContext(UNSAFE_FrameworkContext)?.nonce;
}
