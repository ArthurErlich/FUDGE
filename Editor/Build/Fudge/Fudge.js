var Fudge;
(function (Fudge) {
    var ƒui = FudgeUserInterface;
    let EVENT_EDITOR;
    (function (EVENT_EDITOR) {
        EVENT_EDITOR["REMOVE"] = "nodeRemoveEvent";
        EVENT_EDITOR["HIDE"] = "nodeHideEvent";
        EVENT_EDITOR["ACTIVEVIEWPORT"] = "activeViewport";
    })(EVENT_EDITOR = Fudge.EVENT_EDITOR || (Fudge.EVENT_EDITOR = {}));
    class UIAnimationList {
        constructor(_mutator, _listContainer) {
            this.collectMutator = () => {
                let children = this.listRoot.children;
                // for (let child of children) {
                //   this.mutator[(<ƒui.CollapsableAnimationList>child).name] = (<ƒui.CollapsableAnimationList>child).mutator;
                // }
                console.log(this.mutator);
                return this.mutator;
            };
            this.toggleCollapse = (_event) => {
                _event.preventDefault();
                // console.log(_event.target instanceof ƒui.CollapsableAnimationList);
                // if (_event.target instanceof ƒui.CollapsableAnimationList) {
                //   let target: ƒui.CollapsableAnimationList = <ƒui.CollapsableAnimationList>_event.target;
                //   target.collapse(target);
                // }
            };
            this.mutator = _mutator;
            this.listRoot = document.createElement("ul");
            this.index = {};
            this.listRoot = this.buildFromMutator(this.mutator);
            _listContainer.append(this.listRoot);
            _listContainer.addEventListener("collapse" /* COLLAPSE */, this.toggleCollapse);
            _listContainer.addEventListener("update" /* UPDATE */, this.collectMutator);
        }
        getMutator() {
            return this.mutator;
        }
        setMutator(_mutator) {
            this.mutator = _mutator;
            let hule = this.buildFromMutator(this.mutator);
            this.listRoot.replaceWith(hule);
            this.listRoot = hule;
        }
        getElementIndex() {
            return this.index;
        }
        updateMutator(_update) {
            this.mutator = this.updateMutatorEntry(_update, this.mutator);
            this.updateEntry(this.mutator, this.index);
        }
        updateEntry(_update, _index) {
            for (let key in _update) {
                if (typeof _update[key] == "object") {
                    this.updateEntry(_update[key], _index[key]);
                }
                else if (typeof _update[key] == "string" || "number") {
                    let element = _index[key];
                    element.value = _update[key];
                }
            }
        }
        updateMutatorEntry(_update, _toUpdate) {
            let updatedMutator = _toUpdate;
            for (let key in _update) {
                if (typeof updatedMutator[key] == "object") {
                    if (typeof updatedMutator[key] == "object") {
                        updatedMutator[key] = this.updateMutatorEntry(_update[key], updatedMutator[key]);
                    }
                }
                else if (typeof _update[key] == "string" || "number") {
                    if (typeof updatedMutator[key] == "string" || "number") {
                        updatedMutator[key] = _update[key];
                    }
                }
            }
            return updatedMutator;
        }
        buildFromMutator(_mutator) {
            let listRoot = document.createElement("ul");
            // for (let key in _mutator) {
            //   let listElement: ƒui.CollapsableAnimationList = new ƒui.CollapsableAnimationList((<ƒ.Mutator>this.mutator[key]), key);
            //   listRoot.append(listElement);
            //   this.index[key] = listElement.getElementIndex();
            //   console.log(this.index);
            // }
            return listRoot;
        }
    }
    Fudge.UIAnimationList = UIAnimationList;
    class ComponentController extends ƒui.Controller {
        constructor(_mutable, _domElement) {
            super(_mutable, _domElement);
            this.domElement.addEventListener("input", this.mutateOnInput);
        }
    }
    Fudge.ComponentController = ComponentController;
})(Fudge || (Fudge = {}));
///<reference path="../../../node_modules/electron/Electron.d.ts"/>
///<reference types="../../../Core/Build/FudgeCore"/>
///<reference types="../../../Aid/Build/FudgeAid"/>
///<reference types="../../../UserInterface/Build/FudgeUserInterface"/>
var Fudge;
///<reference path="../../../node_modules/electron/Electron.d.ts"/>
///<reference types="../../../Core/Build/FudgeCore"/>
///<reference types="../../../Aid/Build/FudgeAid"/>
///<reference types="../../../UserInterface/Build/FudgeUserInterface"/>
(function (Fudge) {
    var ƒ = FudgeCore;
    var ƒAid = FudgeAid;
    Fudge.ipcRenderer = require("electron").ipcRenderer;
    Fudge.remote = require("electron").remote;
    const fs = require("fs");
    // TODO: At this point of time, the project is just a single node. A project is much more complex...
    let node = null;
    // TODO: At this point of time, there is just a single panel. Support multiple panels
    let panel = null;
    window.addEventListener("load", initWindow);
    function initWindow() {
        ƒ.Debug.log("Fudge started");
        Fudge.PanelManager.instance.init();
        console.log("Panel Manager initialized");
        // TODO: create a new Panel containing a ViewData by default. More Views can be added by the user or by configuration
        Fudge.ipcRenderer.on("save", (_event, _args) => {
            ƒ.Debug.log("Save");
            panel = Fudge.PanelManager.instance.getActivePanel();
            if (panel instanceof Fudge.PanelGraph) {
                node = panel.getNode();
            }
            save(node);
        });
        Fudge.ipcRenderer.on("open", (_event, _args) => {
            ƒ.Debug.log("Open");
            node = open();
            panel = Fudge.PanelManager.instance.getActivePanel();
            if (panel instanceof Fudge.PanelGraph) {
                panel.setNode(node);
            }
        });
        Fudge.ipcRenderer.on("openViewNode", (_event, _args) => {
            ƒ.Debug.log("OpenViewNode");
            openViewNode();
        });
        Fudge.ipcRenderer.on("openAnimationPanel", (_event, _args) => {
            ƒ.Debug.log("Open Animation Panel");
            // openAnimationPanel();
        });
        // HACK!
        Fudge.ipcRenderer.on("updateNode", (_event, _args) => {
            ƒ.Debug.log("UpdateViewNode");
        });
    }
    function openViewNode() {
        node = new ƒAid.NodeCoordinateSystem("WorldCooSys");
        let node2 = new ƒAid.NodeCoordinateSystem("WorldCooSys", ƒ.Matrix4x4.IDENTITY());
        node.addChild(node2);
        node2.cmpTransform.local.translateZ(2);
        Fudge.PanelManager.add(Fudge.PanelGraph, "Node", Object({ node: node })); //Object.create(null,  {node: { writable: true, value: node }}));
    }
    // function openAnimationPanel(): void {
    //   let panel: Panel = PanelManager.instance.createPanelFromTemplate(new ViewAnimationTemplate(), "Animation Panel");
    //   PanelManager.instance.addPanel(panel);
    // }
    function save(_node) {
        let serialization = ƒ.Serializer.serialize(_node);
        let content = ƒ.Serializer.stringify(serialization);
        // You can obviously give a direct path without use the dialog (C:/Program Files/path/myfileexample.txt)
        let filename = Fudge.remote.dialog.showSaveDialogSync(null, { title: "Save Graph", buttonLabel: "Save Graph", message: "ƒ-Message" });
        fs.writeFileSync(filename, content);
    }
    function open() {
        let filenames = Fudge.remote.dialog.showOpenDialogSync(null, { title: "Load Graph", buttonLabel: "Load Graph", properties: ["openFile"] });
        let content = fs.readFileSync(filenames[0], { encoding: "utf-8" });
        console.groupCollapsed("File content");
        ƒ.Debug.log(content);
        console.groupEnd();
        let serialization = ƒ.Serializer.parse(content);
        let node = ƒ.Serializer.deserialize(serialization);
        console.groupCollapsed("Deserialized");
        console.log(node);
        console.groupEnd();
        return node;
    }
})(Fudge || (Fudge = {}));
var Fudge;
(function (Fudge) {
    var ƒ = FudgeCore;
    let MENU;
    (function (MENU) {
        MENU[MENU["ADD_NODE"] = 0] = "ADD_NODE";
        MENU[MENU["ADD_COMPONENT"] = 1] = "ADD_COMPONENT";
    })(MENU = Fudge.MENU || (Fudge.MENU = {}));
    // TODO: figure out how to subclass MenuItem
    // export class MenuItem extends remote.MenuItem {
    //   public subclass: Function = null;
    //   constructor(_options: Electron.MenuItemConstructorOptions) {
    //     super(_options);
    //   }
    // }
    class ContextMenu {
        // public static build(_for: typeof View, _callback: ContextMenuCallback): Electron.Menu {
        //   let template: Electron.MenuItemConstructorOptions[] = ContextMenu.getMenu(_for, _callback);
        //   let menu: Electron.Menu = remote.Menu.buildFromTemplate(template);
        //   return menu;
        // }
        static getMenu(_for, _callback) {
            const menu = new Fudge.remote.Menu();
            let item;
            item = new Fudge.remote.MenuItem({ label: "Add Node", id: String(MENU.ADD_NODE), click: _callback, accelerator: process.platform == "darwin" ? "N" : "N" });
            menu.append(item);
            item = new Fudge.remote.MenuItem({ label: "Add Component", submenu: [] });
            for (let subItem of ContextMenu.getComponents(_callback))
                item.submenu.append(subItem);
            menu.append(item);
            this.appendCopyPaste(menu);
            // menu.addListener("menu-will-close", (_event: Electron.Event) => { console.log(_event); });
            return menu;
        }
        static appendCopyPaste(_menu) {
            _menu.append(new Fudge.remote.MenuItem({ role: "copy" }));
            _menu.append(new Fudge.remote.MenuItem({ role: "cut" }));
            _menu.append(new Fudge.remote.MenuItem({ role: "paste" }));
        }
        static getComponents(_callback) {
            const menuItems = [];
            for (let subclass of ƒ.Component.subclasses) {
                let item = new Fudge.remote.MenuItem({ label: subclass.name, id: String(MENU.ADD_COMPONENT), click: _callback });
                // @ts-ignore
                item.overrideProperty("iSubclass", subclass.iSubclass);
                item["iSubclass"] = subclass.iSubclass;
                // // Object.defineProperty(item, "subclass", {value: subclass, writable: true});
                // // item["subclass"] = subclass;
                // // console.log(subclass);
                //  function (): ƒ.Component {
                //   console.log(this);
                //   // @ts-ignore
                //   this.Fudge.newComponent = new subclass();
                //   // item.overrideProperty("component", new subclass());
                // });
                menuItems.push(item);
            }
            return menuItems;
        }
    }
    Fudge.ContextMenu = ContextMenu;
})(Fudge || (Fudge = {}));
var Fudge;
(function (Fudge) {
    var ƒ = FudgeCore;
    var ƒUi = FudgeUserInterface;
    class ControllerTreeNode extends ƒUi.TreeController {
        getLabel(_node) {
            return _node.name;
        }
        rename(_node, _new) {
            _node.name = _new;
            return true;
        }
        hasChildren(_node) {
            return _node.getChildren().length > 0;
        }
        getChildren(_node) {
            return _node.getChildren();
        }
        delete(_focussed) {
            // delete selection independend of focussed item
            let deleted = [];
            let expend = this.selection.length > 0 ? this.selection : _focussed;
            for (let node of expend)
                if (node.getParent()) {
                    node.getParent().removeChild(node);
                    deleted.push(node);
                }
            this.selection.splice(0);
            return deleted;
        }
        addChildren(_children, _target) {
            // disallow drop for sources being ancestor to target
            let move = [];
            for (let child of _children)
                if (!_target.isDescendantOf(child))
                    move.push(child);
            for (let node of move)
                _target.addChild(node);
            return move;
        }
        copy(_originals) {
            // try to create copies and return them for paste operation
            let copies = [];
            for (let original of _originals) {
                let serialization = ƒ.Serializer.serialize(original);
                let copy = ƒ.Serializer.deserialize(serialization);
                copies.push(copy);
            }
            return copies;
        }
    }
    Fudge.ControllerTreeNode = ControllerTreeNode;
})(Fudge || (Fudge = {}));
var Fudge;
(function (Fudge) {
    let PANEL;
    (function (PANEL) {
        PANEL["GRAPH"] = "PanelGraph";
    })(PANEL = Fudge.PANEL || (Fudge.PANEL = {}));
    /**
     * Holds various views into the currently processed Fudge-project.
     * There must be only one ViewData in this panel, that displays data for the selected entity
     * Multiple panels may be created by the user, presets for different processing should be available
     * @author Monika Galkewitsch, HFU, 2019
     * @author Lukas Scheuerle, HFU, 2019
     */
    // TODO: class might become a customcomponent for HTML! = this.dom
    class Panel extends EventTarget {
        /**
         * Constructor for panel Objects. Generates an empty panel with a single ViewData.
         * @param _name Panel Name
         * @param _template Optional. Template to be used in the construction of the panel.
         */
        constructor(_container, _state) {
            super();
            this.dom = document.createElement("div");
            this.dom.style.height = "100%";
            this.dom.style.width = "100%";
        }
    }
    Fudge.Panel = Panel;
})(Fudge || (Fudge = {}));
var Fudge;
(function (Fudge) {
    var ƒ = FudgeCore;
    let VIEW;
    (function (VIEW) {
        VIEW["HIERARCHY"] = "ViewHierarchy";
        VIEW["ANIMATION"] = "ViewAnimation";
        VIEW["RENDER"] = "ViewRender";
        VIEW["COMPONENTS"] = "ViewComponents";
        VIEW["CAMERA"] = "ViewCamera";
        // PROJECT = ViewProject,
        // SKETCH = ViewSketch,
        // MESH = ViewMesh,
    })(VIEW = Fudge.VIEW || (Fudge.VIEW = {}));
    /**
     * Base class for all Views to support generic functionality
     * @author Monika Galkewitsch, HFU, 2019
     * @author Lukas Scheuerle, HFU, 2019
     */
    class View {
        // config: GoldenLayout.ComponentConfig;
        // parentPanel: Panel;
        // content: HTMLElement;
        // type: string;
        constructor(_container, _state) {
            ƒ.Debug.info("Create view " + this.constructor.name);
            this.dom = document.createElement("div");
            this.dom.style.height = "100%";
            this.dom.style.overflow = "auto";
            this.dom.setAttribute("view", this.constructor.name);
            _container.getElement().append(this.dom);
            // this.config = this.getLayout();
            // this.parentPanel = _parent;
        }
    }
    Fudge.View = View;
})(Fudge || (Fudge = {}));
///<reference path="../View/View.ts"/>
///<reference path="../Panel/Panel.ts"/>
var Fudge;
///<reference path="../View/View.ts"/>
///<reference path="../Panel/Panel.ts"/>
(function (Fudge) {
    /**
    * Panel that functions as a Node Editor. Uses ViewData, ViewPort and ViewNode.
    * Use NodePanelTemplate to initialize the default NodePanel.
    * @author Monika Galkewitsch, 2019, HFU
    */
    class PanelGraph extends Fudge.Panel {
        // constructor(_name: string, _template?: PanelTemplate, _node?: ƒ.Node) {
        //   super(_name);
        //   this.node = _node || new ƒ.Node("Scene");
        //   if (_template) {
        //     let id: string = this.config.id.toString();
        //     this.config.content[0] = this.constructFromTemplate(_template.config, _template.config.type, id);
        //   }
        //   else {
        //     let viewData: ViewComponents = new ViewComponents(this);
        //     this.addView(viewData, false);
        //   }
        // }
        constructor(_container, _state) {
            super(_container, _state);
            console.log(_state);
            let config = {
                settings: { showPopoutIcon: false },
                content: [{
                        type: "row", content: [{
                                type: "column", content: [
                                    { type: "component", componentName: Fudge.VIEW.HIERARCHY, title: "Hierarchy", componentState: _state },
                                    { type: "component", componentName: Fudge.VIEW.RENDER, title: "Render", componentState: _state }
                                ] //, componentState: _state }]
                            }, {
                                type: "column", content: [
                                    { type: "component", componentName: Fudge.VIEW.COMPONENTS, title: "Components", componentState: _state },
                                ]
                            },
                        ]
                    }]
            };
            this.goldenLayout = new GoldenLayout(config, this.dom);
            _container.getElement().append(this.dom);
            this.goldenLayout.registerComponent(Fudge.VIEW.RENDER, Fudge.ViewRender);
            this.goldenLayout.registerComponent(Fudge.VIEW.COMPONENTS, Fudge.ViewComponents);
            this.goldenLayout.registerComponent(Fudge.VIEW.HIERARCHY, Fudge.ViewHierarchy);
            this.goldenLayout.on("stateChanged", () => this.goldenLayout.updateSize());
            this.goldenLayout.init();
        }
        // public static add(): void {
        //   let config: GoldenLayout.ItemConfig = {
        //     type: "stack",
        //     content: [{
        //       type: "component",
        //       componentName: "PanelGraph",
        //       componentState: { text: "Panel 3" },
        //       title: "Panel3"
        //     }]
        //   };
        //   PanelManager.instance.editorLayout.root.contentItems[0].addChild(config);
        //   // glDoc.root.contentItems[0].addChild(config); 
        // }
        setNode(_node) {
            this.node = _node;
            // for (let view of this.views) {
            //   if (view["setRoot"])
            //     view["setRoot"](this.node);
            // }
        }
        getNode() {
            return this.node;
        }
    }
    Fudge.PanelGraph = PanelGraph;
})(Fudge || (Fudge = {}));
var Fudge;
(function (Fudge) {
    /**
     * Manages all Panels used by Fudge at the time. Call the static instance Member to use its functions.
     * @author Monika Galkewitsch, 2019, HFU
     * @author Lukas Scheuerle, 2019, HFU
     */
    class PanelManager extends EventTarget {
        constructor() {
            super();
            this.panels = [];
        }
        // /**
        //  * Add Panel to PanelManagers Panel List and to the PanelManagers GoldenLayout Config
        //  * @param _p Panel to be added
        //  */
        // addPanel(_p: Panel): void {
        //   this.panels.push(_p);
        //   // this.editorLayout.root.contentItems[0].addChild(_p.config);
        //   this.editorLayout.root.getItemsById("root")[0].addChild(_p.config);
        //   this.activePanel = _p;
        // }
        /**
         * Add View to PanelManagers View List and add the view to the active panel
         */
        // addView(_v: View): void {
        //   this.editorLayout.root.contentItems[0].getActiveContentItem().addChild(_v.config);
        // }
        static add(_panel, _title, _state) {
            let config = {
                type: "stack",
                content: [{
                        type: "component", componentName: _panel.name, componentState: _state,
                        title: _title, id: this.generateID(_panel.name)
                    }]
            };
            PanelManager.instance.editorLayout.root.contentItems[0].addChild(config);
        }
        static generateID(_name) {
            return _name + PanelManager.idCounter++;
        }
        /**
         * Returns the currently active Panel
         */
        getActivePanel() {
            return this.activePanel;
        }
        /**
         * Initialize GoldenLayout Context of the PanelManager Instance
         */
        init() {
            let config = {
                settings: { showPopoutIcon: false },
                content: [{
                        id: "root", type: "row", isClosable: false,
                        content: [
                            { type: "component", componentName: "Welcome", title: "Welcome", componentState: {} }
                        ]
                    }]
            };
            this.editorLayout = new GoldenLayout(config); //This might be a problem because it can't use a specific place to put it.
            this.editorLayout.registerComponent("Welcome", welcome);
            // this.editorLayout.registerComponent("View", registerViewComponent);
            this.editorLayout.registerComponent(Fudge.PANEL.GRAPH, Fudge.PanelGraph);
            this.editorLayout.init();
            this.editorLayout.on("stateChanged", (_event) => {
                console.log(_event);
            });
            // this.editorLayout.root.contentItems[0].on("activeContentItemChanged", this.setActivePanel);
        }
    }
    PanelManager.idCounter = 0;
    PanelManager.instance = new PanelManager();
    Fudge.PanelManager = PanelManager;
    //TODO: Give these Factory Functions a better home
    /**
     * Factory Function for the the "Welcome"-Component
     */
    function welcome(container, state) {
        container.getElement().html("<div>Welcome</div>");
    }
    /**
     * Factory Function for the generic "View"-Component
     */
    function registerViewComponent(_container, _state) {
        _container.getElement().append(_state["content"]);
    }
    Fudge.registerViewComponent = registerViewComponent;
    /**
     * Factory Function for the generic "Panel"-Component
     */
    function registerPanelComponent(_container, _state) {
        _container.getElement().append(_state["content"]);
    }
    Fudge.registerPanelComponent = registerPanelComponent;
})(Fudge || (Fudge = {}));
var Fudge;
(function (Fudge) {
    // Code by Monika Galkewitsch with a whole lot of Help by Lukas Scheuerle
    class PanelTemplate {
    }
    Fudge.PanelTemplate = PanelTemplate;
    class NodePanelTemplate extends PanelTemplate {
        constructor() {
            super();
            this.config = {
                type: "row", content: [
                    {
                        type: "component",
                        componentName: Fudge.VIEW.RENDER,
                        title: "Viewport"
                    },
                    {
                        type: "column", content: [
                            {
                                type: "component",
                                componentName: Fudge.VIEW.HIERARCHY,
                                title: "Graph "
                            },
                            {
                                type: "component",
                                componentName: Fudge.VIEW.COMPONENTS,
                                title: "Components"
                            }
                        ]
                    }
                ]
            };
        }
    }
    Fudge.NodePanelTemplate = NodePanelTemplate;
})(Fudge || (Fudge = {}));
var Fudge;
(function (Fudge) {
    class ViewAnimation extends Fudge.View {
        constructor(_parent) {
            super(_parent);
            this.time = new FudgeCore.Time();
            this.playing = false;
            this.playbackTime = 500;
            this.openAnimation();
            this.fillContent();
            this.installListeners();
        }
        openAnimation() {
            //TODO replace with file opening dialoge
            let seq1 = new FudgeCore.AnimationSequence();
            seq1.addKey(new FudgeCore.AnimationKey(0, 0));
            seq1.addKey(new FudgeCore.AnimationKey(500, 45));
            seq1.addKey(new FudgeCore.AnimationKey(1500, -45));
            seq1.addKey(new FudgeCore.AnimationKey(2000, 0));
            let seq2 = new FudgeCore.AnimationSequence();
            // seq2.addKey(new FudgeCore.AnimationKey(0, 0));
            seq2.addKey(new FudgeCore.AnimationKey(500, 0, 0, 0.02));
            seq2.addKey(new FudgeCore.AnimationKey(1000, 5));
            seq2.addKey(new FudgeCore.AnimationKey(1500, 0, -0.02));
            this.animation = new FudgeCore.Animation("TestAnimation", {
                components: {
                    ComponentTransform: [
                        {
                            "ƒ.ComponentTransform": {
                                position: {
                                    x: new FudgeCore.AnimationSequence(),
                                    y: seq2,
                                    z: new FudgeCore.AnimationSequence()
                                },
                                rotation: {
                                    x: new FudgeCore.AnimationSequence(),
                                    y: seq1,
                                    z: new FudgeCore.AnimationSequence()
                                }
                            }
                        }
                    ]
                }
            }, 60);
            this.animation.labels["One"] = 200;
            this.animation.labels["Two"] = 750;
            this.animation.setEvent("EventOne", 500);
            this.animation.setEvent("EventTwo", 1000);
            this.node = new FudgeCore.Node("Testnode");
            this.cmpAnimator = new FudgeCore.ComponentAnimator(this.animation);
        }
        fillContent() {
            // this.content = document.createElement("span");
            // this.content.id = "TESTID";
            this.toolbar = document.createElement("div");
            this.toolbar.id = "toolbar";
            this.toolbar.style.width = "300px";
            this.toolbar.style.height = "80px";
            this.toolbar.style.borderBottom = "1px solid black";
            this.fillToolbar(this.toolbar);
            this.attributeList = document.createElement("div");
            this.attributeList.id = "attributeList";
            this.attributeList.style.width = "300px";
            this.attributeList.addEventListener("update" /* UPDATE */, this.changeAttribute.bind(this));
            //TODO: Add Moni's custom Element here
            this.controller = new Fudge.UIAnimationList(this.animation.getMutated(this.playbackTime, 0, FudgeCore.ANIMATION_PLAYBACK.TIMEBASED_CONTINOUS), this.attributeList);
            this.canvas = document.createElement("canvas");
            this.canvas.width = 1500;
            this.canvas.height = 500;
            this.canvas.style.position = "absolute";
            this.canvas.style.left = "300px";
            this.canvas.style.top = "0px";
            this.canvas.style.borderLeft = "1px solid black";
            this.crc = this.canvas.getContext("2d");
            this.hover = document.createElement("span");
            this.hover.style.background = "black";
            this.hover.style.color = "white";
            this.hover.style.position = "absolute";
            this.hover.style.display = "none";
            this.content.appendChild(this.toolbar);
            this.content.appendChild(this.attributeList);
            // this.content.appendChild(this.canvasSheet);
            this.content.appendChild(this.canvas);
            this.content.appendChild(this.hover);
            // this.sheet = new ViewAnimationSheetDope(this, this.crc, null, new FudgeCore.Vector2(.5, 0.5), new FudgeCore.Vector2(0, 0));
            this.sheet = new Fudge.ViewAnimationSheetCurve(this, this.crc, null, new FudgeCore.Vector2(0.5, 2), new FudgeCore.Vector2(0, 200));
            this.sheet.redraw(this.playbackTime);
            // sheet.translate();
        }
        installListeners() {
            this.canvas.addEventListener("click", this.mouseClick.bind(this));
            this.canvas.addEventListener("mousedown", this.mouseDown.bind(this));
            this.canvas.addEventListener("mousemove", this.mouseMove.bind(this));
            this.canvas.addEventListener("mouseup", this.mouseUp.bind(this));
            this.toolbar.addEventListener("click", this.toolbarClick.bind(this));
            this.toolbar.addEventListener("change", this.toolbarChange.bind(this));
            requestAnimationFrame(this.playAnimation.bind(this));
        }
        deconstruct() {
            //
        }
        mouseClick(_e) {
            // console.log(_e);
        }
        mouseDown(_e) {
            if (_e.offsetY < 50) {
                this.setTime(_e.offsetX / this.sheet.scale.x);
                return;
            }
            let obj = this.sheet.getObjectAtPoint(_e.offsetX, _e.offsetY);
            if (!obj)
                return;
            if (obj["label"]) {
                console.log(obj["label"]);
                this.parentPanel.dispatchEvent(new CustomEvent("select" /* SELECT */, { detail: { name: obj["label"], time: this.animation.labels[obj["label"]] } }));
            }
            else if (obj["event"]) {
                console.log(obj["event"]);
                this.parentPanel.dispatchEvent(new CustomEvent("select" /* SELECT */, { detail: { name: obj["event"], time: this.animation.events[obj["event"]] } }));
            }
            else if (obj["key"]) {
                console.log(obj["key"]);
                this.parentPanel.dispatchEvent(new CustomEvent("select" /* SELECT */, { detail: obj["key"] }));
            }
            console.log(obj);
        }
        mouseMove(_e) {
            _e.preventDefault();
            if (_e.buttons != 1)
                return;
            if (_e.offsetY < 50) {
                this.setTime(_e.offsetX / this.sheet.scale.x);
                return;
            }
        }
        mouseUp(_e) {
            // console.log(_e);
            //
        }
        fillToolbar(_tb) {
            let playmode = document.createElement("select");
            playmode.id = "playmode";
            for (let m in FudgeCore.ANIMATION_PLAYMODE) {
                if (isNaN(+m)) {
                    let op = document.createElement("option");
                    op.value = m;
                    op.innerText = m;
                    playmode.appendChild(op);
                }
            }
            _tb.appendChild(playmode);
            _tb.appendChild(document.createElement("br"));
            let fpsL = document.createElement("label");
            fpsL.setAttribute("for", "fps");
            fpsL.innerText = "FPS";
            let fpsI = document.createElement("input");
            fpsI.type = "number";
            fpsI.min = "0";
            fpsI.max = "999";
            fpsI.step = "1";
            fpsI.id = "fps";
            fpsI.value = this.animation.fps.toString();
            fpsI.style.width = "40px";
            _tb.appendChild(fpsL);
            _tb.appendChild(fpsI);
            let spsL = document.createElement("label");
            spsL.setAttribute("for", "sps");
            spsL.innerText = "SPS";
            let spsI = document.createElement("input");
            spsI.type = "number";
            spsI.min = "0";
            spsI.max = "999";
            spsI.step = "1";
            spsI.id = "sps";
            spsI.value = this.animation.stepsPerSecond.toString();
            spsI.style.width = "40px";
            _tb.appendChild(spsL);
            _tb.appendChild(spsI);
            _tb.appendChild(document.createElement("br"));
            let buttons = [];
            buttons.push(document.createElement("button"));
            buttons.push(document.createElement("button"));
            buttons.push(document.createElement("button"));
            buttons.push(document.createElement("button"));
            buttons.push(document.createElement("button"));
            buttons.push(document.createElement("button"));
            buttons.push(document.createElement("button"));
            buttons.push(document.createElement("button"));
            buttons.push(document.createElement("button"));
            buttons[0].classList.add("fa", "fa-fast-backward", "start");
            buttons[1].classList.add("fa", "fa-backward", "back");
            buttons[2].classList.add("fa", "fa-play", "play");
            buttons[3].classList.add("fa", "fa-pause", "pause");
            buttons[4].classList.add("fa", "fa-forward", "forward");
            buttons[5].classList.add("fa", "fa-fast-forward", "end");
            buttons[6].classList.add("fa", "fa-file", "add-label");
            buttons[7].classList.add("fa", "fa-bookmark", "add-event");
            buttons[8].classList.add("fa", "fa-plus-square", "add-key");
            buttons[0].id = "start";
            buttons[1].id = "back";
            buttons[2].id = "play";
            buttons[3].id = "pause";
            buttons[4].id = "forward";
            buttons[5].id = "end";
            buttons[6].id = "add-label";
            buttons[7].id = "add-event";
            buttons[8].id = "add-key";
            for (let b of buttons) {
                _tb.appendChild(b);
            }
        }
        toolbarClick(_e) {
            // console.log("click", _e.target);
            let target = _e.target;
            switch (target.id) {
                case "add-label":
                    this.animation.labels[this.randomNameGenerator()] = this.playbackTime;
                    this.sheet.redraw(this.playbackTime);
                    break;
                case "add-event":
                    this.animation.setEvent(this.randomNameGenerator(), this.playbackTime);
                    this.sheet.redraw(this.playbackTime);
                    break;
                case "add-key":
                    break;
                case "start":
                    this.playbackTime = 0;
                    this.updateDisplay();
                    break;
                case "back":
                    this.playbackTime = this.playbackTime -= 1000 / this.animation.stepsPerSecond;
                    this.playbackTime = Math.max(this.playbackTime, 0);
                    this.updateDisplay();
                    break;
                case "play":
                    this.time.set(this.playbackTime);
                    this.playing = true;
                    break;
                case "pause":
                    this.playing = false;
                    break;
                case "forward":
                    this.playbackTime = this.playbackTime += 1000 / this.animation.stepsPerSecond;
                    this.playbackTime = Math.min(this.playbackTime, this.animation.totalTime);
                    this.updateDisplay();
                    break;
                case "end":
                    this.playbackTime = this.animation.totalTime;
                    this.sheet.redraw(this.playbackTime);
                    this.updateDisplay();
                    break;
                default:
                    break;
            }
        }
        toolbarChange(_e) {
            let target = _e.target;
            switch (target.id) {
                case "playmode":
                    this.cmpAnimator.playmode = FudgeCore.ANIMATION_PLAYMODE[target.value];
                    // console.log(FudgeCore.ANIMATION_PLAYMODE[target.value]);
                    break;
                case "fps":
                    // console.log("fps changed to", target.value);
                    if (!isNaN(+target.value))
                        this.animation.fps = +target.value;
                    break;
                case "sps":
                    // console.log("sps changed to", target.value);
                    if (!isNaN(+target.value)) {
                        this.animation.stepsPerSecond = +target.value;
                        this.sheet.redraw(this.playbackTime);
                    }
                    break;
                default:
                    console.log("no clue what you changed...");
                    break;
            }
        }
        changeAttribute(_e) {
            console.log(_e);
            console.log(this.controller.getMutator());
            // console.log("1", this.controller.getMutator());
            // console.log("2", this.controller.collectMutator());
            // this.controller.BuildFromMutator(this.animation.getMutated(this.playbackTime, 1, FudgeCore.ANIMATION_PLAYBACK.TIMEBASED_CONTINOUS));
        }
        updateDisplay(_m = null) {
            this.sheet.redraw(this.playbackTime);
            if (!_m)
                _m = this.animation.getMutated(this.playbackTime, 0, this.cmpAnimator.playback);
            // this.attributeList.innerHTML = "";
            // this.attributeList.appendChild(
            // this.controller.BuildFromMutator(_m);
            // this.controller = new FudgeUserInterface.UIAnimationList(_m, this.attributeList); //TODO: remove this hack, because it's horrible!
            this.controller.updateMutator(_m);
        }
        setTime(_time, updateDisplay = true) {
            this.playbackTime = Math.min(this.animation.totalTime, Math.max(0, _time));
            if (updateDisplay)
                this.updateDisplay();
        }
        playAnimation() {
            requestAnimationFrame(this.playAnimation.bind(this));
            if (!this.playing)
                return;
            let t = this.time.get();
            let m = {};
            [m, t] = this.cmpAnimator.updateAnimation(t);
            this.playbackTime = t;
            this.updateDisplay(m);
        }
        randomNameGenerator() {
            let attr = ["red", "blue", "green", "pink", "yellow", "purple", "orange", "fast", "slow", "quick", "boring", "questionable", "king", "queen", "smart", "gold"];
            let anim = ["cow", "fish", "elephant", "cat", "dog", "bat", "chameleon", "caterpillar", "crocodile", "hamster", "horse", "panda", "giraffe", "lukas", "koala", "jellyfish", "lion", "lizard", "platypus", "scorpion", "penguin", "pterodactyl"];
            return attr[Math.floor(Math.random() * attr.length)] + "-" + anim[Math.floor(Math.random() * anim.length)];
        }
    }
    Fudge.ViewAnimation = ViewAnimation;
})(Fudge || (Fudge = {}));
var Fudge;
(function (Fudge) {
    class ViewAnimationSheet {
        //TODO stop using hardcoded colors
        constructor(_view, _crc, _seq, _scale = new FudgeCore.Vector2(1, 1), _pos = new FudgeCore.Vector2()) {
            this.keys = [];
            this.sequences = [];
            this.labels = [];
            this.events = [];
            this.view = _view;
            this.crc2 = _crc;
            this.seq = _seq;
            this.scale = _scale;
            this.position = _pos;
        }
        moveTo(_time, _value = this.position.y) {
            this.position.x = _time;
            this.position.y = _value;
        }
        translate() {
            this.crc2.translate(this.position.x, this.position.y);
            this.crc2.scale(this.scale.x, this.scale.y);
        }
        redraw(_time) {
            this.clear();
            this.translate();
            this.drawKeys();
            this.drawTimeline();
            this.drawEventsAndLabels();
            this.drawCursor(_time);
        }
        clear() {
            this.crc2.resetTransform();
            let maxDistance = 10000;
            this.crc2.clearRect(0, 0, maxDistance, this.crc2.canvas.height);
        }
        drawTimeline() {
            this.crc2.resetTransform();
            let timelineHeight = 50;
            let maxDistance = 10000;
            let timeline = new Path2D();
            this.crc2.fillStyle = "#7a7a7a";
            this.crc2.fillRect(0, 0, maxDistance, timelineHeight + 30);
            timeline.moveTo(0, timelineHeight);
            //TODO make this use some actually sensible numbers, maybe 2x the animation length
            timeline.lineTo(maxDistance, timelineHeight);
            //TODO: make this scale nicely/use the animations SPS
            let baseWidth = 1000;
            let pixelPerSecond = Math.floor(baseWidth * this.scale.x);
            let stepsPerSecond = this.view.animation.stepsPerSecond;
            let stepsPerDisplayText = 1;
            // [stepsPerSecond, stepsPerDisplayText] = this.calculateDisplay(pixelPerSecond);
            let pixelPerStep = pixelPerSecond / stepsPerSecond;
            let steps = 0;
            // console.log(pixelPerSecond, pixelPerStep);
            this.crc2.strokeStyle = "black";
            this.crc2.fillStyle = "black";
            for (let i = 0; i < maxDistance; i += pixelPerStep) {
                timeline.moveTo(i, timelineHeight);
                if (steps % stepsPerDisplayText == 0) {
                    //TODO: stop using hardcoded heights
                    timeline.lineTo(i, timelineHeight - 25);
                    this.crc2.fillText(steps.toString(), i - 3, timelineHeight - 28);
                    if (Math.round(i) % Math.round(1000 * this.scale.x) == 0)
                        //TODO: make the time display independent of the SPS display. Trying to tie the two together was a stupid idea.
                        this.crc2.fillText((Math.round(100 * (i / 1000 / this.scale.x)) / 100).toString() + "s", i - 3, 10);
                }
                else {
                    timeline.lineTo(i, timelineHeight - 20);
                }
                steps++;
            }
            this.crc2.stroke(timeline);
        }
        drawCursor(_time) {
            _time *= this.scale.x;
            let cursor = new Path2D();
            cursor.rect(_time - 3, 0, 6, 50);
            cursor.moveTo(_time, 50);
            cursor.lineTo(_time, this.crc2.canvas.height);
            this.crc2.strokeStyle = "red";
            this.crc2.fillStyle = "red";
            this.crc2.stroke(cursor);
            this.crc2.fill(cursor);
        }
        drawKeys() {
            let inputMutator = this.view.controller.getElementIndex();
            //TODO: stop recreating the sequence elements all the time
            this.sequences = [];
            this.keys = [];
            this.traverseStructures(this.view.animation.animationStructure, inputMutator);
        }
        getObjectAtPoint(_x, _y) {
            for (let l of this.labels) {
                if (this.crc2.isPointInPath(l.path2D, _x, _y)) {
                    return l;
                }
            }
            for (let e of this.events) {
                if (this.crc2.isPointInPath(e.path2D, _x, _y)) {
                    return e;
                }
            }
            _x = _x / this.scale.x - this.position.x;
            _y = _y / this.scale.y - this.position.y / this.scale.y;
            for (let k of this.keys) {
                if (this.crc2.isPointInPath(k.path2D, _x, _y)) {
                    return k;
                }
            }
            return null;
        }
        traverseStructures(_animation, _inputs) {
            for (let i in _animation) {
                if (_animation[i] instanceof FudgeCore.AnimationSequence) {
                    this.drawSequence(_animation[i], _inputs[i]);
                }
                else {
                    this.traverseStructures(_animation[i], _inputs[i]);
                }
            }
        }
        drawKey(_x, _y, _h, _w, _c) {
            let key = new Path2D();
            key.moveTo(_x - _w, _y);
            key.lineTo(_x, _y + _h);
            key.lineTo(_x + _w, _y);
            key.lineTo(_x, _y - _h);
            key.closePath();
            this.crc2.fillStyle = _c;
            this.crc2.strokeStyle = "black";
            this.crc2.lineWidth = 1;
            this.crc2.fill(key);
            this.crc2.stroke(key);
            return key;
        }
        drawEventsAndLabels() {
            let maxDistance = 10000;
            let labelDisplayHeight = 30 + 50;
            let line = new Path2D();
            line.moveTo(0, labelDisplayHeight);
            line.lineTo(maxDistance, labelDisplayHeight);
            this.crc2.strokeStyle = "black";
            this.crc2.fillStyle = "black";
            this.crc2.stroke(line);
            this.labels = [];
            this.events = [];
            if (!this.view.animation)
                return;
            for (let l in this.view.animation.labels) {
                //TODO stop using hardcoded values
                let p = new Path2D;
                this.labels.push({ label: l, path2D: p });
                let position = this.view.animation.labels[l] * this.scale.x;
                p.moveTo(position - 3, labelDisplayHeight - 28);
                p.lineTo(position - 3, labelDisplayHeight - 2);
                p.lineTo(position + 3, labelDisplayHeight - 2);
                p.lineTo(position + 3, labelDisplayHeight - 25);
                p.lineTo(position, labelDisplayHeight - 28);
                p.lineTo(position - 3, labelDisplayHeight - 28);
                this.crc2.fill(p);
                this.crc2.stroke(p);
                let p2 = new Path2D();
                p2.moveTo(position, labelDisplayHeight - 28);
                p2.lineTo(position, labelDisplayHeight - 25);
                p2.lineTo(position + 3, labelDisplayHeight - 25);
                this.crc2.strokeStyle = "white";
                this.crc2.stroke(p2);
                this.crc2.strokeStyle = "black";
            }
            for (let e in this.view.animation.events) {
                let p = new Path2D;
                this.events.push({ event: e, path2D: p });
                let position = this.view.animation.events[e] * this.scale.x;
                p.moveTo(position - 3, labelDisplayHeight - 28);
                p.lineTo(position - 3, labelDisplayHeight - 5);
                p.lineTo(position, labelDisplayHeight - 2);
                p.lineTo(position + 3, labelDisplayHeight - 5);
                p.lineTo(position + 3, labelDisplayHeight - 28);
                p.lineTo(position - 3, labelDisplayHeight - 28);
                // this.crc2.fill(p);
                this.crc2.stroke(p);
            }
        }
        calculateDisplay(_ppS) {
            // let minPixelPerStep: number = 10;
            // let maxPixelPerStep: number = 50;
            // //TODO: use animation SPS
            // let currentPPS: number = _ppS;
            // while (currentPPS < minPixelPerStep || maxPixelPerStep < currentPPS) {
            //   if(currentPPS < minPixelPerStep) {
            //     currentPPS /= 1.5;
            //   }
            // }
            return [60, 10];
        }
    }
    Fudge.ViewAnimationSheet = ViewAnimationSheet;
})(Fudge || (Fudge = {}));
var Fudge;
(function (Fudge) {
    class ViewAnimationSheetCurve extends Fudge.ViewAnimationSheet {
        drawKeys() {
            this.drawYScale();
            super.drawKeys();
        }
        drawSequence(_sequence, _input) {
            if (_sequence.length <= 0)
                return;
            let rect = _input.getBoundingClientRect();
            let height = rect.height / this.scale.y;
            let width = rect.height / this.scale.x;
            let line = new Path2D();
            line.moveTo(0, _sequence.getKey(0).Value);
            //TODO: stop recreating the sequence element all the time
            //TODO: get color from input element or former sequence element.
            let seq = { color: this.randomColor(), element: _input, sequence: _sequence };
            this.sequences.push(seq);
            for (let i = 0; i < _sequence.length; i++) {
                let k = _sequence.getKey(i);
                this.keys.push({ key: k, path2D: this.drawKey(k.Time, k.Value, height / 2, width / 2, seq.color), sequence: seq });
                line.lineTo(k.Time, k.Value);
            }
            line.lineTo(this.view.animation.totalTime, _sequence.getKey(_sequence.length - 1).Value);
            this.crc2.strokeStyle = seq.color;
            this.crc2.stroke(line);
        }
        drawKey(_x, _y, _h, _w, _c) {
            return super.drawKey(_x, _y, _h, _w, _c);
        }
        drawYScale() {
            let pixelPerValue = this.calcScaleSize();
            let valuePerPixel = 1 / pixelPerValue;
            this.crc2.strokeStyle = "black";
            this.crc2.lineWidth = 1 / this.scale.y;
            let line = new Path2D;
            line.moveTo(0, 0);
            line.lineTo(100000, 0);
            this.crc2.stroke(line);
        }
        calcScaleSize() {
            let min = 10;
            let max = 50;
            let pixelPerValue = this.scale.y;
            while (pixelPerValue < min) {
                pixelPerValue *= 10;
            }
            while (pixelPerValue > max) {
                pixelPerValue /= 2;
            }
            return pixelPerValue;
        }
        randomColor() {
            return "hsl(" + Math.random() * 360 + ", 80%, 80%)";
        }
    }
    Fudge.ViewAnimationSheetCurve = ViewAnimationSheetCurve;
})(Fudge || (Fudge = {}));
var Fudge;
(function (Fudge) {
    class ViewAnimationSheetDope extends Fudge.ViewAnimationSheet {
        async drawKeys() {
            //TODO: Fix that for some reason the first time this is called the rects return all 0s.
            //TODO: possible optimisation: only regenerate if necessary, otherwise load a saved image. (might lead to problems with the keys not being clickable anymore though)
            // const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
            let inputMutator = this.view.controller.getElementIndex();
            // console.log(inputMutator);
            // await delay(1);
            // console.log(inputMutator.components["ComponentTransform"][0]["ƒ.ComponentTransform"]["rotation"]["y"].getBoundingClientRect());
            // }, 1000);
            this.traverseStructures(this.view.animation.animationStructure, inputMutator);
        }
        drawSequence(_sequence, _input) {
            let rect = _input.getBoundingClientRect();
            let y = rect.top - this.view.content.getBoundingClientRect().top + rect.height / 2;
            let height = rect.height;
            let width = rect.height;
            let line = new Path2D();
            line.moveTo(0, y);
            line.lineTo(this.crc2.canvas.width, y);
            this.crc2.strokeStyle = "black";
            this.crc2.stroke(line);
            let seq = { color: "red", element: _input, sequence: _sequence };
            this.sequences.push(seq);
            for (let i = 0; i < _sequence.length; i++) {
                let k = _sequence.getKey(i);
                this.keys.push({ key: k, path2D: this.drawKey(k.Time * this.scale.x, y, height / 2, width / 2, seq.color), sequence: seq });
            }
        }
    }
    Fudge.ViewAnimationSheetDope = ViewAnimationSheetDope;
})(Fudge || (Fudge = {}));
var Fudge;
(function (Fudge) {
    class ViewAnimationTemplate extends Fudge.PanelTemplate {
        constructor() {
            super();
            this.config = {
                type: "column",
                content: [
                    {
                        type: "row",
                        content: [
                            {
                                type: "component",
                                componentName: Fudge.VIEW.RENDER,
                                title: "Viewport"
                            },
                            {
                                type: "component",
                                componentName: Fudge.VIEW.COMPONENTS,
                                title: "Inspector"
                            }
                        ]
                    },
                    {
                        type: "component",
                        componentName: Fudge.VIEW.ANIMATION,
                        title: "Animator"
                    }
                ]
            };
        }
    }
    Fudge.ViewAnimationTemplate = ViewAnimationTemplate;
})(Fudge || (Fudge = {}));
var Fudge;
(function (Fudge) {
    /**
     * View displaying all information of any selected entity and offering simple controls for manipulation
     */
    let Menu;
    (function (Menu) {
        Menu["COMPONENTMENU"] = "Add Components";
    })(Menu || (Menu = {}));
    class ViewCamera extends Fudge.View {
        constructor(_panel) {
            super(_panel);
            this.setCamera = (_event) => {
                this.camera = _event.detail;
                this.fillContent();
            };
            this.parentPanel.addEventListener(Fudge.EVENT_EDITOR.ACTIVEVIEWPORT, this.setCamera);
            let div = document.createElement("div");
            this.content.appendChild(div);
        }
        fillContent() {
            let div = document.createElement("div");
            let inspector = new Fudge.ComponentController(this.camera, div);
            this.content.replaceChild(div, this.content.firstChild);
        }
        deconstruct() {
            throw new Error("Method not implemented.");
        }
    }
    Fudge.ViewCamera = ViewCamera;
})(Fudge || (Fudge = {}));
var Fudge;
(function (Fudge) {
    var ƒ = FudgeCore;
    var ƒui = FudgeUserInterface;
    /**
     * View displaying all information of any selected entity and offering simple controls for manipulation
     */
    let Menu;
    (function (Menu) {
        Menu["COMPONENTMENU"] = "Add Components";
    })(Menu || (Menu = {}));
    class ViewComponents extends Fudge.View {
        constructor(_container, _state) {
            super(_container, _state);
            /**
             * Changes the name of the displayed node
             */
            this.changeNodeName = (_event) => {
                if (this.data instanceof ƒ.Node) {
                    let target = _event.target;
                    this.data.name = target.value;
                }
            };
            /**
             * Change displayed node
             */
            this.setNode = (_event) => {
                this.data = _event.detail;
                while (this.dom.firstChild != null) {
                    this.dom.removeChild(this.dom.lastChild);
                }
                this.fillContent();
            };
            /**
             * Add Component to displayed node
             */
            this.addComponent = (_event) => {
                switch (_event.detail) {
                }
            };
            // this.parentPanel.addEventListener(ƒui.EVENT_USERINTERFACE.SELECT, this.setNode);
            this.fillContent();
        }
        cleanup() {
            //TODO: Deconstruct;
        }
        fillContent() {
            if (this.data) {
                if (this.data instanceof ƒ.Node) {
                    // let txtNodeName: HTMLInputElement = document.createElement("input");
                    // txtNodeName.addEventListener("input", this.changeNodeName);
                    // cntHeader.append(txtNodeName);
                    let cntHeader = document.createElement("span");
                    cntHeader.textContent = this.data.name;
                    this.dom.appendChild(cntHeader);
                    let nodeComponents = this.data.getAllComponents();
                    for (let nodeComponent of nodeComponents) {
                        let fieldset = ƒui.Generator.createFieldSetFromMutable(nodeComponent);
                        let uiComponent = new Fudge.ComponentController(nodeComponent, fieldset);
                        this.dom.append(uiComponent.domElement);
                    }
                }
            }
            else {
                let cntEmpty = document.createElement("div");
                this.dom.append(cntEmpty);
            }
        }
    }
    Fudge.ViewComponents = ViewComponents;
})(Fudge || (Fudge = {}));
var Fudge;
(function (Fudge) {
    var ƒ = FudgeCore;
    var ƒui = FudgeUserInterface;
    /**
     * View displaying a Node and the hierarchical relation to its parents and children.
     * Consists of a viewport, a tree-control and .
     */
    class ViewHierarchy extends Fudge.View {
        constructor(_container, _state) {
            super(_container, _state);
            /**
             * Change the selected Node
             */
            this.setSelectedNode = (_event) => {
                // this.listController.setSelection(_event.detail);
                this.selectedNode = _event.detail;
            };
            /**
             * Pass Event to Panel
             */
            this.passEventToPanel = (_event) => {
                let eventToPass;
                if (_event.type == ƒui.EVENT_TREE.SELECT)
                    eventToPass = new CustomEvent("select" /* SELECT */, { bubbles: false, detail: _event.detail.data });
                else
                    eventToPass = new CustomEvent(_event.type, { bubbles: false, detail: _event.detail });
                _event.cancelBubble = true;
                // this.parentPanel.dispatchEvent(eventToPass);
                // this.dispatchEvent(eventToPass); <- if view was a subclass of HTMLElement or HTMLDivElement
            };
            this.openContextMenu = (_event) => {
                this.contextMenu.popup();
            };
            this.contextMenuCallback = (_item, _window, _event) => {
                console.log(`MenuSelect: Item-id=${Fudge.MENU[_item.id]}`);
                let focus = this.tree.getFocussed();
                switch (Number(_item.id)) {
                    case Fudge.MENU.ADD_NODE:
                        let child = new ƒ.Node("New Node");
                        focus.addChild(child);
                        this.tree.findItem(focus).open(true);
                        this.tree.findOpen(child).focus();
                        break;
                    case Fudge.MENU.ADD_COMPONENT:
                        let iSubclass = _item["iSubclass"];
                        let component = ƒ.Component.subclasses[iSubclass];
                        //@ts-ignore
                        let cmpNew = new component();
                        console.log(cmpNew.type, cmpNew);
                        focus.addComponent(cmpNew);
                        break;
                }
            };
            // if (_parent instanceof PanelGraph && (<PanelGraph>_parent).getNode() != null)
            //   this.setRoot((<PanelGraph>_parent).getNode());
            // else
            //   this.setRoot(new ƒ.Node("Node"));
            // this.parentPanel.addEventListener(ƒui.EVENT_USERINTERFACE.SELECT, this.setSelectedNode);
            this.contextMenu = Fudge.ContextMenu.getMenu(ViewHierarchy, this.contextMenuCallback);
        }
        cleanup() {
            //TODO: desconstruct
        }
        fillContent() {
            // remove?
        }
        /**
         * Display structure of node
         * @param _node Node to be displayed
         */
        setRoot(_node) {
            if (!_node)
                return;
            if (this.tree)
                this.dom.removeChild(this.tree);
            this.graph = _node;
            this.selectedNode = null;
            this.tree = new ƒui.Tree(new Fudge.ControllerTreeNode(), this.graph);
            // this.listController.listRoot.addEventListener(ƒui.EVENT_USERINTERFACE.SELECT, this.passEventToPanel);
            //TODO: examine if tree should fire common UI-EVENT for selection instead
            this.tree.addEventListener(ƒui.EVENT_TREE.SELECT, this.passEventToPanel);
            this.tree.addEventListener("contextmenu" /* CONTEXTMENU */, this.openContextMenu);
            this.dom.append(this.tree);
        }
    }
    Fudge.ViewHierarchy = ViewHierarchy;
})(Fudge || (Fudge = {}));
var Fudge;
(function (Fudge) {
    var ƒ = FudgeCore;
    var ƒaid = FudgeAid;
    /**
     * View displaying a Node and the hierarchical relation to its parents and children.
     * Consists of a viewport and a tree-control.
     */
    class ViewRender extends Fudge.View {
        constructor(_container, _state) {
            super(_container, _state);
            /**
             * Update Viewport every frame
             */
            this.animate = (_e) => {
                this.viewport.setGraph(this.graph);
                if (this.canvas.clientHeight > 0 && this.canvas.clientWidth > 0)
                    this.viewport.draw();
            };
            this.activeViewport = (_event) => {
                let event = new CustomEvent(Fudge.EVENT_EDITOR.ACTIVEVIEWPORT, { detail: this.viewport.camera, bubbles: false });
                // this.parentPanel.dispatchEvent(event);
                _event.cancelBubble = true;
            };
            // if (_parent instanceof PanelGraph && _parent.getNode() != null)
            //   this.graph = _parent.getNode();
            // else {
            //   this.graph = new ƒ.Node("Scene");
            // }
            console.log(_state);
            this.graph = _state["node"];
            this.createUserInterface();
        }
        cleanup() {
            ƒ.Loop.removeEventListener("loopFrame" /* LOOP_FRAME */, this.animate);
        }
        createUserInterface() {
            let cmpCamera = new ƒ.ComponentCamera();
            cmpCamera.pivot.translate(new ƒ.Vector3(3, 2, 1));
            cmpCamera.pivot.lookAt(ƒ.Vector3.ZERO());
            cmpCamera.projectCentral(1, 45);
            this.canvas = ƒaid.Canvas.create(true, ƒaid.IMAGE_RENDERING.PIXELATED);
            let container = document.createElement("div");
            container.style.borderWidth = "0px";
            document.body.appendChild(this.canvas);
            this.viewport = new ƒ.Viewport();
            this.viewport.initialize("ViewNode_Viewport", this.graph, cmpCamera, this.canvas);
            this.viewport.draw();
            this.dom.append(this.canvas);
            ƒ.Loop.start(ƒ.LOOP_MODE.TIME_REAL);
            ƒ.Loop.addEventListener("loopFrame" /* LOOP_FRAME */, this.animate);
            //Focus cameracontrols on new viewport
            let event = new CustomEvent(Fudge.EVENT_EDITOR.ACTIVEVIEWPORT, { detail: this.viewport.camera, bubbles: false });
            // this.parentPanel.dispatchEvent(event);
            this.canvas.addEventListener("click", this.activeViewport);
        }
        /**
         * Set the root node for display in this view
         * @param _node
         */
        setRoot(_node) {
            if (!_node)
                return;
            this.graph = _node;
            this.viewport.setGraph(this.graph);
        }
    }
    Fudge.ViewRender = ViewRender;
})(Fudge || (Fudge = {}));
//# sourceMappingURL=Fudge.js.map