namespace Fudge {
  export enum EVENT_EDITOR {
    /** An entity gets created, is not dispatched so far */
    CREATE = "EDITOR_CREATE",
    /** An entity gets selected and it is necessary to switch contents in the views */
    SELECT = "EDITOR_SELECT",
    /** An entity gets modified and it is necessary to updated information in views */
    MODIFY = "EDITOR_MODIFY",
    /** An entity gets deleted */
    DELETE = "EDITOR_DELETE",
    /** A view or panel closes */
    CLOSE = "EDITOR_CLOSE",
    /** A transform matrix gets adjusted interactively */
    TRANSFORM = "EDITOR_TRANSFORM",
    /** An entity recieves focus and can be manipulated using the keyboard */
    FOCUS = "EDITOR_FOCUS",
    /** An animation is running and modifies entities, which updates views */
    ANIMATE = "EDITOR_ANIMATE",
    TEST = "EDITOR_TEST"
  }

  export interface EventDetail {
    broadcast?: boolean;
    node?: ƒ.Node;
    graph?: ƒ.Graph;
    resource?: ƒ.SerializableResource;
    mutable?: ƒ.Mutable;
    transform?: Object;
    view?: View;
    data?: ƒ.General;
    // path?: View[];
  }

  /**
   * Extension of CustomEvent that supports a detail field with the type EventDetail
   */
  export class EditorEvent extends CustomEvent<EventDetail> {
    public static dispatch(_target: EventTarget, _type: EVENT_EDITOR, _init: CustomEventInit<EventDetail>): void {
      _target.dispatchEvent(new EditorEvent(_type, _init));
    }
  }
}