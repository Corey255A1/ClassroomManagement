function LoadStudentInfo(class_options, student_list, data){
    const Classes = data.classes;
    const DeskConfiguration = data.deskconfiguration;

    const student_name = document.getElementById("student-name");
    const student_id = document.getElementById("student-id");
    const student_data = document.getElementById("student-data");

    function UpdateStudentDisplay(student){
        if(student!==undefined){
            let table = new DataTable();
            table.AddHeader("property");
            table.AddHeader("value");
            Object.keys(student.properties).forEach((k)=>{
                let row = table.AddRow();
                row.SetField("property", k);
                row.SetField("value", student.properties[k]);
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