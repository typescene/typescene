import { Component, ComponentConstructor } from "../core/Component";
import { ACTIVE, CHANGE, INACTIVE } from '../core/ManagedEvent';
import { ManagedList } from "../core/ManagedList";
import { managedChild } from "../core/ManagedReference";
import { AppActivity } from './AppActivity';

/** Component that encapsulates a list of child activities; emits events when the list changes (propagated from `ManagedList`), and a `CHANGE` event when one of the activities becomes active or inactive */
export class AppActivityList extends Component {
    static preset(presets: unknown,
        ...activities: Array<ComponentConstructor & (new () => AppActivity)>): Function {
        super.preset(presets as any, ...activities);
        return function (this: AppActivityList) {
            this.add(...activities.map(C => new C()));
        }
    }

    /** Create an empty list */
    constructor() {
        super();
        this._list = new ManagedList();
        this._list.restrict(AppActivity);

        // propagate list events, active/inactive
        this.propagateChildEvents();
        this._list.propagateEvents(e => {
            if (e === ACTIVE || e === INACTIVE) {
                return CHANGE;
            }
        });
    }

    /** Add one or more child activities to the list (see `ManagedList.add`) */
    add(...activities: AppActivity[]) {
        this._list.add(...activities);
        return this;
    }

    /** Clear the list (see `ManagedList.clear`) */
    clear() {
        this._list.clear();
        return this;
    }

    /** The number of activities currently in the list (see `ManagedList.count`) */
    get count() { return this._list.count }

    /** Returns the activity with given ID (see `ManagedObject.managedId`). */
    find(id: number) { return this._list.find(id) }

    /** Returns the first activity in the list (see `ManagedList.first`) */
    first() { return this._list.first() }

    /** Returns the activity at given position in the list (0 based; see `ManagedList.get`) */
    get(index: number) { return this._list.get(index) }

    /** Returns true if given activity is currently included in this list (see `ManagedList.includes`) */
    includes(activity: AppActivity) { return this._list.includes(activity) }

    /** Returns the last activity in the list (see `ManagedList.last`) */
    last() { return this._list.last() }

    /** Remove given activity from the list. Does not throw an error if the activity was not included in the list (see `ManagedList.remove`) */
    remove(activity: AppActivity) {
        this._list.remove(activity);
        return this;
    }

    /** Replace the activities in the list with given activities (see `ManagedList.replace`) */
    replace(activities: Iterable<AppActivity>) {
        this._list.replace(activities);
        return this;
    }

    /** Returns an array with all activities currently in this list (see `ManagedList.toArray`) */
    toArray() { return this._list.toArray() }

    /** The encapsulated list itself */
    @managedChild
    private _list!: ManagedList<AppActivity>;
}
