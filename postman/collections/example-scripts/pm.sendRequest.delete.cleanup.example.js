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