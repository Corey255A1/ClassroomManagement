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

}

class DragList
{
    constructor(id){
        this._element = document.getElementById(id);
        this._element.innerText = "";
        this._items = [];
        this._sort_key = undefined;
    }

    set SortKey(value){
        this._sort_key = value;
    }

    Sort(){
        this._items.sort((a,b)=>{
            return a.Data[this._sort_key].localeCompare(b.Data[this._sort_key])
        })
        this._items.forEach(i=>{
            this._element.removeChild(i.Element);
            this._element.appendChild(i.Element);
        })
        
    }

    Clear()
    {
        this._items = [];
        this._element.innerText = "";
    }
    AddItem(content, data){
        let item = new DragListItem(content, data);
        this._items.push(item)
        this._element.appendChild(item.Element);
        return item;
    }
    Filter(text){
        this._element.innerText = "";
        this._items
            .filter(item=>item.Data.name.includes(text))
            .forEach(item=>{this._element.appendChild(item.Element)})
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
            this._selected_item = selected;
            if(this._selected_item_changed_cb){
                this._selected_item_changed_cb(this._selected_item);
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
        this._element.addEventListener("mousemove",(ev)=>{this.PointerMove(ev)});
        this._element.addEventListener("mouseup",(ev)=>{this.PointerMove(ev,false)});
        this._element.addEventListener("mousedown",(ev)=>{this.PointerMove(ev,true)});
        this._rect = this._element.getBoundingClientRect();
        this._pageX = this._rect.x;
        this._pageY = this._rect.y;
        this._objects = [];
        this._current_interaction = undefined;
        this._lastX = 0;
        this._lastY = 0;
        this._grid_size = 5;
        this._pointerMoveCB = undefined;
    }
    get Element(){
        return this._element;
    }
    set GridSize(value){
        this._grid_size = value;
    }
    OnPointerMove(callback){
        this._pointerMoveCB = callback;
    }
    RoundToGrid(value){
        return Math.floor(value/this._grid_size)*this._grid_size;
    }
    AddObject(x,y,element,clickable){
        this._element.appendChild(element);
        let moveable = new Moveable(x,y,element, this, clickable);
        this._objects.push(moveable);
        return moveable;
    }
    PointerMove(ev,pointerState){
        let x = this.RoundToGrid(ev.clientX - this._pageX);
        let y = this.RoundToGrid(ev.clientY - this._pageY);
        if(this._current_interaction){
            
            let dX = x - this._lastX;
            let dY = y - this._lastY;
            this._current_interaction.Move(dX,dY);
            this._lastX = x;
            this._lastY = y;
        }
        if(this._pointerMoveCB) this._pointerMoveCB(x,y,pointerState);
    }
    SetInteraction(obj, x, y){
        this._current_interaction = obj;
        this._lastX = this.RoundToGrid(x - this._pageX);
        this._lastY = this.RoundToGrid(y - this._pageY);
    }
    ClearInteraction(){
        this._current_interaction = undefined;
    }
    
}

class Moveable
{
    constructor(x, y, element, parent, clickable){
        this._element = element;
        this._rect = this._element.getBoundingClientRect();
        console.log(this._rect);
        this._half_width = Math.floor(this._rect.width/2);
        this._half_height = Math.floor(this._rect.height/2);
        this._parent = parent;
        this._x = undefined;
        this._y = undefined;
        this.X = x;
        this.Y = y;
        if(clickable){
            this._element.addEventListener("mousedown", (ev)=>{this.PointerDown(ev)});
            this._element.addEventListener("mouseup", (ev)=>{this.PointerUp(ev)});
        }
    }
    MoveTo(x,y,center){
        if(center){
            let nx = x - this._half_width;
            if(nx<0) nx = 0;
            else if(nx>this._parent._rect.width) nx= this._parent._rect.width;
            this.X = nx;

            let ny = y - this._half_height;
            if(ny<0) ny = 0;
            else if(ny>this._parent._rect.height) ny= this._parent._rect.height;
            this.Y = ny;
        }else{
            this.X = x;
            this.Y = y;
        }
    }
    Move(dx,dy){
        let nx = this._x + dx;
        if(nx>0 && nx<this._parent._rect.width){
            this.X = nx;
        }
        let ny = this._y + dy;
        if(ny>0 && ny<this._parent._rect.height){
            this.Y = ny;
        }
    }
    PointerDown(ev){
        this._parent.SetInteraction(this, ev.clientX, ev.clientY);
    }
    PointerUp(ev){
        this._parent.ClearInteraction();
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


class Desk
{
    constructor(){
        this._element = document.createElement("div");
        this._content = document.createElement("div");
        let remove = document.createElement("button");
        let clear = document.createElement("button");
        this._element.classList.add("desk");
        remove.classList.add("desk-delete");
        remove.addEventListener("click",()=>{this.Remove()});
        clear.classList.add("desk-clear");
        clear.addEventListener("click",()=>{this.Clear()});
        this._element.appendChild(remove);
        this._element.appendChild(clear);
        this._element.appendChild(this._content);
        this._drop = new Droppable(this._element);
        this._data = undefined;
        this._removeCB = undefined;
        this._clearCB = undefined;
    }
    get Element(){
        return this._element;
    }
    get Data(){
        return this._data;
    }
    SetData(value,displayprop){
        this._data = value;
        this._content.innerText = value[displayprop];
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

    Clear(){
        this._data = undefined;
        this._content.innerText = "";
        if(this._clearCB) this._clearCB(this);
    }

    Remove(){
        if(this._removeCB) this._removeCB(this);
    }

    Highlight(enable){
        if(enable){this.Element.classList.add("highlight")}
        else{this.Element.classList.remove("highlight")};
    }
}

class DeskManager
{
    constructor(id){
        this._frame = new MoveFrame(id);
        this._frame.OnPointerMove((x,y,state)=>{this.PointerMove(x,y,state)})
        this._desks = [];
        this._newDeskCB = undefined;
        this._interactiveAdd = false;
        let interactive = document.createElement("div");
        interactive.classList.add("desk");
        interactive.classList.add("interactive");
        this._interactive = this._frame.AddObject(0,0,interactive, false);
        this._interactive.Hidden = true;
    }

    set GridSize(value){
        this._frame.GridSize = value;
    }

    set InteractiveAdd(value){
        this._interactiveAdd = value;
        if(this._interactiveAdd){
            this._interactive.Hidden = false;
        }else{
            this._interactive.Hidden = true;
        }
    }

    OnNewDesk(callback){
        this._newDeskCB = callback;
    }

    Find(value,prop){
        return this._desks.find(d=>{
            if(d.Data) return d.Data[prop]===value
            else return false;
        });
    }
    NewDesk(x,y){
        x = x===undefined ? 0 : x;
        y = y===undefined ? 0 : y;
        let d = new Desk();
        this._frame.AddObject(x,y,d.Element,true);
        this._desks.push(d);
        if(this._newDeskCB) this._newDeskCB(d);
        return d;
    }
    Remove(desk){
        let idx = this._desks.indexOf(desk);
        if(idx >=0){
            this._desks.splice(idx,1);
        }
        desk.Element.remove();
    }

    PointerMove(x,y,state){
        if(this._interactiveAdd){
            this._interactive.MoveTo(x,y,true);
            if(state===true){
                this.NewDesk(this._interactive.X,this._interactive.Y);
            }
        }
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




//Build Class List Selections

let class_options = new ComboBox("class-selection");
Object.keys(Classes).forEach(key=>{
    class_options.AddItem(key,key);
});


const desk_manager = new DeskManager("desk-view");
desk_manager.GridSize = 10;
desk_manager.OnNewDesk((d)=>{
    d.OnDrop((obj)=>{
        d.SetData(obj,"name");
    });
    d.OnRemove((obj)=>{
        desk_manager.Remove(obj);
    });
});

class_options.SelectedItem = "2nd";
let currentList = new DragList("student-list");
currentList.SortKey = "lastname";
function SetStudentList(class_key){
    currentList.Clear();
    Classes[class_key].students.forEach(student=>{
        student.name = [student.firstname, student.lastname].join(" ");
       let item = currentList.AddItem(student.name, student);
       item.OnHover((obj, hover)=>{
            let desk = desk_manager.Find(obj.Data.uid,"uid");
            if(desk){
                desk.Highlight(hover);
            }
       })
    });
    currentList.Sort();
}
class_options.OnSelectedItemChanged((item)=>{
    SetStudentList(item.Data);
});

SetStudentList(class_options.SelectedItem.Data);

const student_filter = document.getElementById("student-filter");
student_filter.addEventListener("input",()=>{
    currentList.Filter(student_filter.value);
});


const sort_first = document.getElementById("sort-firstname");
sort_first.addEventListener("click",()=>{
    currentList.SortKey = "firstname";
    currentList.Sort();
});


const sort_last = document.getElementById("sort-lastname");
sort_last.addEventListener("click",()=>{
    currentList.SortKey = "lastname";
    currentList.Sort();
});


const add_desk = document.getElementById("add-desk");
add_desk.addEventListener("click",()=>{
    let d = desk_manager.NewDesk();
    
});

const quick_desk = document.getElementById("quick-desk");
quick_desk.addEventListener("click",()=>{
    quick_desk.classList.toggle("push-active");
    let active = quick_desk.classList.contains("push-active");
    desk_manager.InteractiveAdd = active;
});