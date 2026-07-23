import { useState, useEffect } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/zh-cn";

dayjs.extend(relativeTime);
dayjs.locale("zh-cn");

export function TimeAgo({ date }: { date: string | Date | null | undefined }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  if (!date) return <span>-</span>;
  const value = dayjs(date);
  if (!value.isValid()) return <span>-</span>;
  return <span>{value.fromNow()}</span>;
}
