import { Component, ComponentEvent, managed } from "../../core";
import { UIRenderableController } from "../UIRenderableController";

/** Renderable wrapper that controls selection state across components, by emitting `Deselect` events for previously selected components upon `Select` events on newly selected components */
export class UISelectionController extends UIRenderableController {
  /** Currently selected component, if any */
  @managed
  selected?: Component;

  /** Handle Select events, remember the (original) source component and deselect the previously selected component, if any */
  protected onSelect(e: ComponentEvent): boolean | void {
    if (e.source === this.selected) return;
    while (e.inner instanceof ComponentEvent && e.inner.name === "Select") {
      e = e.inner;
      if (e.source === this.selected) return;
    }
    let old = this.selected;
    this.selected = e.source;
    if (old && old.managedState) old.emitAction("Deselect");
  }

  /** Handle Deselect events (only if their source is the currently selected component) */
  protected onDeselect(e: ComponentEvent): boolean | void {
    if (e.source === this.selected) this.selected = undefined;
    while (e.inner instanceof ComponentEvent && e.inner.name === "Deselect") {
      e = e.inner;
      if (e.source === this.selected) this.selected = undefined;
    }
  }
}
