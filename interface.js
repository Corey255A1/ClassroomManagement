
function toInt(value,def){
    let num = parseInt(value);
    if(isNaN(num)){
        num = def;
    }
    return num
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
        {firstname:"Samantha",lastname:"Butterscotch",uid:"7",properties:{
            "Absences":7,
            "Tardies":2,
            "Email":"samantha.butterscotch@grandviewhighschool.edu",
            "Birthday":"09/15/2009",
            "Gender":"Undisclosed",
            "Race":"Asian Pacific",
            "Native Language":"Vietnamese",
            "Bus Number":28,
            "Allergies":"Banana",
            "Grade":"7th",
            "Accessibility":["Vision Impairment","Extra Test Time","English as Second Language"]
        }},
        {firstname: "Wu",lastname: "Xingping",uid:"8",properties:{}},
        {firstname: "Robbie",lastname: "Jones",uid:"9",properties:{}},
        {firstname: "Robbie",lastname: "Jones",uid:"10",properties:{}},
        {firstname:"Connor",lastname:"Schwendeman",uid:"11",properties:{}},
        {firstname:"Alexis",lastname:"Lovelace",uid:"12",properties:{}},
        {firstname:"Samantha",lastname:"Butterscotch",uid:"13",properties:{}},
        {firstname: "Wu",lastname: "Xingping",uid:"14",properties:{}},
        {firstname: "Robbie",lastname: "Jones",uid:"15",properties:{}},
        {firstname: "Robbie",lastname: "Jones",uid:"16",properties:{}},
        {firstname:"Connor",lastname:"Schwendeman",uid:"17",properties:{}},
        {firstname:"Alexis",lastname:"Lovelace",uid:"18",properties:{}},
        {firstname:"Samantha",lastname:"Butterscotch",uid:"19",properties:{}},
        {firstname: "Wu",lastname: "Xingping",uid:"20",properties:{}},
        {firstname: "Robbie",lastname: "Jones",uid:"21",properties:{}},
        {firstname: "Robbie",lastname: "Jones",uid:"22",properties:{}},
    ]}
}

const DeskConfiguration = {
    "1st":[
        {x:100, y:100, data:{uid:"1"}},
        {x:200, y:150, data:{}}
    ]
}



//Student List Sidebar
//Build Class List Selections
const class_options = new ComboBox("class-selection");
Object.keys(Classes).forEach(key=>{
    class_options.AddItem(key,key);
});

class_options.SelectedItem = "2nd";
const student_list = new DragList("student-list");
student_list.SortKey = "lastname";
function SetStudentList(class_key){
    student_list.Clear();
    Classes[class_key].students.forEach(student=>{
       student.name = [student.firstname, student.lastname].join(" ");
       let studentitem = new StudentListItem(student.name, student); 
       let item = student_list.AddItem(studentitem);
    });
    student_list.Sort();
}
class_options.addSelectedItemChanged((ev)=>{
    SetStudentList(ev.detail.current.Data);
});

SetStudentList(class_options.SelectedItem.Data);

const student_filter = document.getElementById("student-filter-edit");
student_filter.addEventListener("input",()=>{
    let lower = student_filter.value.toLowerCase();
    student_list.AddFilter("name", item=>item.Data.name.toLowerCase().includes(lower));
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


//Tool Selection Content
//Dynamic Load Seating Chart Tool
const tool_insertion = document.getElementById("tool-insert");
const loaded_plugins = {};
function LoadPlugin(plugin_name, init){
    const previously_loaded = loaded_plugins[plugin_name]!==undefined
    fetch("plugins/"+plugin_name+".html").then(resp=>{
        resp.text().then(t=>{
            tool_insertion.innerHTML = t;
            if(previously_loaded){
                window[init](class_options, student_list, {classes:Classes, deskconfiguration:DeskConfiguration});
            }
            else{
                const plugin = document.createElement("script")
                plugin.setAttribute("src","plugins/"+plugin_name+".js");
                document.body.appendChild(plugin);
                plugin.addEventListener("load",()=>{
                    window[init](class_options, student_list, {classes:Classes, deskconfiguration:DeskConfiguration});
                })
                loaded_plugins[plugin_name] = plugin;
            }
        })
    });
}



function ProcessHashChange(){
    switch(window.location.hash){
        case "#student-info":
            LoadPlugin("studentinfo","LoadStudentInfo");
            break;
        case "#seating-chart":
            LoadPlugin("seatingchart","LoadSeatingChart");
            break;
        default:
            LoadPlugin("studentinfo","LoadStudentInfo");
            break;
    }
}


ProcessHashChange();

window.addEventListener("hashchange",ProcessHashChange);


// const tool_select = document.getElementById("tool-selection");
// tool_select.addEventListener("navcomboselected",(e)=>{
//     LoadPlugin(e.detail.dataset.plugin, e.detail.dataset.init);
// });
