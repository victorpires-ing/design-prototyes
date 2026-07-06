import { TimeLanding } from "../components/TimeLanding";
import { timeById } from "../data/times";

export function Botafogo() {
    return <TimeLanding time={timeById("botafogo")!} />;
}
