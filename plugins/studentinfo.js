function LoadStudentInfo(class_options, student_list, data){
    const Classes = data.classes;
    const DeskConfiguration = data.deskconfiguration;

    const student_name = document.getElementById("studentname");
    const student_id = document.getElementById("studentid");

    function UpdateStudentDisplay(student){
        if(student!==undefined){
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