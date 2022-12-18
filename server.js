// start a server on port 9191
var http = require('http'); 
var fs = require('fs');
var path = require('path');
let S3 = require("aws-sdk/clients/s3")
const puppeteer = require("puppeteer");
const mongoose = require("mongoose");
var uuid = require("uuid");
var server = http.createServer(function(req, res) {
    res.writeHead(200);
    res.end('hello world');
    }
);
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
    await page.goto('https://www.netmeds.com/prescriptions/electrolytes');
    const data = await page.evaluate(() => {
        // extract the <a></a> tags from prescriptions_products div
        const anchors = Array.from(document.querySelectorAll('.prescriptions_products .alpha-drug-list li .panel-body ul li a'));
        // extract the href attribute from the <a></a> tags
        return anchors.map(anchor => anchor.href);
    });
    let name = [];
    for (var i = 0; i < data.length; i++) {
        await page.goto(data[i]);
        let data1 = await page.evaluate(() => {
            let anchors = Array.from(document.querySelectorAll('.ga-vertical-gallery .slider-main div img')) === (undefined || null) ? '' : Array.from(document.querySelectorAll('.ga-vertical-gallery .slider-main div img'));
            return ({
                medicineName: document.querySelector('.product-top .product-detail h1')?.innerText,
                disease: document.querySelector('.product-top .product-detail .gen_drug')?.innerText,
                rxRequired: document.querySelector('.req_Rx')?.innerText === "Rx required" ? true : false,
                medicineType: document.querySelector('.product-top .product-detail .drug-manu')?.innerText,
                medicinePrice: parseInt(document.querySelector('.product-top .essentials .price-box .final-price')?.innerText.replace('Best Price* ₹ ', '')),
                medicineCompany: document.querySelector('.product-top .essentials .drug-con .drug-manu')?.innerText.replace('* Mkt: ', ''),
                medicineDescription: document.querySelector('.drug-content .product_desc_info')?.innerText.substring(document.querySelector('.drug-content .product_desc_info').innerText.indexOf('INTRODUCTION') + 12, document.querySelector('.drug-content .product_desc_info').innerText.indexOf('USES OF')).replace(/\\n/g," "),
                medicineImage:  [...new Set(anchors.map(anchor => anchor.src))],
                medicineId: "MED" + Math.floor(Math.random().toString().substring(2, 10)),
                dateOfRegistration: new Date().toISOString(),
            })
        });
        // go to image url and download the image and upload to s3 bucket

        for(var l = 0; l < data1.medicineImage.length; l++) {
            var url = data1.medicineImage[l];
            var filename = path.basename(url);
            console.log(filename);
            await page.goto(url);
            // add screenshot to  images folder
            await page.screenshot({path: filename});
            let s3 = new S3({
                endpoint: "https://usc1.contabostorage.com/medstown",
                accessKeyId: "8fe5f069ca4c4b50bd74c7adf18fcf75",
                secretAccessKey: "90ea5d8271241f37b3e248ecee1843ff",
                s3BucketEndpoint: true,
                publicReadAccess: true,
            });
            let fileContent = fs.readFileSync(filename);
            let params = {
                Bucket: "medstown",
                Key: filename,
                Body: fileContent,
                ACL: "public-read",
                ContentDisposition: "inline",
                ContentType: "image/jpeg, image/png, image/jpg , image/gif , image/svg+xml , image/webp , image/avif",
            };
            s3.upload(params, function (err, data) {
                if (err) {
                    throw err;
                }
                console.log(`File uploaded successfully`);
            });
            
        }
        for(var j = 0; j < data1.medicineImage.length; j++) {
            const image =  data1.medicineImage[j].substring(data1.medicineImage[j].lastIndexOf('/') + 1);
            data1.medicineImage[j] = "https://usc1.contabostorage.com/f49065475849480fbcd19fb8279b2f98:medstown/"+image;
        }
        name.push(data1);
        // add data in mongodb database
        const Medicine = mongoose.model("Medicinedb", medicineSchema);
        const medicine = new Medicine({
            medicineName: data1.medicineName,
            medicineId: data1.medicineId,
            medicineType: data1.medicineType,
            medicinePrice: data1.medicinePrice,
            medicineCompany: data1.medicineCompany,
            medicineDescription: data1.medicineDescription,
            medicineImage: data1.medicineImage,
            disease: data1.disease,
            rxRequired: data1.rxRequired,
            dateOfRegistration: data1.dateOfRegistration,
        });
        await medicine.save();
        console.log("data saved");
    }
    console.log(name.length);
    console.log("Please Close the server");
    await page.close();
    await browser.close();
})();
server.listen(9191);
