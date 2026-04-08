// Redirect /screen-share → /shop
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function ScreenShareRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/shop"); }, []);
  return null;
}
