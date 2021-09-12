function LoadStudentInfo(class_options, student_list, data){
    const Classes = data.classes;
    const DeskConfiguration = data.deskconfiguration;

    const student_name = document.getElementById("student-name");
    const student_id = document.getElementById("student-id");
    const student_data = document.getElementById("student-data");

    function UpdateStudentDisplay(student){
        if(student!==undefined){
            if(student_data.children[0] !== undefined)
                student_data.children[0].remove();
            let table = new DataTable();
            table.Element.classList.add("report");
            table.Element.classList.add("color2");
            table.AddHeader("property");
            table.AddHeader("value");
            Object.keys(student.properties).forEach((k)=>{
                let row = table.AddRow();
                row.SetField("property", k,["color3","property-field"]);
                row.SetField("value", student.properties[k],["value-field"]);
            })
            
            student_data.appendChild(table.Element);
            student_name.textContent = student.name;
            student_id.textContent = student.uid;
        }
    }
    if(student_list.SelectedItem !== undefined){
        UpdateStudentDisplay(student_list.SelectedItem.Data);
    }
    

    student_list.addOnItemSelected((e)=>{
        console.log(e.detail.dataobject.Data);
        const student= e.detail.dataobject.Data;
        UpdateStudentDisplay(student);
    })
}