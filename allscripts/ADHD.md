// start a server on port 9191
var http = require('http'); 
var fs = require('fs');
var path = require('path');
let S3 = require("aws-sdk/clients/s3")
const puppeteer = require("puppeteer");
var uuid = require("uuid");
var server = http.createServer(function(req, res) {
    res.writeHead(200);
    res.end('hello world');
    }
);
(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://www.netmeds.com/prescriptions/adhd');
    const data = await page.evaluate(() => {
        // extract the <a></a> tags from prescriptions_products div
        const anchors = Array.from(document.querySelectorAll('.prescriptions_products .alpha-drug-list li .panel-body ul li a'));
        // extract the href attribute from the <a></a> tags
        return anchors.map(anchor => anchor.href);
    });
    let name = [];
    const characters ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    function generateString(length) {
    let result = ' ';
    const charactersLength = characters.length;
    for ( let i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
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
        console.log(data1)
        // go to image url and download the image and upload to s3 bucket

        for(var l = 0; l < data1.medicineImage.length; l++) {
            var url = data1.medicineImage[l];
            var filename = path.basename(url);
            console.log(filename);
            await page.goto(url);
            await page.screenshot(
                {
                path: filename,
            });
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
            fs.unlinkSync(filename);
        }
        for(var j = 0; j < data1.medicineImage.length; j++) {
            const image =  data1.medicineImage[j].substring(data1.medicineImage[j].lastIndexOf('/') + 1);
            data1.medicineImage[j] = "https://usc1.contabostorage.com/f49065475849480fbcd19fb8279b2f98:medstown/"+image;
        }
        name.push(data1);
    }
    console.log(name);
    fs.writeFileSync('adhd.json', JSON.stringify(name), function (err) {
        if (err) throw err;
        console.log('complete');
    });
    await browser.close();
    // PRESS CTRL + C TO STOP THE SERVER
    await server.close();
})();
server.listen(9191);
