const express = require("express");
const fs = require('fs');
const path = require('path');


const Gyazo = require('gyazo-api');

let chrome = {};
let puppeteer;

const app = express();
app.use(express.json());
app.use(express.static(__dirname));


const GYAZA_ACCESS_TOKEN = '7PzEIcS3B2pRB1sMOOjtzBrGR4PX04ZH0ZfMc9bxRmk'
var gyazoClient = new Gyazo(GYAZA_ACCESS_TOKEN);

if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
     chrome = require("chrome-aws-lambda");
     puppeteer = require("puppeteer-core");
} else {
     puppeteer = require("puppeteer");
}

app.get("/", async (req, res) => {
     res.send("Server is running");
});

const isValidUrl = (urlString) => {
     var urlPattern = new RegExp(
          "^(https?:\\/\\/)?" + // validate protocol
          "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // validate domain name
          "((\\d{1,3}\\.){3}\\d{1,3}))" + // validate OR ip (v4) address
          "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // validate port and path
          "(\\?[;&a-z\\d%_.~+=-]*)?" + // validate query string
          "(\\#[-a-z\\d_]*)?$",
          "i"
     ); // validate fragment locator
     return !!urlPattern.test(urlString);
};

const uid = function(){
     return Date.now().toString(36) + Math.random().toString(36).substr(2);
 }

app.post("/", async (req, res) => {
     let options = {};

     const url = req?.body?.url;
     console.log(url);

     if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
          options = {
               args: [...chrome.args, "--hide-scrollbars", "--disable-web-security"],
               defaultViewport: chrome.defaultViewport,
               executablePath: await chrome.executablePath,
               headless: true,
               ignoreHTTPSErrors: true,
          };
     }

     if (!url) {
          return res.send("please enter website Url").status("404");
     }
     if (!isValidUrl(url)) {
          return res.send("URL is not valid").status("400");
     }

     try {
          let browser = await puppeteer.launch(options);

          const page = await browser.newPage();
          await page.goto(url);
          const content = await page.evaluate(() => document.body.innerText);
          console.log({ content });
          if (content) {


          }
          await browser.close();
          res.send({ content: `${content}` }).status("200");
     } catch (error) {
          res.send(error).status(404);
     }
});


app.post("/screenshot", async (req, res) => {
     let options = {};
     const url = req?.body?.url;


     if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
          options = {
               args: [...chrome.args, "--hide-scrollbars", "--disable-web-security"],
               defaultViewport: chrome.defaultViewport,
               executablePath: await chrome.executablePath,
               headless: true,
               ignoreHTTPSErrors: true,
          };
     }

     if (!url) {
          return res.send("please enter website Url").status("404");
     }
     if (!isValidUrl(url)) {
          return res.send("URL is not valid").status("400");
     }

     try {
          let browser = await puppeteer.launch(options);

          const page = await browser.newPage();
          await page.goto(url, { timeout:100000 });
          // await page.waitForLoadState('networkidle');
          const filePath = path.join(__dirname, './page.png');
          const screenshot = await page.screenshot({   fullPage: true, type: "png", encoding: 'binary' , });

          fs.writeFileSync('screenshot.png', screenshot);

      

          const gyazoRes = await gyazoClient.upload(screenshot);
          // console.log(gyazoRes?.data?);
          await browser.close();
          res.send({
               mesaage: "image upload successfully",
               imageUrl: gyazoRes?.data?.url,
               data: gyazoRes?.data
          }).status("200");

          

     } catch (error) {
          console.log(error);
          // res.send({
          //      mesaage: "Internal Server Error",
          //      error: error
          // }).status(500);  
           res.send( error).status(500);
     }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
     console.log("Server is running on port", PORT);
});