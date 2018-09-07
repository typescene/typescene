import { AppActivationContext } from "./AppActivationContext";
import { AppComponent } from "./AppComponent";
import { Application } from "./Application";
export declare class AppActivity extends AppComponent {
    static preset(presets: AppActivity.Presets): Function;
    constructor(name?: string, path?: string);
    name?: string;
    path?: string;
    readonly match: Readonly<AppActivationContext.MatchedPath> | undefined;
    getParentActivity(): AppActivity | undefined;
    getApplication(): Application | undefined;
    activateAsync(match?: AppActivationContext.MatchedPath): Promise<void>;
    deactivateAsync(): Promise<void>;
    destroyAsync(): Promise<void>;
    isActive(): boolean;
    deactivated?: number;
    private _matchedPath?;
}
export declare namespace AppActivity {
    interface Presets {
        name?: string;
        path?: string;
    }
}
