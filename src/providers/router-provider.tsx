import { type PropsWithChildren } from "react";
import { RouterProvider } from "react-aria-components";
import { useNavigate, type NavigateOptions } from "react-router";

declare module "react-aria-components" {
    interface RouterConfig {
        routerOptions: NavigateOptions;
    }
}

export const RouteProvider = ({ children }: PropsWithChildren) => {
    const navigate = useNavigate();

    return <RouterProvider navigate={navigate}>{children}</RouterProvider>;
};
