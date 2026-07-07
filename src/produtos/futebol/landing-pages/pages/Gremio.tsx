import { TimeLanding } from "../components/TimeLanding";
import { timeById } from "../data/times";

export function Gremio() {
    return <TimeLanding time={timeById("gremio")!} />;
}
