//Try To make some reusable sensical Classes for stuff
class DataItem
{
    constructor(domelement, data){
        this._element = domelement;
        this._data = data;
    }
    get Element()
    {
        return this._element;
    }
    get Data()
    {
        return this._data;
    }
}

class DragListItem extends DataItem
{
    constructor(content, data)
    {
        super(document.createElement('li'), data);
        this._element.innerHTML = content;
        this._element.draggable = true;
        this._element.addEventListener("dragstart",(ev)=>{this.DragStart(ev);});
        this._element.addEventListener("mouseover",()=>{this.Hover(true)});
        this._element.addEventListener("mouseleave",()=>{this.Hover(false)});
        this._element.addEventListener("click",()=>{this.Clicked()});
        this._hoverCB = undefined;
        this._selected = false;
    }

    set Hidden(hidden){
        if(hidden) this._element.style.display = "none";
        else this._element.style.display = "";
    }
    set Selected(value){
        if(value) this._element.classList.add("selected");
        else this._element.classList.remove("selected");
        this._selected = value;
    }
    get Selected(){
        return this._selected;
    }
    DragStart(ev){
        ev.dataTransfer.setData("text/plain", JSON.stringify(this.Data));
    }

    OnHover(cb){
        this._hoverCB = cb;
    }
    Hover(active){
        //if(active) this._element.classList.add("highlight");
        //else this._element.classList.remove("highlight");
        if(this._hoverCB) this._hoverCB(this, active);
    }

    OnClicked(cb){
        this._clickedCB = cb;
    }
    Clicked(){
        if(this._clickedCB) this._clickedCB(this);
    }


}

class DragList
{
    constructor(id){
        this._element = document.getElementById(id);
        this._element.innerText = "";
        this._items = [];
        this._sort_key = undefined;
        this._current_filters = {};
        this._current_selected_item = undefined;
    }

    set SortKey(value){
        this._sort_key = value;
    }

    get SelectedItem()
    {
        return this._current_selected_item;
    }

    Sort(){
        this._items.sort((a,b)=>{
            return a.Data[this._sort_key].localeCompare(b.Data[this._sort_key])
        })
        this._items.forEach(i=>{
            i.Element.remove();
            this._element.appendChild(i.Element);
        })
    }

    addOnItemHover(e){
        this._element.addEventListener("itemhover",e);
    }
    removeOnItemHover(e){
        this._element.removeEventListener("itemhover",e);
    }

    addOnItemSelected(e){
        this._element.addEventListener("itemselected",e);
    }
    removeOnItemSelected(e){
        this._element.removeEventListener("itemselected",e);
    }

    connectCallbacks(item){
        item.OnHover((obj, hover)=>{
            let event = new CustomEvent("itemhover",{"detail":{dataobject:obj,hover:hover}});
            this._element.dispatchEvent(event);
        });
        item.OnClicked((obj)=>{
            if(obj!==undefined && this._current_selected_item !== obj){
                if(this._current_selected_item!==undefined)
                {
                    this._current_selected_item.Selected = false;
                }
                this._current_selected_item = obj;
                this._current_selected_item.Selected = true;
                let event = new CustomEvent("itemselected",{"detail":{dataobject:obj}});
                this._element.dispatchEvent(event);
            }
        });
    }

    Clear()
    {
        this._items = [];
        this._element.innerText = "";
    }
    AddItem(item){
        this.connectCallbacks(item);
        this._items.push(item)
        this._element.appendChild(item.Element);
        return item;
    }
    NewItem(content, data){
        let item = new DragListItem(content, data);
        this.connectCallbacks(item);
        this._items.push(item)
        this._element.appendChild(item.Element);
        return item;
    }
    RefreshFilter(){
        this._items
            .forEach(item=>{
                item.Hidden = !Object.values(this._current_filters)
                    .every(filter=>filter(item));
            });
    }
    AddFilter(filtername, filterfunction){
        //if(this._current_filters[filtername] === undefined){
            this._current_filters[filtername] = filterfunction;
            this.RefreshFilter();
        //}
    }
    RemoveFilter(filtername){
        if(this._current_filters[filtername] !== undefined){
           delete this._current_filters[filtername];
           this.RefreshFilter();
        }
    }
    Find(key, value){
        return this._items.find(o=>{
           return o.Data[key] == value;
        })
    }
}



class Droppable
{
    constructor(element){
        this._element = element;
        this._element.addEventListener("dragover",(ev)=>{this.DragOver(ev)});
        this._element.addEventListener("drop",(ev)=>{this.Drop(ev)});
        this._dropCB = undefined;

    }
    DragOver(ev){
        ev.preventDefault();
    }
    Drop(ev){
        ev.preventDefault();
        if(this._dropCB) this._dropCB(JSON.parse(ev.dataTransfer.getData("text/plain")));
    }
    OnDrop(cb){
        this._dropCB = cb;
    }
}



class ComboBoxItem extends DataItem{
    constructor(content, data){
        super(document.createElement('option'), data);
        this._element.innerHTML = content;
    }
}

class ComboBox{
    constructor(id){
        this._element = document.getElementById(id);
        this._element.innerText = "";
        this._element.addEventListener("change",()=>{this.SelectionChanged()});
        this._items = [];
        this._selected_item = undefined;
    }
    addSelectedItemChanged(callback){
        this._element.addEventListener("selecteditemchanged",callback)
    }
    set SelectedItem(value){
        if(this._selected_item && 
            this._selected_item.Data !== value)
        {
            this._selected_item.Element.selected = false;
        }
        this._selected_item = undefined;
        let selected = this._items.find(item=>item.Data === value);
        if(selected){
            this._selected_item = selected;
            this._selected_item.Element.selected = true;
        }
    }
    get SelectedItem(){
        return this._selected_item;
    }
    SelectionChanged(){
        let selected = this._items.find(item=>item.Element.selected);
        if(selected){
            let previous = this._selected_item;
            this._selected_item = selected;
            let event = new CustomEvent("selecteditemchanged",{"detail":{current:this._selected_item, previous:previous}});
            this._element.dispatchEvent(event);
        }
    }
    AddItem(content, data){
        let dataitem = new ComboBoxItem(content, data);
        this._element.appendChild(dataitem.Element);
        this._items.push(dataitem);
    }
}

class MoveFrame
{
    constructor(id){
        this._element = document.getElementById(id);
        this._element.addEventListener("touchstart",(tev)=>{
            if(this.PointerInteract(tev.touches[0],true))
            {
                tev.preventDefault();
                tev.stopPropagation();
            }
        });
        this._element.addEventListener("touchend",(tev)=>{
            //tev.preventDefault();
            //tev.stopPropagation();
            this.PointerInteract(tev.touches[0],false)
        });
        this._element.addEventListener("touchcancel",(tev)=>{this.PointerInteract(tev.touches[0],false)});
        this._element.addEventListener("touchmove",(tev)=>{this.PointerMove(tev.touches[0])});
        this._element.addEventListener("mouseenter",(ev)=>{this.PointerEnter(ev,true)});
        this._element.addEventListener("mouseleave",(ev)=>{this.PointerEnter(ev,false)});
        this._element.addEventListener("mousemove",(ev)=>{this.PointerMove(ev)});
        this._element.addEventListener("mouseup",(ev)=>{this.PointerInteract(ev,false)});
        this._element.addEventListener("mousedown",(ev)=>{this.PointerInteract(ev,true)});
        this._pointer_down = false;
        this._rect = this._element.getBoundingClientRect();
        this._pageX = this._rect.x;
        this._pageY = this._rect.y;
        this._objects = [];
        this._current_interactions = [];
        this._lastX = 0;
        this._lastY = 0;
        this._grid_size = 5;
        this._pointerMoveCB = undefined;
        this._pointerEnterCB = undefined;
        this._pointerInteractedCB = undefined;
    }
    get Element(){
        return this._element;
    }
    set GridSize(value){
        this._grid_size = value;
    }
    OnPointerEnter(callback){
        this._pointerEnterCB = callback;
    }
    OnPointerMove(callback){
        this._pointerMoveCB = callback;
    }
    OnPointerInteracted(callback){
        this._pointerInteractedCB = callback;
    }
    RoundToGrid(value){
        return Math.floor(value/this._grid_size)*this._grid_size;
    }
    AddObject(obj){
        this._element.appendChild(obj.Element);
        //let moveable = new Moveable(x,y,element, this, clickable);
        this._objects.push(obj);
        return obj;
    }
    PointerEnter(ev,entered){
        if(this._pointerEnterCB) this._pointerEnterCB(ev,entered);
    }
    PointerInteract(ev,pointerState){
        
        if(pointerState===true){
            this._pointer_down = true;
            let x = this.RoundToGrid(ev.clientX - this._pageX);
            let y = this.RoundToGrid(ev.clientY - this._pageY);
            this._lastX = x;
            this._lastY = y;
        }else if(pointerState === false){
            this._pointer_down = false;
        }
        if(this._pointerInteractedCB && ev.target === this._element) this._pointerInteractedCB(undefined, pointerState, undefined);
        // if(this._pointerMoveCB){
        //     return this._pointerMoveCB(this._lastX,this._lastY,pointerState);
        // }
        return false;
    }
    PointerMove(ev){
        
        let x = this.RoundToGrid(ev.clientX - this._pageX);
        let y = this.RoundToGrid(ev.clientY - this._pageY);
        let dX = x - this._lastX;
        let dY = y - this._lastY;
        if(this._pointer_down){
            this._current_interactions.forEach((interaction)=>{
                interaction.Move(dX,dY);
            })
        }

        this._lastX = x;
        this._lastY = y;
        if(this._pointerMoveCB) this._pointerMoveCB(x,y);
    }
    ObjectInteraction(obj, state, wasMoved){
        if(this._pointerInteractedCB) this._pointerInteractedCB(obj, state, wasMoved);
    }
    SetInteraction(obj){
        if(this._current_interactions.indexOf(obj) == -1){
            this._current_interactions.push(obj);
        }
        //if(this._pointerInteractedCB) this._pointerInteractedCB(obj, true);
    }
    RemoveInteraction(obj){
        let idx = this._current_interactions.indexOf(obj)
        this._current_interactions.splice(idx,1);
        //if(this._pointerInteractedCB) this._pointerInteractedCB(obj, false);
    }
    
}

class Moveable
{
    constructor(x, y, element, parentFrame, clickable){
        this._parent_frame = parentFrame;
        this._element = element;
        this._parent_frame.AddObject(this);
        
        this._rect = this._element.getBoundingClientRect();
        this._half_width = Math.floor(this._rect.width/2);
        this._half_height = Math.floor(this._rect.height/2);
        
        this._x = undefined;
        this._y = undefined;
        this.X = x;
        this.Y = y;
        this._was_moved = false;
        this._pointer_down = false;
        if(clickable){
            this._element.addEventListener("touchstart",(tev)=>{
                if(tev.target === this._element){
                    tev.preventDefault();
                    this.PointerDown(tev.touches[0])
                }
            });
            this._element.addEventListener("touchend",(tev)=>{
                //tev.preventDefault();
                this.PointerUp(tev.touches[0])
            });
            this._element.addEventListener("mousedown", (ev)=>{ if(ev.srcElement === this._element) this.PointerDown(ev)});
            this._element.addEventListener("mouseup", (ev)=>{ if(ev.srcElement === this._element) this.PointerUp(ev)});
        }        
    }

    set Hidden(value){
        if(value) this._element.style.display = "none";
        else this._element.style.display = "";
    }
    get Element(){
        return this._element;
    }
    set X(value){
        this._x = value;
        this._element.style.left = this._x+'px'
    }
    get X()
    {
        return this._x;
    }
    set Y(value){
        this._y = value;
        this._element.style.top = this._y+'px'
    }
    get Y()
    {
        return this._y;
    }
    get Width(){
        return this._rect.width;
    }
    get Height(){
        return this._rect.height;
    }
    get HWidth(){
        return this._half_width;
    }
    get HHeight(){
        return this._half_height;
    }


    MoveTo(x,y,center){
        if(center){
            let nx = x - this._half_width;
            if(nx<0) nx = 0;
            else if(nx>this._parent_frame._rect.width) nx= this._parent_frame._rect.width;
            this.X = this._parent_frame.RoundToGrid(nx);

            let ny = y - this._half_height;
            if(ny<0) ny = 0;
            else if(ny>this._parent_frame._rect.height) ny= this._parent_frame._rect.height;
            this.Y = this._parent_frame.RoundToGrid(ny);
        }else{
            this.X = x;
            this.Y = y;
        }
        this._was_moved = true;
    }
    Move(dx,dy){
        let nx = this._parent_frame.RoundToGrid(this._x + dx);
        if(nx>0 && nx<this._parent_frame._rect.width){
            this.X = nx;
        }
        let ny = this._parent_frame.RoundToGrid(this._y + dy);
        if(ny>0 && ny<this._parent_frame._rect.height){
            this.Y = ny;
        }
        this._was_moved = true;
    }
    PointerDown(ev){
        this._was_moved = false;
        this._pointer_down = true;
        this._parent_frame.ObjectInteraction(this,true,this._was_moved);
    }
    PointerUp(ev){
        if(this._pointer_down){
            this._parent_frame.ObjectInteraction(this,false,this._was_moved);
            this._pointer_down = false;
        }
    }    
}




//Fancy Nav Drop Down
const nav_combo = document.querySelectorAll(".nav-combo");
nav_combo.forEach((nav)=>{
    const current = nav.querySelector(".nav-current");
    let selected = undefined;
    const open = nav.querySelector(".nav-open");
    const options = nav.querySelector(".nav-options");
    const all_links = nav.querySelectorAll("a");
    all_links.forEach((l)=>{
        if(l.classList.contains("selected"))
        {
            current.textContent = l.textContent;
            selected = l;
        }
        l.addEventListener("click",(e)=>{
            options.classList.add("collapsed");
            if(selected !== undefined && selected !== l){
                selected.classList.remove("selected");
                l.classList.add("selected");
                current.textContent = l.textContent;
                selected = l;
                const event = new CustomEvent("navcomboselected", {"detail":l});
                nav.dispatchEvent(event);
            }
        });
    })
    
    open.addEventListener("click",()=>
    {
        options.classList.toggle("collapsed");
    })
})