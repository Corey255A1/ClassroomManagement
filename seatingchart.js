class Desk extends Moveable
{
    constructor(x,y,frame,clickable){
        super(x,y,document.createElement("div"),frame, clickable)
        this._content = document.createElement("div");
        this._content.classList.add("no-pointer");
        this._element.classList.add("desk");

        this._numberElement = this.MakeOverlay("div",["desk-number"]);

        let remove = this.MakeOverlay("button",["desk-delete"]);
        remove.addEventListener("click",()=>{this.Remove()});

        let clear = this.MakeOverlay("button",["desk-clear"]);       
        clear.addEventListener("click",()=>{this.Clear()});

        let swap = this.MakeOverlay("button",["desk-swap"]);       
        swap.addEventListener("click",()=>{this.Swap()});

        this._element.appendChild(this._numberElement);
        this._element.appendChild(remove);
        this._element.appendChild(clear);
        this._element.appendChild(swap);
        this._element.appendChild(this._content);
        this._drop = new Droppable(this._element);
        this._data = undefined;
        this._removeCB = undefined;
        this._clearCB = undefined;
        this._dataSetCB = undefined;
        this._swapCB = undefined;
        this._selected = false;
        this._number = 0;
        this._dataFormatFunction = (element, data)=>{
            if(data!==undefined) element.textContent = data;
            else element.textContent = "";
        }
    }

    MakeOverlay(type,classes){
        let element = document.createElement(type);
        element.classList.add("desk-icon");
        if(classes!==undefined)classes.forEach(c=>element.classList.add(c));
        return element;
    }

    set Number(value){
        this._number = value;
        this._numberElement.textContent = value;
    }
    get Number(){
        return this._number;
    }

    get Element(){
        return this._element;
    }

    

    get Selected(){
        return this._selected;
    }

    set Selected(value){
        this._selected = value;
        if(this._selected){this.Element.classList.add("selected")}
        else{this.Element.classList.remove("selected")};
    }

    set Highlight(enable){
        if(enable){
            this.Element.classList.remove("highlight-alt")
            this.Element.classList.add("highlight")
        }
        else{this.Element.classList.remove("highlight")};
    }

    set HighlightAlt(enable){
        if(enable){
            this.Element.classList.remove("highlight")
            this.Element.classList.add("highlight-alt")
        }
        else{this.Element.classList.remove("highlight-alt")};
    }

    set DisplayFormat(func){
        this._dataFormatFunction = func;
        this._dataFormatFunction(this._content, this._data);
    }

    set Data(value){
        this._data = value;
        this._dataFormatFunction(this._content, this._data);        
        if(this._dataSetCB) this._dataSetCB(value);
    }
    get Data(){
        return this._data;
    }
    OnDrop(callback){
        this._drop.OnDrop(callback);
    }
    OnRemove(callback){
        this._removeCB = callback;
    }
    OnClear(callback){
        this._clearCB = callback;
    }
    OnSwap(callback){
        this._swapCB = callback;
    }

    OnSetData(callback){
        this._dataSetCB = callback;
    }
    Clear(){
        if(this._clearCB) this._clearCB(this);
        this._data = undefined;
        this._content.innerText = "";
    }

    Remove(){
        if(this._removeCB) this._removeCB(this);
    }

    Swap(){
        if(this._swapCB) this._swapCB(this);
    }

    
}



//
class DeskPlacementPreviewer
{
    constructor(frame, max){
        this._rows = 1;
        this._columns = 1;
        this._current_count = this._rows*this._columns;
        this._spacing = 5;
        this._max = max;

        this._previewobjects = [];
        this._hidden = true;
        this._x = 0;
        this._y = 0;
        for(let i=0;i<max;i++){
            
            let elem = document.createElement("div");
            elem.classList.add("desk");
            elem.classList.add("interactive");
            elem.classList.add("no-pointer");
            let moveable = new Moveable(0,0,elem,frame,false);
            moveable.Hidden = this._hidden;
            this._previewobjects.push(moveable);
        }
    }
    set Rows(value){
        this._rows = value;
        this._current_count = this._rows*this._columns;
        this.Hidden = this._hidden;

    }
    set Columns(value){
        this._columns = value;
        this._current_count = this._rows*this._columns;
        this.Hidden = this._hidden;
    }
    get Objects(){
        return this._previewobjects;
    }

    get Hidden(){
        return this._hidden;
    }
    set Hidden(value){
        
        //If we are already hidden, don't doing thing
        //If we are hidding, hide them all
        //if we setting visible, reveal the ones we care about, hide the rest
        if(!this._hidden && value === true){ 
            this._previewobjects.forEach((o)=>o.Hidden=true);
        }else if(value === false){
            this._previewobjects.forEach((o,i)=>                
                o.Hidden=i<this._current_count?false:true
            );
        }
        this._hidden = value;
    }

    MoveTo(x,y){
        this._x = x;
        this._y = y;
        for(let r=0; r<this._rows;r++){
            for(let c=0; c<this._columns; c++){
                let idx = this._columns*r + c;
                if(idx>=this._max) break;
                let obj = this._previewobjects[idx];
                obj.MoveTo(x+(this._spacing+obj.Width)*c,y+(this._spacing+obj.Height)*r,true);
            }
        }
    }

    *GetCoords(){
        for(let i=0;i<this._current_count;i++){
            let obj = this._previewobjects[i];
            yield {X:obj.X, Y:obj.Y};
        }
    }

}


//
class DeskManager
{
    constructor(id){
        this._frame = new MoveFrame(id);
        this._frame.OnPointerMove((x,y,state)=>this.PointerMove(x,y,state))
        this._frame.OnPointerEnter((ev,state)=>this.PointerEnter(ev,state))
        this._frame.OnPointerInteracted((obj,interacted,wasMoved)=>{this.DeskInteracted(obj,interacted,wasMoved)})
        this._desks = [];
        this._deskListModifiedCB = undefined;
        this._interactiveAdd = false;

        this._interactive = new DeskPlacementPreviewer(this._frame,30);
        this._currentSwap = undefined;
    }
    get Count(){
        return this._desks.length;
    }
    set PreviewRows(value){
        this._interactive.Rows = value;
    }
    set PreviewColumns(value){
        this._interactive.Columns = value;
    }

    set GridSize(value){
        this._frame.GridSize = value;
    }

    set InteractiveAdd(value){
        this._interactiveAdd = value;
    }

    OnDeskListModified(callback){
        this._deskListModifiedCB = callback;
    }

    Find(prop,value){
        return this._desks.find(d=>{
            if(d.Data) return d.Data[prop]===value
            else return false;
        });
    }
    NewDesk(x,y){
        x = x===undefined ? 0 : x;
        y = y===undefined ? 0 : y;
        let desk = new Desk(x,y,this._frame,true);
        desk.OnSwap((d)=>{
            if(this._currentSwap !== undefined && this._currentSwap !== d){
                let tempData = this._currentSwap.Data;
                this._currentSwap.Data = d.Data;
                d.Data = tempData
                this._currentSwap.HighlightAlt = false;
                this._currentSwap = undefined;
            }else if(this._currentSwap !== undefined && this._currentSwap === d){
                d.HighlightAlt = false;
                this._currentSwap = undefined;
            } else{
                d.HighlightAlt = true;
                this._currentSwap = d;
            }
        })
        desk.Number = this._desks.length + 1;
        //this._frame.AddObject(desk);
        this._desks.push(desk);
        if(this._deskListModifiedCB) this._deskListModifiedCB(desk, true);
        return desk;
    }
    Remove(desk){
        let idx = this._desks.indexOf(desk);
        if(idx >=0){
            this._desks.splice(idx,1);
            this._desks.forEach((d,i)=>{d.Number = i+1});
        }
        desk.Element.remove();
        if(this._currentSwap === desk){
            this._currentSwap = undefined
        }
        if(this._deskListModifiedCB) this._deskListModifiedCB(desk, false);
    }

    DeskInteracted(obj,interacted, wasMoved){
        if(obj === undefined){
            if(interacted === false){
                this._desks.forEach(
                    (d)=>{
                        if(d.Selected){
                            d.Selected = false;
                            this._frame.RemoveInteraction(d);
                        }
                    });
            }else if(this._interactiveAdd && interacted === true){
                let objyield = this._interactive.GetCoords();
                let data = objyield.next();
                while(!data.done){
                    this.NewDesk(data.value.X,data.value.Y);
                    data = objyield.next();
                }
            }
        }
        else
        {
            let desk = this._desks.find((d)=>{return d.Element === obj.Element});
            if(!interacted && desk){
                if(!wasMoved){
                    desk.Selected = !desk.Selected; 
                }
                if(!desk.Selected){
                    this._frame.RemoveInteraction(obj);
                }
            }else if(interacted){
                this._frame.SetInteraction(obj);
            }
        }
    }

    PointerEnter(ev,state){
        if(state){
            if(this._interactiveAdd){
                this._interactive.Hidden = false;
            }
        }else{
            if(this._interactiveAdd){
                this._interactive.Hidden = true;
            }
        }
    }

    PointerMove(x,y,state){
        if(this._interactiveAdd){
            this._interactive.MoveTo(x,y,true);
            return true;
        }
        return false;
    }

    SetData(deskconfig, dataresolver){
        let new_desk_count = deskconfig===undefined ? 0 : deskconfig.length;
        let current_desk_count = this._desks.length;
        for(let n=0;n<new_desk_count;n++){
            let olddesk = deskconfig[n];
            let currdesk;
            if(n<current_desk_count){
                currdesk = this._desks[n];
                currdesk.MoveTo(olddesk.x, olddesk.y, false);
                currdesk.Clear();
            }else{
                currdesk = this.NewDesk(olddesk.x, olddesk.y);
            }
            if(olddesk.data){
                let resolveddata = dataresolver(olddesk.data);
                if(resolveddata !== undefined){
                    currdesk.Data = resolveddata;
                }
            }
        }
        let diff =  current_desk_count - new_desk_count;
        if(diff > 0){
            for(let n=0; n<diff; n++){
                this.Remove(this._desks[new_desk_count]);
            }
        }
    }

    GetData(){
        let ret=[]
        this._desks.forEach((d)=>{ret.push({
            number:d.Number,
            x:d.X,
            y:d.Y,
            data:d.Data
        })});
        return ret;
    }
    ClearData(){
        this._desks.forEach((d)=>{d.Clear()})
    }
}




//Load in the plug in
function LoadSeatingChart(class_options, student_list, data){
    const desk_manager = new DeskManager("desk-view");

    const Classes = data.classes;
    const DeskConfiguration = data.deskconfiguration;

    

    student_list.addOnItemHover((ev)=>{
        let obj = ev.detail.obj;
        let desk = desk_manager.Find("uid",obj.Data.uid);
        if(desk){
            desk.Highlight = ev.detail.hover;
        }
    });


    //Update our data if the class is changed
    class_options.addSelectedItemChanged((ev)=>{
        let detail = ev.detail;
        //Store off current data
        if(detail.previous.Data){
            let data = [];
            desk_manager.GetData().forEach((desk)=>{
                let chunk = {
                    x:desk.x,
                    y:desk.y
                 }
                 if(desk.data){
                     chunk.data = {uid:desk.data.uid};
                 }
                data.push(chunk);
            })
            DeskConfiguration[detail.previous.Data] = data;
        }
        SetClass(detail.current.Data);
    });

    const desk_count = document.getElementById("desk-count");
    desk_manager.GridSize = 10;
    desk_manager.OnDeskListModified((desk, added)=>{
        if(added){
            desk.DisplayFormat = (element,data)=>{
                if(data !== undefined) element.textContent = data["name"];
                else element.textContent = "";
            }
            desk.OnDrop((obj)=>{
                let existing = desk_manager.Find("uid",obj.uid);
                if(existing){
                    existing.Clear();
                    existing.Highlight = false;
                }
                if(desk.Data !== undefined){
                    let list_item = student_list.Find("uid",desk.Data.uid);
                    if(list_item){
                        list_item.RemoveIndicator("has_desk");
                        student_list.RefreshFilter();
                    }
                }
                desk.Data = obj;
                
            });
            desk.OnSetData((obj)=>{
                if(obj!== undefined && obj.uid !== undefined){
                    let list_item = student_list.Find("uid",obj.uid);
                    if(list_item){
                        list_item.AddIndicator("D","has_desk");
                        student_list.RefreshFilter();
                    }
                }
            })
            desk.OnClear((obj)=>{
                if(obj.Data){
                    let list_item = student_list.Find("uid",obj.Data.uid);
                    if(list_item){
                        list_item.RemoveIndicator("has_desk");
                        student_list.RefreshFilter();
                    }
                }
            })
            desk.OnRemove((obj)=>{
                desk_manager.Remove(obj);
                if(obj.Data){
                    let list_item = student_list.Find("uid",obj.Data.uid);
                    if(list_item){
                        list_item.RemoveIndicator("has_desk");
                        student_list.RefreshFilter();
                    }
                }
            });
        }
        desk_count.textContent = desk_manager.Count;
    });
    
    const add_desk = document.getElementById("add-desk-btn");
    add_desk.addEventListener("click",()=>{
        let d = desk_manager.NewDesk();        
    }); 

    const quick_desk = document.getElementById("quick-desk-btn");
    quick_desk.addEventListener("click",()=>{
        quick_desk.classList.toggle("push-active");
        let active = quick_desk.classList.contains("push-active");
        desk_manager.InteractiveAdd = active;
    });

    const apply_to_all = document.getElementById("apply-to-all-btn");
    apply_to_all.addEventListener("click",()=>{
        let data = [];
        desk_manager.GetData().forEach((desk)=>{
            data.push({x:desk.x,y:desk.y});
        })
        Object.keys(DeskConfiguration).forEach((class_period)=>{
            let current_config = DeskConfiguration[class_period];
            DeskConfiguration[class_period] = [];
            data.forEach(d=>{
                DeskConfiguration[class_period].push({x:d.x,y:d.y});
            })
            current_config.forEach((config,i)=>{
                if(i<data.length && config.data){
                    DeskConfiguration[class_period][i].data = config.data;
                }
            })
        });
        
    });

    const desk_rows_edit = document.getElementById("desk-rows-edit");
    function UpdateRowControl(){
        desk_manager.PreviewRows = toInt(desk_rows_edit.value,1);
    }
    UpdateRowControl();
    desk_rows_edit.addEventListener("change",UpdateRowControl);
    desk_rows_edit.addEventListener("input",UpdateRowControl);

    const desk_columns_edit = document.getElementById("desk-columns-edit");
    function UpdateColControl(){
        desk_manager.PreviewColumns = toInt(desk_columns_edit.value,1);
    }
    UpdateColControl();
    desk_columns_edit.addEventListener("change",UpdateColControl);
    desk_columns_edit.addEventListener("input",UpdateColControl);


    function SetClass(classname){
        desk_manager.SetData(DeskConfiguration[classname],(data)=>{
            if(data.uid!==undefined){
                return Classes[classname].students.find(s=>s.uid==data.uid);
            }
            return undefined;
        });
    }

    SetClass(class_options.SelectedItem.Data);
}

