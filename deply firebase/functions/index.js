
const express = require("express");
const functions = require('firebase-functions');
const admin = require("firebase-admin");


var serviceAccount = require("./webscraping-a4be4-firebase-adminsdk-lsxwq-7cda13aed9.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

let chrome = {};

let puppeteer;

const app = express();
app.use(express.json());


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
          await page.goto(url,{timeout:10000});
          const content = await page.evaluate(() => document.body.innerText);
          console.log({content});
          if(content){

     
          }
          await browser.close();
          res.send({content:`${content}`} ).status("200");
     } catch (error) {
          res.send( error ).status(404);
     }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
     console.log("Server is running on port", PORT);
});

exports.app = functions.https.onRequest(app)

