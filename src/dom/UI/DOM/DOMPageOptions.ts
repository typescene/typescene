/** Collection of options that control page rendering */
export interface DOMPageOptions {
    /** The z-index style property of the page and all content (default 1000) */
    baseZIndex: number;

    /** Timing (ms) for the modal "shade" in/out animation (default 200) */
    shadeTransition: number;

    /** Opacity level (0-1) for the modal "shade" backdrop (default 0.2) */
    shadeOpacity: number;

    /** CSS base color for the modal "shade" backdrop (default "#000") */
    shadeColor: string;
}

/** Options that control page rendering */
export const PAGE_OPTIONS: DOMPageOptions = {
    baseZIndex: 1000,
    shadeTransition: 200,
    shadeOpacity: .2,
    shadeColor: "#000"
};
