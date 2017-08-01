import { Container, ComponentFactory } from "../../../UI";
import { layoutFragment } from "../ViewLayout";
import { BaseLayout } from "./Base";

/** Represents a strictly vertical layout that contains a header container fragment and a footer container fragment; all other content will be added to the main content area */
export class VerticalLayout extends BaseLayout.with(self => {
    self.bindFragment("header", "Header");
    self.bindFragment("footer", "Footer");
}) {
    /** Layout fragment for the container's fixed header */
    @layoutFragment
    static Header: typeof Container = Container.with();

    /** Layout fragment for the container's fixed footer */
    @layoutFragment
    static Footer: typeof Container = Container.with();
}

/** Represents a strictly vertical layout that contains a header container fragment and a footer container fragment, all other content will be added to the _scrollable_ main content container */
export class ScrollableLayout extends VerticalLayout.with({
    scrollable: true
}) {
    /** Layout fragment for the scrollable container's fixed header */
    static Header: typeof VerticalLayout.Header;

    /** Layout fragment for the scrollable container's fixed footer */
    static Footer: typeof VerticalLayout.Footer;
}
