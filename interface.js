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
        this._hoverCB = undefined;
    }
    OnHover(cb){
        this._hoverCB = cb;
    }
    DragStart(ev){
        ev.dataTransfer.setData("text/plain", JSON.stringify(this.Data));
    }
    Hover(active){
        if(active) this._element.classList.add("highlight");
        else this._element.classList.remove("highlight");
        if(this._hoverCB) this._hoverCB(this, active);
    }
    set Hidden(hidden){
        if(hidden) this._element.style.display = "none";
        else this._element.style.display = "";
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
    }

    set SortKey(value){
        this._sort_key = value;
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

    Clear()
    {
        this._items = [];
        this._element.innerText = "";
    }
    AddItem(item){
        this._items.push(item)
        this._element.appendChild(item.Element);
        return item;
    }
    NewItem(content, data){
        let item = new DragListItem(content, data);
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
        this._selected_item_changed_cb = undefined;
    }
    OnSelectedItemChanged(callback){
        this._selected_item_changed_cb = callback;
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
            if(this._selected_item_changed_cb){
                this._selected_item_changed_cb(this._selected_item, previous);
            }
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
            tev.preventDefault();
            tev.stopPropagation();
            this.PointerInteract(tev.touches[0],true)
        });
        this._element.addEventListener("touchend",(tev)=>{
            tev.preventDefault();
            tev.stopPropagation();
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
        
        if(this._pointerMoveCB) this._pointerMoveCB(this._lastX,this._lastY,pointerState);
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
        if(clickable){
            this._element.addEventListener("touchstart",(tev)=>{
                tev.preventDefault();
                this.PointerDown(tev.touches[0])
            });
            this._element.addEventListener("touchend",(tev)=>{
                tev.preventDefault();
                this.PointerUp(tev.touches[0])
            });
            this._element.addEventListener("mousedown", (ev)=>{this.PointerDown(ev)});
            this._element.addEventListener("mouseup", (ev)=>{this.PointerUp(ev)});
        }
        
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
        this._parent_frame.ObjectInteraction(this,true,this._was_moved);
    }
    PointerUp(ev){
        this._parent_frame.ObjectInteraction(this,false,this._was_moved);
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

class StudentListItem extends DragListItem{
    constructor(name,data){
        super("",data);
        this._nameElement = document.createElement("div");
        this._nameElement.textContent = name;
        this._indicatorsElement = document.createElement("div");
        this._indicatorsElement.classList.add("icon-row");
        this.Element.appendChild(this._nameElement);
        this.Element.appendChild(this._indicatorsElement);
        this._icons = {};
    }
    HasIndicator(typename){
        return this._icons[typename] !== undefined;
    }
    AddIndicator(indicator,typename){
        if(this._icons[typename] === undefined){
            
            let icon = document.createElement("div");
            icon.classList.add("icon");
            icon.style.backgroundColor = "rgb(0,200,200)";
            icon.style.color = "white";
            icon.innerHTML = indicator;
            this._icons[typename] = icon;
            this._indicatorsElement.appendChild(icon);
        }
        
    }
    RemoveIndicator(typename){
        if(this._icons[typename] !== undefined)
        {
            this._icons[typename].remove();
            this._icons[typename] = undefined;
        }
    }
    
}


class Desk extends Moveable
{
    constructor(x,y,frame,clickable){
        super(x,y,document.createElement("div"),frame, clickable)
        this._content = document.createElement("div");
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

class DeskManager
{
    constructor(id){
        this._frame = new MoveFrame(id);
        this._frame.OnPointerMove((x,y,state)=>{this.PointerMove(x,y,state)})
        this._frame.OnPointerEnter((ev,state)=>{this.PointerEnter(ev,state)})
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
        }
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
                console.log(olddesk.data);
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


//---- Business Logic ----
//Some dummy data
const Classes = {
    "1st":{
    students:[
        {firstname:"Roberto",lastname:"Nunez",uid:"1",properties:{}},
        {firstname:"Casandra",lastname:"LaGrange",uid:"2",properties:{}},
        {firstname:"Timothy",lastname:"Johnson",uid:"3",properties:{}},
        {firstname:"Giorgio",lastname:"DaVinci",uid:"4",properties:{}}
    ]},
    "2nd":{
    students:[
        {firstname:"Connor",lastname:"Schwendeman",uid:"5",properties:{}},
        {firstname:"Alexis",lastname:"Lovelace",uid:"6",properties:{}},
        {firstname:"Samantha",lastname:"Butterscotch",uid:"7",properties:{}},
        {firstname: "Wu",lastname: "Xingping",uid:"8",properties:{}},
        {firstname: "Robbie",lastname: "Jones",uid:"9",properties:{}},
        {firstname: "Robbie",lastname: "Jones",uid:"10",properties:{}},
    ]}
}

const DeskConfiguration = {
    "1st":[
        {x:100, y:100, data:{uid:"1"}},
        {x:200, y:150, data:{}}
    ]
}




//Build Class List Selections

let class_options = new ComboBox("class-selection");
Object.keys(Classes).forEach(key=>{
    class_options.AddItem(key,key);
});

class_options.SelectedItem = "2nd";
let student_list = new DragList("student-list");
student_list.SortKey = "lastname";
function SetStudentList(class_key){
    student_list.Clear();
    Classes[class_key].students.forEach(student=>{
       student.name = [student.firstname, student.lastname].join(" ");
       let studentitem = new StudentListItem(student.name, student); 
       let item = student_list.AddItem(studentitem);
       item.OnHover((obj, hover)=>{
            let desk = desk_manager.Find("uid",obj.Data.uid);
            if(desk){
                desk.Highlight = hover;
            }
       })
    });
    student_list.Sort();
}
class_options.OnSelectedItemChanged((item,prev)=>{
    if(prev.Data){
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
        DeskConfiguration[prev.Data] = data;
    }

    SetStudentList(item.Data);
    desk_manager.SetData(DeskConfiguration[item.Data],(data)=>{
        if(data.uid!==undefined){
            let student = Classes[item.Data].students.find(s=>s.uid==data.uid);
            return {data:student,key:"name"}
        }
        return undefined;
    });
});

SetStudentList(class_options.SelectedItem.Data);

const student_filter = document.getElementById("student-filter-edit");
student_filter.addEventListener("input",()=>{
    student_list.AddFilter("name", item=>item.Data.name.includes(student_filter.value));
});


const sort_first = document.getElementById("sort-firstname-btn");
sort_first.addEventListener("click",()=>{
    student_list.SortKey = "firstname";
    student_list.Sort();
});


const sort_last = document.getElementById("sort-lastname-btn");
sort_last.addEventListener("click",()=>{
    student_list.SortKey = "lastname";
    student_list.Sort();
});




const desk_manager = new DeskManager("desk-view");
const desk_count = document.getElementById("desk-count");
desk_manager.GridSize = 10;
desk_manager.OnDeskListModified((desk, added)=>{
    if(added){
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
            desk.SetData(obj,"name");
            
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

function toInt(value,def){
    let num = parseInt(value);
    if(isNaN(num)){
        num = def;
    }
    return num
}



const desk_rows_edit = document.getElementById("desk-rows-edit");
desk_manager.PreviewRows = toInt(desk_rows_edit.value,1);
desk_rows_edit.addEventListener("change",(e)=>{
    desk_manager.PreviewRows = toInt(desk_rows_edit.value,1);
})
desk_rows_edit.addEventListener("input",(e)=>{
    desk_manager.PreviewRows = toInt(desk_rows_edit.value,1);
})
const desk_columns_edit = document.getElementById("desk-columns-edit");
desk_manager.PreviewColumns = toInt(desk_columns_edit.value,1);
desk_columns_edit.addEventListener("change",(e)=>{
    desk_manager.PreviewColumns = toInt(desk_columns_edit.value,1);
})
desk_columns_edit.addEventListener("input",(e)=>{
    desk_manager.PreviewColumns = toInt(desk_columns_edit.value,1);
})


function FilterByHasDesk(value){
    if(value){
        student_list.AddFilter("has_desk",(items)=>!items.HasIndicator("has_desk"));
    }else{
        student_list.RemoveFilter("has_desk");
    }
}
const assigned_desk_chk = document.getElementById("assigned-desk-chk");
FilterByHasDesk(assigned_desk_chk.checked);
assigned_desk_chk.addEventListener("change",(e)=>{
    FilterByHasDesk(assigned_desk_chk.checked);
})