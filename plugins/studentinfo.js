function LoadStudentInfo(class_options, student_list, data){
    const Classes = data.classes;
    const DeskConfiguration = data.deskconfiguration;

    const student_name = document.getElementById("student-name");
    const student_id = document.getElementById("student-id");
    const student_data_personal = document.getElementById("student-data-personal");
    const student_data_school = document.getElementById("student-data-school");

    function BuildTable(properties){
        let personal_table = new DataTable();
        personal_table.Element.classList.add("report");
        personal_table.Element.classList.add("color2");
        personal_table.AddHeader("property");
        personal_table.AddHeader("value");
        Object.keys(properties).forEach((k)=>{
            let row = personal_table.AddRow();
            row.SetField("property", k,["color3","property-field"]);
            row.SetField("value", properties[k],["value-field"]);
        })
        return personal_table;
    }
    function UpdateStudentDisplay(student){
        if(student!==undefined){
            if(student_data_personal.children[0] !== undefined)
                student_data_personal.children[0].remove();

            if(student_data_school.children[0] !== undefined)
                student_data_school.children[0].remove();
            
            let personal_table = BuildTable(student.properties.personal);
            student_data_personal.appendChild(personal_table.Element);

            let school_table = BuildTable(student.properties.school);
            student_data_school.appendChild(school_table.Element);

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