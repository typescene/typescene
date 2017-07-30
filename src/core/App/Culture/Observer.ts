import Async, { Signal } from "../../Async";
import { Screen, TextLabelFactory } from "../../UI";
import { injectService } from "../Service";
import { CultureService } from "./CultureService";

/** Helper class used to subscribe to culture changes and update UI module properties */
class Observer {
    constructor() {
        var currentCulture: CultureService | undefined;
        Async.observe(() => this.culture).subscribe(culture => {
            if (currentCulture && currentCulture !== culture) {
                // emit global signal
                CultureChanged(culture);
            }
            if (culture) {
                // update global flow direction
                Screen.defaultFlowDirection = culture.textFlowDirection;
            }
            currentCulture = culture;
        });
        Async.inject(TextLabelFactory, {
            ["@translateText"]: (text: string) => {
                // translate according to current culture (set above)
                return currentCulture ? currentCulture.translateText(text) : "";
            },
            ["@pluralizeText"]: (n: number, forms: string[]) => {
                // pluralize according to current culture (set above)
                return currentCulture ? currentCulture.pluralizeText(n, forms) : "";
            }
        })
    }

    @injectService("culture")
    public culture: CultureService;
}

// create an instance to start observing
Async.defer(() => { new Observer() });

/** Signal that is emitted when the global i18n culture changes (through `CultureService`) */
export const CultureChanged = Signal.create<CultureService>();
