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
            return Classes[item.Data].students.find(s=>s.uid==data.uid);
        }
        return undefined;
    });
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




const desk_manager = new DeskManager("desk-view");
const desk_count = document.getElementById("desk-count");
desk_manager.GridSize = 10;
desk_manager.OnDeskListModified((desk, added)=>{
    if(added){
        desk.DisplayFormat = (data)=>{
            return data["name"];
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