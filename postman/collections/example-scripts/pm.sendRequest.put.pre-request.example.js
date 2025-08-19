pm.sendRequest({
    url: pm.environment.get("baseUrl") + "/students",
    method: 'POST',
    header: {
        'Content-Type': 'application/json',
        ...pm.environment.get("AuthHeader")
    },
    body: {
        mode: 'raw',
        raw: JSON.stringify({
            name: "Existing postman student name"
        })
    }
}, function (err, res) {
    pm.variables.set("existingStudentId", res.json());

    // Check the student was created successfully and get etag
    pm.sendRequest({
        header: { ...pm.environment.get("AuthHeader") },
        url: pm.environment.get("baseUrl") + "/students/" + pm.variables.get("existingStudentId"),
        method: 'GET'
    }, function (err, res) {
        pm.test("Status code is 200", function () {
            pm.expect(res.code).to.equal(200);
        });

        const etagHeader = res.headers.get('ETag');

        //console.log(etagHeader)
        pm.variables.set('existingStudentETag', etagHeader);
    });
});
