
class Desk extends Moveable
{
    constructor(x,y,frame,clickable){
        super(x,y,document.createElement("div"),frame, clickable)
        this._content = document.createElement("div");
        this._content.classList.add("no-pointer");
        this._numberElement = document.createElement("div");
        this._numberElement.classList.add("desk-number");
        let remove = document.createElement("button");
        let clear = document.createElement("button");
        this._element.classList.add("desk");
        remove.classList.add("desk-delete");
        remove.addEventListener("click",()=>{this.Remove()});
        clear.classList.add("desk-clear");
        clear.addEventListener("click",()=>{this.Clear()});
        this._element.appendChild(this._numberElement);
        this._element.appendChild(remove);
        this._element.appendChild(clear);
        this._element.appendChild(this._content);
        this._drop = new Droppable(this._element);
        this._data = undefined;
        this._removeCB = undefined;
        this._clearCB = undefined;
        this._dataSetCB = undefined;
        this._selected = false;
        this._number = 0;
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

    get Data(){
        return this._data;
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
        if(enable){this.Element.classList.add("highlight")}
        else{this.Element.classList.remove("highlight")};
    }

    SetData(value,displayprop){
        this._data = value;
        this._content.innerText = value[displayprop];
        if(this._dataSetCB) this._dataSetCB(value);
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
        if(this._deskListModifiedCB) this._deskListModifiedCB(desk, false);
    }

    DeskInteracted(obj,interacted, wasMoved){
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
            if(state===true){
                let objyield = this._interactive.GetCoords();
                let data = objyield.next();
                while(!data.done){
                    this.NewDesk(data.value.X,data.value.Y);
                    data = objyield.next();
                }
            }
            return true;
        }
        return false;
    }

    SetData(deskconfig, dataformatfunction){
        let new_desk_count = deskconfig.length;
        let current_desk_count = this._desks.length;
        for(let n=0;n<deskconfig.length;n++){
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
                let format = dataformatfunction(olddesk.data);
                if(format !== undefined && format.data !== undefined){
                    currdesk.SetData(format.data,format.key);
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
