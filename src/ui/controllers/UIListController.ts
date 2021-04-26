import {
  Component,
  ComponentConstructor,
  ComponentEvent,
  ComponentEventHandler,
  managed,
  ManagedEvent,
  ManagedList,
  ManagedListChangeEvent,
  ManagedMap,
  ManagedObject,
} from "../../core";
import { UICloseColumn } from "../containers/UIColumn";
import { UIContainer } from "../containers/UIContainer";
import { UIComponentEvent, UIRenderable } from "../UIComponent";
import { UIRenderableController } from "../UIRenderableController";

/** Generic type definition for a component constructor that accepts a single object argument, and constructs a renderable component; used for creating each component in a list (see `UIListController`). An implementation that uses `UICell` containers is provided by `UIListCellAdapter`. */
export interface UIListItemAdapter<TObject extends ManagedObject = ManagedObject> {
  new (object: TObject): UIRenderable;
}

/** Default container used in the preset method */
const _defaultContainer = UICloseColumn.with({
  accessibleRole: "list",
});

/** Use a resolved promise to make updates async */
const RESOLVED = Promise.resolve();

/** Renderable wrapper that populates an encapsulated container with components, constructed using given view adapter (e.g. preset constructor for `UIListCellAdapter` components); each instance of the view adapter corresponds to exactly one value from a list */
export class UIListController extends UIRenderableController<UIContainer> {
  static preset(
    presets: UIListController.Presets,
    ListItemAdapter?:
      | UIListItemAdapter
      | ((instance: UIListController) => UIListItemAdapter),
    Container: ComponentConstructor<UIContainer> &
      (new () => UIContainer) = _defaultContainer
  ): Function {
    this.presetBindingsFrom(ListItemAdapter as any);
    this.addObserver(
      class {
        constructor(public controller: UIListController) {
          this.Adapter = ListItemAdapter as any;
          if (this.Adapter && !(this.Adapter.prototype instanceof ManagedObject)) {
            this.Adapter = (this.Adapter as any)(this);
          }
        }
        Adapter?: UIListItemAdapter;

        onFocusIn(e: UIComponentEvent) {
          if (e.source !== this.controller.content) {
            // store focus index
            let idx = this.controller.getIndexOfComponent(e.source);
            this.controller.lastFocusedIndex = Math.max(0, idx);
          } else {
            // focus appropriate item
            this.controller.restoreFocus();
          }
        }

        onFirstIndexChangeAsync() {
          return this.controller._doUpdateAsync(this.Adapter);
        }

        onMaxItemsChangeAsync() {
          return this.controller._doUpdateAsync(this.Adapter);
        }

        onItemsChange(_v?: any, e?: ManagedEvent) {
          if (!e || e instanceof ManagedListChangeEvent) {
            this.controller._doUpdateAsync(this.Adapter);
          }
        }
      }
    );
    return super.preset(presets, Container);
  }

  /** Handle FocusIn events, saving the index of the focused item or restoring focus on the item that was focused last */
  protected onFocusIn(e: ComponentEvent) {
    if (e.source !== this.content) {
      // store focus index
      let idx = this.getIndexOfComponent(e.source);
      this.lastFocusedIndex = Math.max(0, idx);
    } else {
      // focus appropriate item
      this.restoreFocus();
    }
    return true;
  }

  /** Handle ArrowUpKeyPress events, focusing the previous list item */
  protected onArrowUpKeyPress() {
    if (!this.focusPreviousItem()) {
      let parentList = this.getParentComponent(UIListController);
      if (parentList && parentList.enableArrowKeyFocus) {
        // restore parent item instead
        parentList.restoreFocus();
      }
    }
    return true;
  }

  /** Handle ArrowDownKeyPress events, focusing the next list item */
  protected onArrowDownKeyPress() {
    if (!this.focusNextItem()) {
      let parentList = this.getParentComponent(UIListController);
      if (parentList && parentList.enableArrowKeyFocus) {
        // let parent list have this one
        return false;
      }
    }
    return true;
  }

  /** Set to true to enable selection (focus movement) using up/down arrow keys */
  enableArrowKeyFocus?: boolean;

  /** List of objects, each object is used to construct one content component */
  @managed
  items = new ManagedList();

  /** Index of first item to be shown in the list (for e.g. pagination, or sliding window positioning), defaults to 0 */
  firstIndex = 0;

  /** Maximum number of items to be shown in the list (for e.g. pagination, or sliding window positioning), defaults to `undefined` to show all items */
  maxItems?: number;

  /** Last focused index, if any */
  lastFocusedIndex = 0;

  /** Returns the list index of given component, or of the component that it is contained in; or returns -1 if given component is not found in the list */
  getIndexOfComponent(component?: Component) {
    let container = this.content as UIContainer;
    if (!container) return -1;
    while (component && component.getParentComponent() !== container) {
      component = component.getParentComponent();
    }
    if (component) return container.content.indexOf(component as any);
    return -1;
  }

  /** Request input focus for the last focused list component, or the first item, if possible */
  restoreFocus() {
    // pass on to last focused component (or first)
    let container = this.content as UIContainer;
    if (container && container.content.count > 0) {
      let lastFocusedIdx = Math.max(this.lastFocusedIndex, 0);
      let index = Math.min(container.content.count - 1, lastFocusedIdx);
      let goFocus: any = container.content.get(index);
      if (typeof goFocus.requestFocus === "function") goFocus.requestFocus();
    }
  }

  /** Request input focus for the item before the currently focused item; returns true if such an item exists, false if the currently focused item is already the first item or there are no items in the list */
  focusPreviousItem() {
    if (this.lastFocusedIndex > 0) {
      this.lastFocusedIndex--;
      this.restoreFocus();
      return true;
    }
    return false;
  }

  /** Request input focus for the item after the currently focused item; returns true if such an item exists, false if the currently focused item is already the last item or if there are no items in the list */
  focusNextItem() {
    if (this.lastFocusedIndex < this.items.count - 1) {
      this.lastFocusedIndex++;
      this.restoreFocus();
      return true;
    }
    return false;
  }

  /** Update the container with (existing or new) components, one for each list item */
  private async _doUpdateAsync(Adapter?: UIListItemAdapter) {
    if (this._updateQueued) return;
    this._updateQueued = true;
    await RESOLVED;
    this._updateQueued = false;

    // update the container's content, if possible
    let container = this.content;
    let content = container && container.content;
    let list = this.items;
    if (!content) return;
    if (!list || !Adapter) {
      content.clear();
      return;
    }

    // use entire list, or just a part of it
    let firstIndex = this.firstIndex;
    if (!(firstIndex >= 0)) firstIndex = 0;
    let maxItems = this.maxItems;
    let items =
      firstIndex > 0 || maxItems! >= 0
        ? list.count > 0 && firstIndex < list.count
          ? list.take(maxItems! >= 0 ? maxItems! : list.count, list.get(this.firstIndex))
          : []
        : list;

    // keep track of existing view components for each object
    let map = this._contentMap;
    let components: UIRenderable[] = [];
    let created = map.toObject();
    for (let item of items) {
      let component = created[item.managedId];
      if (!component) {
        component = new Adapter(item);
        map.set(String(item.managedId), component);
      } else {
        delete created[item.managedId];
      }
      components.push(component);
    }
    content.replace(components);

    // delete components that should no longer be in the list
    for (let oldKey in created) {
      map.remove(created[oldKey]);
    }

    // set focusability if needed
    if (this.enableArrowKeyFocus) {
      container!.allowKeyboardFocus = !!components.length;
    }

    // emit an event specific to this UIListController
    if (this.managedState) this.emitAction("ListItemsChange");
  }

  /** True if a list update is already queued */
  private _updateQueued = false;

  /** Map of current content (managed IDs to UI components) */
  private readonly _contentMap = new ManagedMap<UIRenderable>();
}

export namespace UIListController {
  /** UIListController presets type, for use with `Component.with` */
  export interface Presets {
    /** List of items: initial values, or a list binding */
    items?: Iterable<ManagedObject>;
    /** Set to true to enable selection (focus movement) using up/down arrow keys */
    enableArrowKeyFocus?: boolean;
    /** Index of first item to be shown in the list (for e.g. pagination, or sliding window positioning), defaults to 0 */
    firstIndex?: number;
    /** Maximum number of items to be shown in the list (for e.g. pagination, or sliding window positioning), defaults to `undefined` to show all items */
    maxItems?: number;
    /** Event handler for any change in displayed list items, and list initialization */
    onListItemsChange: ComponentEventHandler<UIListController>;
  }
}
