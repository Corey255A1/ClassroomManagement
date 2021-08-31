
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