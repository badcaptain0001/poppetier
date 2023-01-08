var http = require('http'); 
var fs = require('fs');
var path = require('path');
let S3 = require("aws-sdk/clients/s3")
const puppeteer = require("puppeteer");
const mongoose = require("mongoose");
mongoose.connect("mongodb+srv://rishabh:Evlvrjg1@cluster0.owgjy.mongodb.net/medicodb?retryWrites=true&w=majority", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
const medicineSchema = new mongoose.Schema({
    medicineName: {type: String, default: null},
    medicineType: {type: String, default: null},
    medicineCompany: {type: String, default: null},
    medicinePrice: {type: String, default: null},
    medicineQuantity: {type: String, default: null},
    medicineImage: {type: Array, default: []},
    medicineLeaf: {type: String, default: null},
    medicineId: {type: String, default: null},
    dateOfRegistration: {type: String, default: null},
    dateOfUpdate: {type: String, default: null},
    medicineDescription: {type: String, default: null},
    rxRequired: {type: Boolean, default: false},
    disease: {type: String, default: null},
});
(async () => {
    const browser = await puppeteer.launch();
    console.log("browser launched");
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(0);
    await page.goto('https://www.netmeds.com/non-prescriptions/covid-essentials/page/1');
    const data = await page.evaluate(() => {
        // extract the <a></a> tags from prescriptions_products div
        const anchors = Array.from(document.querySelectorAll('.drug-list-page .right-block .white-bg .all-product .row a'));
        let totalCount = document.querySelector('#total_count')?.innerText;
        // extract the href attribute from the <a></a> tags
        return ({
            totalCount: totalCount,
            anchors: anchors.map(anchor => anchor.href).filter(url => url.includes('non-prescriptions') && !url.includes('/manufacturers/') && !url.includes("/covid-essentials/")),
        })

    });
    if(parseFloat(data.totalCount/20) > 0.5) {
        var totalPage = Math.ceil(parseFloat(data.totalCount/20));
    } else {
        var totalPage = Math.floor(parseFloat(data.totalCount/20));
    }
    console.log(totalPage);
    let arr = [];
    for(let i = 2; i <= totalPage; i++) {
        await page.goto(`https://www.netmeds.com/non-prescriptions/covid-essentials/page/${i}`);
        const data2 = await page.evaluate(() => {
            // extract the <a></a> tags from prescriptions_products div
            const anchors = Array.from(document.querySelectorAll('.drug-list-page .right-block .white-bg .all-product .row a'));
            // extract the href attribute from the <a></a> tags
            return ({
                anchors: anchors.map(anchor => anchor.href).filter(url => url.includes('non-prescriptions') && !url.includes('/manufacturers/') && !url.includes("/covid-essentials/")),
            })
        });
        data.anchors = data.anchors.concat(data2.anchors);
        arr.push(data2.anchors);
    }
    // console.log(data.anchors);
    // store in a json file
    fs.writeFileSync('non.json', JSON.stringify(data.anchors));
    for(let i = 0; i < data.anchors.length; i++) {
        
    }
    await page.close();
    await browser.close();
})();
