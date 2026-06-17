import { BatteryFull, Wifi } from "@untitledui/icons";
import { cx } from "@/utils/cx";

/** Barra de status fake do iOS (hora + sinal/wifi/bateria). */
export const StatusBar = ({ tone = "dark" }: { tone?: "light" | "dark" }) => (
    <div className={cx("flex items-center justify-between px-6 pt-3 pb-1", tone === "light" ? "text-white" : "text-primary")}>
        <span className="text-sm font-semibold tabular-nums">19:46</span>
        <div className="flex items-center gap-1.5">
            <div className="flex items-end gap-0.5">
                <span className="h-1.5 w-1 rounded-xs bg-current" />
                <span className="h-2 w-1 rounded-xs bg-current" />
                <span className="h-2.5 w-1 rounded-xs bg-current" />
                <span className="h-3 w-1 rounded-xs bg-current" />
            </div>
            <Wifi className="size-4" />
            <BatteryFull className="size-5" />
        </div>
    </div>
);
