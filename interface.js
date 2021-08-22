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
        this._rect = this._element.getBoundingClientRect();
        this._pageX = this._rect.x;
        this._pageY = this._rect.y;
        this._objects = [];
        this._current_interaction = undefined;
        this._lastX = 0;
        this._lastY = 0;
        this._grid_size = 5;
    }
    get Element(){
        return this._element;
    }
    set GridSize(value){
        this._grid_size = value;
    }
    RoundToGrid(value){
        return Math.floor(value/this._grid_size)*this._grid_size;
    }
    AddObject(x,y,element){
        let moveable = new Moveable(x,y,element, this);
        this._objects.push(moveable);
        this._element.appendChild(element);
    }
    PointerMove(ev){
        if(this._current_interaction){
            let x = this.RoundToGrid(ev.clientX - this._pageX);
            let y = this.RoundToGrid(ev.clientY - this._pageY);
            let dX = x - this._lastX;
            let dY = y - this._lastY;
            this._current_interaction.Move(dX,dY);
            this._lastX = x;
            this._lastY = y;
        }
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
    constructor(x, y, element, parent){
        this._element = element;
        this._parent = parent;
        this._x = undefined;
        this._y = undefined;
        this.X = x;
        this.Y = y;
        this._element.addEventListener("mousedown", (ev)=>{this.PointerDown(ev)});
        this._element.addEventListener("mouseup", (ev)=>{this.PointerUp(ev)});
    }
    Move(dx,dy){
        this.X = this._x + dx;
        this.Y = this._y + dy;
    }
    PointerDown(ev){
        this._parent.SetInteraction(this, ev.clientX, ev.clientY);
    }
    PointerUp(ev){
        this._parent.ClearInteraction();
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
        this._element.classList.add("desk");
        remove.classList.add("desk-delete");
        remove.addEventListener("click",()=>{this.Remove()});
        this._element.appendChild(remove);
        this._element.appendChild(this._content);
        this._drop = new Droppable(this._element);
        this._data = undefined;
        this._removeCB = undefined;
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
    OnDrop(cb){
        this._drop.OnDrop(cb);
    }
    OnRemove(cb){
        this._removeCB = cb;
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
        this._desks = [];
    }

    set GridSize(value){
        this._frame.GridSize = value;
    }

    Find(value,prop){
        return this._desks.find(d=>{
            if(d.Data) return d.Data[prop]===value
            else return false;
        });
    }
    NewDesk(){
        let d = new Desk();
        this._frame.AddObject(0,0,d.Element);
        this._desks.push(d);
        return d;
    }
    Remove(desk){
        let idx = this._desks.indexOf(desk);
        if(idx >=0){
            this._desks.splice(idx,1);
        }
        desk.Element.remove();
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
    d.OnDrop((obj)=>{
        d.SetData(obj,"name");
    });
    d.OnRemove((obj)=>{
        desk_manager.Remove(obj);
    })
});

