pm.sendRequest({
    url: pm.request.url.toString() + `/${pm.response.json()}`,
    method: 'GET'
}, function (err, res) {
    pm.test("Status code is 200", function () {
        pm.expect(res.code).to.equal(200);
    });

    const responseBody = res.json();

    pm.test("Response body matches the posted student", function () {
        pm.expect(responseBody).to.deep.equal({
            sId: pm.response.json(),
            GPA: null,
            ...JSON.parse(pm.request.body.raw)
        });
    });
});


//Cleanup 
let sId = pm.response.json();
// Send DELETE request to /students/{sId}
pm.sendRequest({
    url: pm.request.url.toString() + `/${sId}`,
    method: 'DELETE',
}, function (err, res) {
    pm.test("DELETE request status code is 200", function () {
        pm.expect(res.code).to.equal(200);
    });
});