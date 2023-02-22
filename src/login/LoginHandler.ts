import { InternalRoutes,Routes } from "https://deno.land/x/rutt@0.0.14/mod.ts";

export interface LoginHandler {
    getRoute(env:Record<string,string>): Routes<unknown> | InternalRoutes<unknown>;
}