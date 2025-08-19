console.log(pm.variables.get("existingStudentId"))
// Check the student was successfully updated 
pm.sendRequest({
    header: { ...pm.environment.get("AuthHeader") },
    url: pm.environment.get("BaseURL") + "/students/" + pm.variables.get("existingStudentId"),
    method: 'GET'
}, function (err, res) {
    pm.test("Status code is 200", function () {
        pm.expect(res.code).to.equal(200);
    });

    const responseBody = res.json();
    
    pm.test("Student was updated successfully", function () {
        pm.expect(responseBody).to.deep.equal({
            sId: pm.variables.get("existingStudentId"),
            name: "Updated postman student name",
            GPA: null
        });
    });
})
