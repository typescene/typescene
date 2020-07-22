import { Component, ComponentConstructor } from "../core/Component";
import { CHANGE, ManagedCoreEvent } from "../core/ManagedEvent";
import { ManagedList } from "../core/ManagedList";
import { managedChild } from "../core/ManagedReference";
import { AppActivity } from "./AppActivity";

/** Component that encapsulates a list of child activities; emits change events when the list changes (propagated from `ManagedList`) and when one of the activities becomes active or inactive */
export class AppActivityList extends Component {
  static preset(
    presets: unknown,
    ...activities: Array<ComponentConstructor<AppActivity>>
  ): Function {
    super.preset(presets as any, ...activities);
    return function (this: AppActivityList) {
      this.add(...activities.map((C): AppActivity => new C()));
    };
  }

  /** Create an empty list */
  constructor() {
    super();
    this.$list = new ManagedList().restrict(AppActivity);

    // propagate list events, active/inactive
    this.propagateChildEvents();
    this.$list.propagateEvents(e => {
      if (e === ManagedCoreEvent.ACTIVE || e === ManagedCoreEvent.INACTIVE) {
        return CHANGE;
      }
    });
  }

  /** The number of activities currently in the list */
  get count() {
    return this.$list.count;
  }

  /** Add one or more child activities to the list */
  add(...activities: AppActivity[]) {
    this.$list.add(...activities);
    return this;
  }

  /** Remove given activity from the list. Does not throw an error if the activity was not included in the list */
  remove(activity: AppActivity) {
    this.$list.remove(activity);
    return this;
  }

  /** Clear the list by removing all activities in one go */
  clear() {
    this.$list.clear();
    return this;
  }

  /**
   * Returns the activity at given position in the list
   * @exception Throws an error if the index is not within the bounds of this list.
   */
  get(index: number) {
    return this.$list.get(index);
  }

  /** Returns true if the list includes given activity */
  includes(activity: AppActivity) {
    return this.$list.includes(activity);
  }

  /** Returns an array with all activities currently in this list */
  toArray() {
    return this.$list.toArray();
  }

  /** The encapsulated list itself */
  @managedChild
  private $list!: ManagedList<AppActivity>;
}
